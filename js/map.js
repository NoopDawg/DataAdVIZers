class MapVis {
    constructor(_parentElement,
                statesGeoJSON,
                mapData,
                _eventHandler) {
        this.parentElement = _parentElement;
        this.statesGeoJSON = statesGeoJSON
        this.data = mapData;
        this.incomeData = mapData.incomeData;
        this.stateHpiData = mapData.stateHpiData;
        this.dateMax = d3.max([d3.min(this.incomeData, d => d.date), d3.min(this.stateHpiData, d => d.date)])

        this.current_listing_prices = mapData.currentMedianPrices;

        this.maxWidth = 60
        this.maxHeight = 60

        //tilt parameters -- BE CAREFUL CHANGING THESE
        this.tilt_angle = 14;
        this.perspective = 1700;

        this.states = statesGeoJSON.features.map(d => d.properties.name);
        this.eventHandler = _eventHandler;
        this.data = [];
        this.displayData = [];
        this.charts = {};

        this.minColor = "#EFD5AE";
        this.maxColor = "#E58800";
        this.barHeightMax = 200
        this.barWidth = 10

        //when projection calculation didn't match perfectly, manual adjustments were made here
        this.state_adjustments = {
            "Alabama": [0, -20],
            "Alaska": [0, -30],
            "Arizona": [0, 0],
            "Arkansas": [0, 0],
            "California": [0, 0],
            "Colorado": [0, -20],
            "Connecticut": [0, 0],
            "Delaware": [10, -20],
            "District of Columbia": [0, 0],
            "Florida": [20, -20],
            "Georgia": [0, 0],
            "Hawaii": [18, -5],
            "Idaho": [0, 0],
            "Illinois": [0, -35],
            "Indiana": [10, -20],
            "Iowa": [0, 0],
            "Kansas": [-20, -20],
            "Kentucky": [0, -30],
            "Louisiana": [0,-20],
            "Maine": [0, 10],
            "Maryland": [10, -20],
            "Massachusetts": [20, -10],
            "Michigan": [20, 0],
            "Minnesota": [0, 0],
            "Mississippi": [0, -20],
            "Missouri": [0, -20],
            "Montana": [-30, 20],
            "Nebraska": [30, 0],
            "Nevada": [0, 0],
            "New Hampshire": [0, 0],
            "New Jersey": [10, -10],
            "New Mexico": [10, -30],
            "New York": [0, 0],
            "North Carolina": [20, -20],
            "North Dakota": [10, 10],
            "Ohio": [0, -20],
            "Oklahoma": [0, -25],
            "Oregon": [0, 0],
            "Pennsylvania": [0, -20],
            "Rhode Island": [10, -5],
            "South Carolina": [-10, -30],
            "South Dakota": [-10, 0],
            "Tennessee": [-25, -25],
            "Texas": [-20, -60],
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
        self.width = 900
            // document.getElementById(self.parentElement).getBoundingClientRect().width - self.margin.left - self.margin.right;
        self.height = 600
            // document.getElementById(self.parentElement).getBoundingClientRect().height - self.margin.top - self.margin.bottom;

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
            .scale(1000)  // Adjust as needed
            .translate([self.width/2, self.height/2]);  // Adjust as needed

        self.path = d3.geoPath().projection(self.projection);


        self.final_pct_diffs = self.states.map(stateName => self.getStateFinalPctChange(stateName)).filter(d => d != null);
        console.log(self.final_pct_diffs)
        //color scale
        self.colorScale = d3.scaleLinear()
            .range([self.minColor, self.maxColor])  // Colors for housing prices
            .domain(
                [
                    d3.min(self.final_pct_diffs),
                    d3.max(self.final_pct_diffs)
                ]
            )

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
            .style("fill", function(d) {
                return self.colorScale(self.getStateFinalPctChange(d.properties.name));
            })
            .style("stroke", "black")
            .style("stroke-width", 0.5)
            .style("opacity", 0.8)
            .on("mouseover", function(event, d) {
                //change color
                d3.select(this).style("fill", "var(--tiffany-blue)");
                let stateName = d.properties.name
                self.eventHandler.trigger("stateSelectionChanged", d.properties.name)
            })
            .on("mouseout", function(event, d) {
                //change color
                d3.select(this).style("fill", self.colorScale(self.getStateFinalPctChange(d.properties.name)   ));

            })
            .on("click", function(event, d) {
                let state_median_price = self.getStateMedianListPrice(d.properties.name)
                console.log(state_median_price)
                let totalLoanInput = document.getElementById("totalLoan")
                totalLoanInput.value = state_median_price
                totalLoanInput.dispatchEvent(new Event('blur'))

                let downPaymentInput = document.getElementById("downPayment")
                downPaymentInput.value = state_median_price * 0.2
                downPaymentInput.dispatchEvent(new Event('blur'))

                calculatePayment()
            });


        let maxPct_change = d3.max([d3.max(self.stateHpiData, d => d.pct_change),d3.max(self.incomeData, d => d.pct_change)])
        self.lineXScale = d3.scaleLinear().range([0, self.maxWidth]).domain(d3.extent(self.incomeData, d => d.date))
        self.lineYScale = d3.scaleLinear().range([0, self.maxHeight]).domain([0, maxPct_change])



        self.barYScale = d3.scaleLinear().range([0, self.barHeightMax]).domain(
            [
                d3.min(self.current_listing_prices, d => d.median_listing_price) * 0.5,
                d3.max(self.current_listing_prices, d => d.median_listing_price)
            ]
        )

        self.addSpikes()
        self.addSpikeLegend()
        self.addLegend()
    }

    addSpikes() {
        const self = this;

        let context = self.canvas.node().getContext('2d');
        context.clearRect(0, 0, self.width, self.height);

        self.states.forEach(state=> {
            if (state == "District of Columbia") { //was too confusing to include, plus no hover ability
                console.log("DC");
                return
            }
            let stateData = self.getStateData(state);
            let position = self.getStatePosition(state);

            position = self.adjustPosition(position, state)


            let barHeight = self.barYScale(stateData.current_listing_prices.median_listing_price)
            //Bar Graph
            self.drawBarForState(position, barHeight, context)
        })
    }

    addSpikeLegend() {
        const self = this;

        let lineStyle = 'rgba(0,0,0,0.7)';

        self.legend_margin = { top: 60, right: 10, bottom: 20, left: 10 }; //nothing needed
        self.spikeLegendWidth = (self.barWidth + self.legend_margin.left + self.legend_margin.right + 50) * 2
        self.spikeLegendHeight = (self.barHeightMax + self.legend_margin.top + self.legend_margin.bottom)
        self.spikeLegend = d3.select("#spike-legend-canvas")
            .attr("width", self.spikeLegendWidth)
            .attr("height",self.spikeLegendHeight)
            .attr("class", "plot-canvas")


        let context = self.spikeLegend.node().getContext('2d');

        //make white background
        context.clearRect(0, 0, self.spikeLegendWidth, self.spikeLegendHeight);
        context.fillStyle = "rgba(255, 255, 255, 0.8)";
        context.fillRect(0, 0, self.spikeLegendWidth, self.spikeLegendHeight);


        //minimum bar
        let minMedianPrice = d3.min(self.current_listing_prices, d => d.median_listing_price)
        let minBarHeight = self.barYScale(minMedianPrice)

        let minBarX = 50;
        self.drawBarForState({x: minBarX, y: self.spikeLegendHeight - 30}, minBarHeight, context, false)

        context.setLineDash([5, 5]); // Sets the dash pattern for the line [dash length, gap length]
        context.beginPath();
        let minDottedLineY = self.spikeLegendHeight - 30 - minBarHeight;
        context.moveTo(self.legend_margin.left, minDottedLineY);
        context.lineTo(self.spikeLegendWidth - self.legend_margin.right, minDottedLineY);
        context.strokeStyle = lineStyle; // Set the color of the dotted line
        context.stroke();
        context.setLineDash([]);

        // Label for the first spike
        context.fillStyle = "#000000"; // Black color for the text
        context.textAlign= "center";
        context.fillText("Min Price", minBarX, self.spikeLegendHeight - 10);


        //maximum bar
        let maxMedianPrice = d3.max(self.current_listing_prices, d => d.median_listing_price)
        let barHeightMax = self.barYScale(maxMedianPrice)

        let maxBarX = minBarX + 50;
        self.drawBarForState({x: maxBarX, y: self.spikeLegendHeight - 30}, barHeightMax, context, false)
        context.fillStyle = "#000000";

        // Label for the second spike
        context.fillText("Max Price", maxBarX, self.spikeLegendHeight - 10);

        context.setLineDash([5, 5]); // Sets the dash pattern for the line [dash length, gap length]
        context.beginPath();
        let maxDottedLineY = self.spikeLegendHeight - 30 - barHeightMax;
        context.moveTo(self.legend_margin.left, maxDottedLineY);
        context.lineTo(self.spikeLegendWidth - self.legend_margin.right, maxDottedLineY);
        context.strokeStyle = lineStyle; // Set the color of the dotted line
        context.stroke();
        context.setLineDash([]);


        context.textAlign= "left";
        context.fillText(minMedianPrice.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
            self.legend_margin.left, minDottedLineY - 8);

        context.fillText(maxMedianPrice.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0}),
            self.legend_margin.left, maxDottedLineY - 8);


        context.textAlign= "center";
        context.font = "14px sans-serif";
        context.fillText("2023 Median Price", self.spikeLegendWidth/2, 16 );


    }

    addLegend(){
        const self = this;
        // Create an SVG element for the legend
        let legendWidth = 300;
        let legendHeight = 30;

        let legend = d3.select("#legend")
            .append("svg")
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .append("g")
            .attr("transform", "translate(10,0)");

        // Create a linear gradient for the legend
        let legendGradient = legend.append("defs")
            .append("linearGradient")
            .attr("id", "legend-gradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%");

        legendGradient.append("stop")
            .attr("offset", "0%")
            .attr("style", "stop-color:" + self.minColor + ";stop-opacity:1");

        legendGradient.append("stop")
            .attr("offset", "100%")
            .attr("style", "stop-color:" + self.maxColor + ";stop-opacity:1");

        // Create a rectangle to display the gradient
        legend.append("rect")
            .attr("width", legendWidth - 20)
            .attr("height", legendHeight)
            .style("fill", "url(#legend-gradient)");
    }

    getStateData(stateName) {
        const self = this;
        let stateIncome = self.incomeData.filter(e => e.state == stateName);
        let stateHpi = self.stateHpiData.filter(e => e.state == stateName);
        let stateCurrentMedianPrice = self.current_listing_prices.filter(e => e.state == stateName);
        return {income: stateIncome, hpi: stateHpi, current_listing_prices: stateCurrentMedianPrice[0]}
    }

    getStateMedianListPrice(stateName) {
        const self = this;
        return self.current_listing_prices.filter(e => e.state == stateName)[0].median_listing_price
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

    getStateFinalPctChange(stateName) {
        const self = this;
        let stateData = self.getStateData(stateName);
        let stateHpi = stateData.hpi;
        if (stateHpi.length == 0) {
            return;
        }
        let stateHpiFinal = stateHpi[stateHpi.length - 1].pct_change;
        return stateHpiFinal;
    }

    /**
     * Manually adjust the position of the state label
     * @param position
     * @param stateName
     * @returns {*}
     */
    adjustPosition(position, stateName) {
        const self = this;
        let state_adj = self.state_adjustments[stateName]

        if (state_adj) {
            position.x += state_adj[0];
            position.y += state_adj[1];
        }
        return position;
    }


    drawBarForState(location, barHeight, context, apply_perspective = true){
        const self = this;
        let point;
        if (apply_perspective) {
            point = self.apply_perspective(location)
        } else {
            point = location
        }

        const baseX = point.x;
        const baseY = point.y;
        const barWidth = self.barWidth; // Set the width of the bar
        const radius = 5

        // Apply perspective calculations here
        // Calculate top coordinates after applying perspective
        const topX = baseX;
        const topY = baseY - barHeight; // Assuming no perspective for simplicity


        let blx, brx,
            tlx, trx

        blx = baseX - barWidth / 2;
        brx = baseX + barWidth / 2;
        tlx = topX - barWidth / 2;
        trx = topX + barWidth / 2;

        context.beginPath();
        context.moveTo(blx, baseY);
        context.lineTo((tlx + trx) /2, topY);
        // context.lineTo(trx, topY);
        context.lineTo(brx, baseY);
        context.arc(baseX, baseY, radius, 0, Math.PI, false);
        context.closePath();

        context.fillStyle = '#84121C'; // Set the color of the bar
        context.fillOpacity = 1;
        context.fill();
        //
        context.lineWidth = 1;
        context.strokeStyle = '#FFFFF'; // Set the color of the bar
        context.strokeOpacity = 1;
        context.stroke();
        context.fillStyle = "#000000";
    }

    drawSpike() {

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



}