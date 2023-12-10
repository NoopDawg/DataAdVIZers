class MapVis {
    constructor(_parentElement,
                statesGeoJSON,
                countyGeoJSON,
                mapData,
                _eventHandler) {
        this.parentElement = _parentElement;
        this.statesGeoJSON = statesGeoJSON
        this.countyGeoJSON = countyGeoJSON;
        this.data = mapData;
        this.incomeData = mapData.incomeData;
        this.stateHpiData = mapData.stateHpiData;


        this.current_listing_prices = mapData.currentMedianPrices;


        this.maxWidth = 60
        this.maxHeight = 60

        //tilt parameters -- BE CAREFUL CHANGING THESE
        this.tilt_angle = 17;
        this.perspective = 1700;

        this.states = statesGeoJSON.features.map(d => d.properties.name);
        this.eventHandler = _eventHandler;
        this.data = [];
        this.displayData = [];
        this.charts = {};

        this.minColor = "#94d2bdff";
        this.maxColor = "#ca6702ff";

        this.state_adjustments = {
            "Alabama": [0, -20],
            "Alaska": [0, -30],
            "Arizona": [0, 0],
            "Arkansas": [0, 0],
            "California": [0, 0],
            "Colorado": [0, 0],
            "Connecticut": [0, 0],
            "Delaware": [10, -20],
            "District of Columbia": [0, 0],
            "Florida": [20, -20],
            "Georgia": [0, 0],
            "Hawaii": [20, 0],
            "Idaho": [0, 0],
            "Illinois": [0, 0],
            "Indiana": [10, -20],
            "Iowa": [0, 0],
            "Kansas": [-20, -20],
            "Kentucky": [0, -30],
            "Louisiana": [0,-20],
            "Maine": [20, 20],
            "Maryland": [10, -20],
            "Massachusetts": [20, -10],
            "Michigan": [20, 0],
            "Minnesota": [0, 0],
            "Mississippi": [0, -20],
            "Missouri": [0, 0],
            "Montana": [0, 0],
            "Nebraska": [30, 0],
            "Nevada": [0, 0],
            "New Hampshire": [0, 0],
            "New Jersey": [10, -10],
            "New Mexico": [20, -30],
            "New York": [0, 0],
            "North Carolina": [20, -20],
            "North Dakota": [10, 10],
            "Ohio": [0, 0],
            "Oklahoma": [0, 0],
            "Oregon": [0, 0],
            "Pennsylvania": [0, 0],
            "Rhode Island": [10, -5],
            "South Carolina": [-10, -30],
            "South Dakota": [-10, 0],
            "Tennessee": [-25, -25],
            "Texas": [0, 0],
            "Utah": [0, 0],
            "Vermont": [0, 0],
            "Virginia": [10, -20],
            "Washington": [0, 30],
            "West Virginia": [0, -30],
            "Wisconsin": [0, 0],
            "Wyoming": [0, 0]
        };

        this.initVis()
    }



    initVis() {
        const self = this;

        self.margin = { top: 0, right: 0, bottom: 0, left: 0 }; //nothing needed
        self.width = document.getElementById(self.parentElement).getBoundingClientRect().width - self.margin.left - self.margin.right;
        self.height = document.getElementById(self.parentElement).getBoundingClientRect().height - self.margin.top - self.margin.bottom;

        //SVG Area
        self.svg = d3.select("#map-svg")
            .attr("width", self.width + self.margin.left + self.margin.right)
            .attr("height", self.height + self.margin.top + self.margin.bottom)
            .append("g")
            .attr("transform", `translate(${self.margin.left}, ${self.margin.top})`);

        // Init Canvas
        self.canvas = d3.select("#map-canvas")
            .attr("width", self.width + self.margin.left + self.margin.right)
            .attr("height", self.height + self.margin.top + self.margin.bottom)
            .attr("class", "plot-canvas")

        //Map Projection
        self.projection = d3.geoAlbersUsa()
            .scale(1500)  // Adjust as needed
            .translate([self.width/2, self.height/2]);  // Adjust as needed

        self.path = d3.geoPath().projection(self.projection);

        //color scale
        self.colorScale = d3.scaleLinear()
            .range([self.minColor, self.maxColor]);  // Colors for housing prices

        d3.select("#map-canvas").style("pointer-events", "none");

        self.svg.selectAll("path")
            .data(self.statesGeoJSON.features
            )
            .enter()
            .append("path")
            .attr("d", self.path)
            .attr("id", function(d) {
                return d.properties.name;
            })
            .style("fill", "white")
            .style("stroke", "black")
            .style("stroke-width", 0.5)
            .style("opacity", 0.8)
            .on("mouseover", function(event, d) {
                //change color
                d3.select(this).style("fill", "#f4a261ff");
                console.log(d)
                self.eventHandler.trigger("stateSelectionChanged", d.properties.name)
            })
            .on("mouseout", function(d) {
                //change color
                d3.select(this).style("fill", "white");
            })


        let maxPct_change = d3.max([d3.max(self.stateHpiData, d => d.pct_change),d3.max(self.incomeData, d => d.pct_change)])
        self.lineXScale = d3.scaleLinear().range([0, self.maxWidth]).domain(d3.extent(self.incomeData, d => d.date))
        self.lineYScale = d3.scaleLinear().range([0, self.maxHeight]).domain([0, maxPct_change])

        self.barHeightMax = 200

        self.barYScale = d3.scaleLinear().range([0, self.barHeightMax]).domain(
            [
                d3.min(self.current_listing_prices, d => d.median_listing_price) * 0.5,
                d3.max(self.current_listing_prices, d => d.median_listing_price)
            ]
        )

        let context = self.canvas.node().getContext('2d');
        context.clearRect(0, 0, self.width, self.height);

        self.states.forEach(state=> {
            console.log(state)
            if (state == "District of Columbia") { //was too confusing to include, plus no hover ability
                console.log("DC");
                return
            }
            let stateData = self.getStateData(state);
            let position = self.getStatePosition(state);

            position = self.adjustPosition(position, state)


            //Line Graph
            // self.drawLineGraph(stateData.hpi, position.x, position.y, context, {strokeStyle: "red", lineWidth: 1});
            // self.drawAndFillBetweenLines(stateData.income, stateData.hpi, position.x, position.y, context, {fillStyle: "green", lineWidth: 1})
            // self.drawLineGraph(stateData.income, position.x, position.y, context, {strokeStyle: "blue", lineWidth: 1});

            let barHeight = self.barYScale(stateData.current_listing_prices.median_listing_price)
            //Bar Graph
            self.drawBarForState(position, barHeight, context)
        })

    }

    getStateData(stateName) {
        const self = this;
        let stateIncome = self.incomeData.filter(e => e.state == stateName);
        let stateHpi = self.stateHpiData.filter(e => e.state == stateName);
        let stateCurrentMedianPrice = self.current_listing_prices.filter(e => e.state == stateName);
        return {income: stateIncome, hpi: stateHpi, current_listing_prices: stateCurrentMedianPrice[0]}
    }

    getStatePosition(stateName) {
        const self = this;
        // Find the GeoJSON feature for the given state
        const stateFeature = self.statesGeoJSON.features.find(d => d.properties.name === stateName);

        if (stateFeature) {
            // Use the D3 geoPath centroid method to calculate the centroid of the state
            const centroid = self.path.centroid(stateFeature);
            return { x: centroid[0], y: centroid[1] };
        } else {
            // Return a default position or handle the error as appropriate
            return { x: 0, y: 0 };
        }
    }

    adjustPosition(position, stateName) {
        const self = this;
        let state_adj = self.state_adjustments[stateName]

        if (state_adj) {
            position.x += state_adj[0];
            position.y += state_adj[1];
        }
        return position;
    }

    rotatePoint(point, angle, origin) {
        let radians = angle * Math.PI / 180;
        let sin = Math.sin(radians);
        let cos = Math.cos(radians);
        // Translate point to origin
        point.x -= origin.x;
        point.y -= origin.y;
        // Rotate point
        let xNew = point.x * cos - point.y * sin;
        let yNew = point.x * sin + point.y * cos;
        // Translate point back
        point.x = xNew + origin.x;
        point.y = yNew + origin.y;
        return point;
    }

    drawBarForState(stateCentroid, barHeight, context) {
        const self = this;
        let point = self.apply_perspective(stateCentroid)
        const baseX = point.x;
        const baseY = point.y;
        const barWidth = 10; // Set the width of the bar

        // Apply perspective calculations here
        // Calculate top coordinates after applying perspective
        const topX = baseX;
        const topY = baseY - barHeight; // Assuming no perspective for simplicity


        let blx, bly,
            brx, bry,
            tlx, tly,
            trx, tryy
        blx = baseX - barWidth / 2;

        brx = baseX + barWidth / 2;
        tlx = topX - barWidth / 2;
        trx = topX + barWidth / 2;

        context.beginPath();
        context.moveTo(blx, baseY);
        context.lineTo((tlx + trx) /2, topY);
        // context.lineTo(trx, topY);
        context.lineTo(brx, baseY);
        context.closePath();

        context.fillStyle = 'rgba(23,143,234,0.79)'; // Set the color of the bar
        context.fillOpacity = 1;
        context.fill();
        //
        context.lineWidth = 1;
        context.strokeStyle = 'rgba(0,89,157,0.79)'; // Set the color of the bar
        context.strokeOpacity = 1;
        context.stroke();
    }

    apply_perspective(point) {
        const self = this;
        let tilt_angle = self.tilt_angle;
        let canvas_height = self.height;
        let perspective = self.perspective;

        let x = point.x;
        let y = point.y;

        let tilt_radians  = tilt_angle * Math.PI / 180;

        let depth = (canvas_height - y)
        let perspective_factor = 1 / (1 + (depth / perspective))
        // console.log(perspective_factor)

        let center_x = self.width / 2
        let transformed_x = center_x + (x - center_x) * perspective_factor
        let apparent_y = y - (y * Math.sin(tilt_radians))
        let transformed_y = apparent_y + (canvas_height * Math.sin(tilt_radians))

        return {x: transformed_x, y: transformed_y}
    }

// Now use rotatedPoint.x and rotatedPoint.y for drawing on the canvas


    // Function to draw a line graph for a state
    drawLineGraph(stateData, positionX, positionY, context, config) {
        const self = this;
        let maxWidth = 30
        let maxHeight = 30
        let xScale = d3.scaleLinear().range([0, maxWidth]).domain(d3.extent(stateData, d => d.date))
        let yScale = d3.scaleLinear().range([0, maxHeight]).domain(d3.extent(stateData, d => d.pct_change))

        // console.log("x: ", positionX, " y: ", positionY)
        let xscale = 1
        let yscale = 10
        context.beginPath();
        stateData.forEach((point, index) => {
            // console.log(point)
            // Calculate x and y based on your data and position
            let x = positionX + (self.lineXScale(point.date)) - self.maxWidth/2; // scale is how much you scale your data point
            let y = positionY - (self.lineYScale(point.pct_change));// point.value is the data value

            // console.log("x: ", x, " y: ", y)
            let xy_point = {x: x, y: y}
            let origin = { x: self.width / 2, y: self.height };
            xy_point = self.apply_perspective(xy_point);

            if (index === 0) {
                context.moveTo(xy_point.x, xy_point.y);
            } else {
                context.lineTo(xy_point.x, xy_point.y);
            }
        });

        context.strokeStyle = config.strokeStyle; // Set the color of the line
        context.lineWidth = config.lineWidth; // Set the width of the line
        context.stroke();
    }

    // Function to draw and fill the area between two line graphs
    drawAndFillBetweenLines(stateDataIncome, stateDataHPI, positionX, positionY, context, config) {
        const self = this;

        // Start the path
        context.beginPath();

        // Draw the first line
        stateDataIncome.forEach((point, index) => {
            let x = positionX + (self.lineXScale(point.date)) - self.maxWidth/2;
            let y = positionY - (self.lineYScale(point.pct_change));

            let xy_point = {x: x, y: y}
            xy_point = self.apply_perspective(xy_point);

            if (index === 0) {
                context.moveTo(xy_point.x, xy_point.y);
            } else {
                context.lineTo(xy_point.x, xy_point.y);
            }
        });



        // Draw the second line in reverse
        for (let i = stateDataHPI.length - 1; i >= 0; i--) {
            let point = stateDataHPI[i];
            let x = positionX + (self.lineXScale(point.date)) - self.maxWidth/2;
            let y = positionY - (self.lineYScale(point.pct_change));

            let xy_point = {x: x, y: y}
            xy_point = self.apply_perspective(xy_point);

            context.lineTo(xy_point.x, xy_point.y);
        }

        // Close the path and fill
        context.closePath();
        context.fillStyle = 'rgba(255,0,0,0.38)'; // Set the fill color
        context.fillOpacity = 0.2
        context.fill();

        // Optional: If you also want to draw the lines
        context.lineWidth = config.lineWidth; // Set the width of the line
        context.strokeStyle = config.strokeStyle; // Set the color of the line
        context.stroke();
    }

    //sidepanel line graph
    updateLineGraph(){
        d3.select("#selection-line-chart").selectAll("svg").remove();


        let svg = d3.select("#selection-line-chart").append("svg")
            .attr("width", 300)
            .attr("height", 300)
            .append("g")
            .attr("transform", "translate(" + 50 + "," + 50 + ")");

    }



}