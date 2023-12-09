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

        this.incomeData.sort((a, b) => a.year - b.year)
        this.stateHpiData.sort((a, b) => (a.year + (0.1 * a.quarter)) - (b.year + (0.1 * b.quarter)))

        this.incomeData.forEach(d => {
            d.pct_change = (d.avg_annual_pay - this.incomeData[0].avg_annual_pay) * 100 / this.incomeData[0].avg_annual_pay
        })
        this.stateHpiData.forEach(d => {
            d.pct_change = (d.index_sa - this.stateHpiData[0].index_sa) * 100 / this.stateHpiData[0].index_sa
        })

        this.maxWidth = 60
        this.maxHeight = 60

        this.states = statesGeoJSON.features.map(d => d.properties.name);
        this.eventHandler = _eventHandler;
        this.data = [];
        this.displayData = [];
        this.charts = {};

        this.minColor = "#94d2bdff";
        this.maxColor = "#ca6702ff";

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
        self.canvas = d3.select("#line-graph-canvas")
            .attr("width", self.width + self.margin.left + self.margin.right)
            .attr("height", self.height + self.margin.top + self.margin.bottom)
            .attr("class", "plot-canvas")
            .attr('id', `map-canvas`);

        //Map Projection
        self.projection = d3.geoAlbersUsa()
            .scale(1000)  // Adjust as needed
            .translate([self.width/2, self.height/2]);  // Adjust as needed

        self.path = d3.geoPath().projection(self.projection);

        //color scale
        self.colorScale = d3.scaleLinear()
            .range([self.minColor, self.maxColor]);  // Colors for housing prices

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


        let maxPct_change = d3.max([d3.max(self.stateHpiData, d => d.pct_change),d3.max(self.incomeData, d => d.pct_change)])
        self.lineXScale = d3.scaleLinear().range([0, self.maxWidth]).domain(d3.extent(self.incomeData, d => d.date))
        self.lineYScale = d3.scaleLinear().range([0, self.maxHeight]).domain([0, maxPct_change])


        let context = self.canvas.node().getContext('2d');
        context.clearRect(0, 0, self.width, self.height);

        self.states.forEach(state=> {
            let stateData = self.getStateData(state);

            let position = self.getStatePosition(state);


            self.drawLineGraph(stateData.hpi, position.x, position.y, context, {strokeStyle: "red", lineWidth: 1});
            self.drawAndFillBetweenLines(stateData.income, stateData.hpi, position.x, position.y, context, {fillStyle: "green", lineWidth: 1})
            self.drawLineGraph(stateData.income, position.x, position.y, context, {strokeStyle: "blue", lineWidth: 1});
        })

    }

    getStateData(stateName) {
        const self = this;
        let stateIncome = self.incomeData.filter(e => e.state == stateName);
        let stateHpi = self.stateHpiData.filter(e => e.state == stateName);

        return {income: stateIncome, hpi: stateHpi}
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

            if (index === 0) {
                context.moveTo(x, y);
            } else {
                context.lineTo(x, y);
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
            if (index === 0) {
                context.moveTo(x, y);
            } else {
                context.lineTo(x, y);
            }
        });

        // Draw the second line in reverse
        for (let i = stateDataHPI.length - 1; i >= 0; i--) {
            let point = stateDataHPI[i];
            let x = positionX + (self.lineXScale(point.date)) - self.maxWidth/2;
            let y = positionY - (self.lineYScale(point.pct_change));
            context.lineTo(x, y);
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


    updateVis() {

    }


}