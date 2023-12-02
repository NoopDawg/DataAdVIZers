class LineChartBrush {

    constructor(_parentElement, _data, _eventHandler) {
        const self = this;
        this.parentElement = _parentElement;
        this.data = _data;
        this.eventHandler = _eventHandler;
        this.margins = {top: 20, bottom: 20, right: 20, left: 30}
        self.dateOptions = [...new Set(_data.map(d => d.period))].map(d => parseDateString(d));


        self.selectedDate = parseQuarterDate("2019-01");
        self.data.forEach(d => {
            d.date = parseDateString(d.date);
        })

        this.initVis();
    }

    initVis() {
        const self = this;

        self.width = document.getElementById(self.parentElement).getBoundingClientRect().width - self.margins.left - self.margins.right
        self.height = document.getElementById(self.parentElement)
            .getBoundingClientRect().height - self.margins.top - self.margins.bottom

        self.svg = d3.select("#" + self.parentElement).append("svg")
            .attr("class", "lineChartBrush")
            .attr("width", self.width + self.margins.left + self.margins.right)
            .attr("height", self.height + self.margins.top + self.margins.bottom)
            .append("g")
            .attr("transform", `translate(${self.margins.left}, ${self.margins.top})`)

        self.xScale = d3.scaleLinear()
            .domain(
                [
                    d3.min(self.data, d => d.ate),
                    d3.max(self.data, d => d.date)
                ]
            )
            .range([0, self.width]);

        self.yScale = d3.scaleLinear()
            .domain([d3.min(self.data, d => d.hpi), d3.max(self.data, d => d.hpi)])
            .range([self.height, 0]);

        self.xAxis = d3.axisBottom(self.xScale)
            .tickFormat(d3.timeFormat("%Y-Q%q"))
            .ticks(10);
        self.yAxis = d3.axisLeft(self.yScale).ticks(5);

        self.svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0, ${self.height})`)
            .call(self.xAxis)

        self.svg.append("g")
            .attr("class", "y-axis")
            .call(self.yAxis)

        self.line = d3.line()
            .x(d => self.xScale(d.date))
            .y(d => self.yScale(d.hpi))

        //Draw line
        self.svg.append("path")
            .datum(self.data)
            .attr("class", "line")
            .attr("d", self.line)
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("stroke-width", 1.5)



        // self.brush = d3.brushX()
        //     .extent([[0, 0], [self.width, self.height]])
        //     .on("brush end", function (event) {
        //         let selectedTimeRange = [
        //             self.xScale.invert(event.selection[0]),
        //             self.xScale.invert(event.selection[1])
        //         ];
        //         console.log(selectedTimeRange)
        //     });
        // Function to handle brush and drag events
        self.brushWidth = 10;

        function brushed(event) {
            if (event.sourceEvent && event.sourceEvent.type === "mousemove") {
                // Get the coordinates of the current brush position
                let brushCoords = d3.brushSelection(this);

                // Calculate the corresponding date range
                let dateRange = brushCoords.map(self.xScale.invert);

                // Adjust the brush window to fixed width
                let midPoint = (brushCoords[0] + brushCoords[1]) / 2;
                let newBrushCoords = [midPoint - self.brushWidth / 2, midPoint + self.brushWidth / 2];

                // Update the brush position (this makes the brush act like a slider)
                d3.select(this).call(self.brush.move, newBrushCoords);

                let middleDate = new Date(dateRange[0] + (dateRange[1] - dateRange[0]) / 2);
                let roundedMidDate = roundToQuarter(middleDate);

                self.eventHandler.trigger("selectionChanged", roundedMidDate);
            }
        }

        self.brush = d3.brushX()
            .extent([[0, 0], [self.width, self.height]])
            .on("start brush end", brushed);


        self.brushGroup = self.svg.append("g")
            .attr("class", "brush")
            .call(self.brush);

        // easier to remove the expansion handles than disable them
        self.brushGroup.selectAll(".handle").remove()


        self.brushGroup.call(self.brush.move, [0,self.brushWidth])
    }

    moveBrush(date) {
        const self = this;

        // Adjust the brush window to fixed width
        let midPoint = self.xScale(date);
        let newBrushCoords = [midPoint - self.brushWidth / 2, midPoint + self.brushWidth / 2];

        d3.select(".brush").call(self.brush.move, newBrushCoords);
    }

}