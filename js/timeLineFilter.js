class TimeLineFilter {
    constructor(_parentElement, _data, _eventHandler) {
        this.parentElement = _parentElement;
        this.data = _data;
        this.eventHandler = _eventHandler; // This can be used for handling custom events
        this.brushWidth = 10;

        // Define margins and calculate width and height as in file2
        this.margins = { top: 10, right: 40, bottom: 80, left: 60 };
        this.initChart();
        this.updateVisualization();
    }

    initChart() {
        const self = this;
        // Calculate width and height based on parent element
        self.width = document.getElementById(self.parentElement).getBoundingClientRect().width - self.margins.left - self.margins.right;
        self.height = document.getElementById(self.parentElement).getBoundingClientRect().height - self.margins.top - self.margins.bottom;

        // Create SVG and append it to parent element
        self.svg = d3.select("#" + self.parentElement).append("svg")
            .attr("width", self.width + self.margins.left + self.margins.right)
            .attr("height", self.height + self.margins.top + self.margins.bottom)
            .append("g")
            .attr("transform", `translate(${self.margins.left}, ${self.margins.top})`);

        // Initialize scales and axes
        self.maxDate = d3.max(self.data, d => d.Date)

        self.xScale = d3.scaleTime()
            .domain(
                [
                    d3.min(self.data, d => d.Date),
                    d3.max(self.data, d => d.Date)
                ]
            )
            .range([0, self.width - self.brushWidth])

        // self.yScale = d3.scaleLinear().range([self.height, 0]);
        self.xAxis = d3.axisBottom(self.xScale);
        // self.yAxis = d3.axisLeft(self.yScale);

        // Append axes to SVG
        self.svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(${self.brushWidth/2}, ${self.height/2})`)
            .call(self.xAxis)
            .append("title")
            .text("Date");


        // self.svg.append("g")
        //     .attr("class", "y-axis")
        //     .call(self.yAxis);

        // // Create the line generator
        // self.line = d3.line()
        //     .x(d => self.xScale(d.Date))
        //     .y(d => self.yScale(d.Sales))
        //     .curve(d3.curveCatmullRom.alpha(0.5));
        //
        // // Add the line to the SVG element
        // self.svg.append("path")
        //     .datum(self.data)
        //     .attr("class", "line")
        //     .attr("fill", "none")
        //     .attr("stroke", "var(--rufous)")
        //     .attr("stroke-linejoin", "round")
        //     .attr("stroke-linecap", "round")
        //     .attr("stroke-width", 1.5)
        //     .attr("d", self.line);



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

                // calculate the middle date of the brush window
                let middleDate = new Date(
                    dateRange[0].getTime() +
                    (dateRange[1].getTime() - dateRange[0].getTime()) / 2
                );

                let roundedMidDate = roundToQuarter(middleDate);

                //constrain to available data
                roundedMidDate = roundedMidDate > self.maxDate ? self.maxDate : roundedMidDate;

                self.eventHandler.trigger("selectionChanged", roundedMidDate);
            }
        }

        self.brush = d3.brushX()
            .extent([[0, 0], [self.width, self.height]])
            .on("start brush end", brushed);


        self.brushGroup = self.svg.append("g")
            .attr("class", "brush")
            .call(self.brush);

        self.brushGroup.selectAll(".overlay")
            .each(function() {
                d3.select(this).on("mousedown touchstart", function(event) {
                    event.stopPropagation(); // Stop mousedown event
                });
            });

        // easier to remove the expansion handles than disable them
        self.brushGroup.selectAll(".handle").remove()

        self.brushGroup.call(self.brush.move, [0,self.brushWidth])

    }

    updateVisualization() {
        const self = this;
        // let yColumn = document.getElementById("area").value;

        self.xScale.domain(d3.extent(self.data, d => d.Date));

        // self.yScale.domain(
        //     [
        //         d3.min(self.data, d => d[yColumn]),
        //         d3.max(self.data, d => d[yColumn])
        //     ]
        // );
        //
        // self.yAxis.scale(self.yScale).ticks(5);

        // Update the x axis on the SVG element
        self.svg.select(".x-axis")
            .transition()
            .duration(800)
            .call(self.xAxis);

        // Update the y axis on the SVG element
        // self.svg.select(".y-axis")
        //     .transition()
        //     .duration(800)
        //     .call(self.yAxis);

        // self.line.y(d => self.yScale(d[yColumn]));

        // self.svg.select(".line")
        //     .datum(self.data)
        //     .transition()
        //     .duration(800)
        //     .attr("d", self.line);


        // Additional functionalities from file1 to be implemented:
        // - Brush functionality
        // - Event handling for brush and other interactions
        // - Any additional interactivity or dynamic elements
    }

    moveBrush(date) {
        const self = this;

        // Adjust the brush window to fixed width
        let midPoint = self.xScale(date);
        let newBrushCoords = [midPoint - self.brushWidth / 2, midPoint + self.brushWidth / 2];

        d3.select(".brush")
            .transition()
            .duration(50)
            .call(self.brush.move, newBrushCoords);
    }

    // Additional methods from file1 to be implemented here
    // For example, handling brush events, updating elements based on brush selection, etc.
}
