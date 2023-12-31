// comparing the price of homes to annual household income from 1965
class DoubleLineChart {

    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data;

        this.data.income.sort((a, b) => new Date(a.period) - new Date(b.period));
        this.data.homePrice.sort((a, b) => new Date(a.period) - new Date(b.period));

        this.data.income.forEach(d => {
            d.pct_change = ((d.value - this.data.income[0].value) / this.data.income[0].value) * 100;
        })
        this.data.homePrice.forEach(d => {
            d.pct_change = ((d.value - this.data.homePrice[0].value) / this.data.homePrice[0].value) * 100;
        })

        // Combine the arrays
        this.combinedArray = [...data.homePrice, ...data.income];
        this.combinedArray.forEach(d => {
            d.period = new Date(d.period);
        });
        this.dateMax = new Date(d3.max(this.combinedArray, d => d.period));
        this.dateMin = new Date(d3.min(this.combinedArray, d => d.period));

        this.initVis();
    }

    initVis() {
        let vis = this;

        // Set up the SVG and chart dimensions
        vis.margin = { top: 20, right: 40, bottom: 85, left: 50 };
        vis.width = document.querySelector(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.querySelector(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // Append the SVG to the parent element
        vis.svg = d3.select(vis.parentElement)
            .append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        // clip paths
        vis.clipPath = vis.svg.append("defs").append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", vis.width)
            .attr("height", vis.height);

        // Set up scales
        vis.xScale = d3.scaleTime().range([0, vis.width]);
        vis.yScale = d3.scaleLinear().range([vis.height, 0]);


        // Add x-axis with ticks for the first month of each year
        const uniqueYears = Array.from(new Set(vis.combinedArray.map(d => d.period.getFullYear())));
        const showEveryOtherYear = uniqueYears.length > 20;

        vis.xAxis = vis.svg.append("g")
            .attr("transform", "translate(0," + vis.height + ")")
            .attr("class", "axis-ticks x-axis")


        vis.xAxis.call(d3.axisBottom(vis.xScale)
                .tickFormat(d3.timeFormat("%Y"))
                .tickPadding(10) // Adjust as needed
                .tickSizeOuter(0) // Optional: Hide ticks at the ends
            )



        // Add y-axis
        vis.yAxis = vis.svg.append("g")
            .attr("class", "axis-ticks y-axis")
            .call(d3.axisLeft(vis.yScale));

        // Add labels
        vis.svg.append("text")
            .attr("transform", "translate(" + (vis.width / 2) + " ," + (vis.height + 50) + ")")
            .style("text-anchor", "middle")
            .attr("class", "axis")
            .text("Year");

        vis.svg.append("text")
            .attr("class", "axis")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - 50)
            .attr("x", 0 - (vis.height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Percent Change (%)");

        // Add legend
        vis.svg.append("text")
            .attr("x", 30)
            .attr("y", 20)
            .attr("class", "legend")
            .style("fill", "var(--alloy-orange)")
            .text("Median House Price");

        vis.svg.append("text")
            .attr("x", 30)
            .attr("y", 50)
            .attr("class", "legend")
            .style("fill", "var(--auburn)")
            .text("Median Household Income");

        // Tooltips


        // Tooltip div for displaying values
        vis.tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .attr("id", "linechart-tooltip")
            .style("opacity", 0);

        // Vertical line for the tooltip
        vis.focusLine = vis.svg.append("line")
            .attr("class", "linechart-focus-line")
            .style("opacity", 1)
            .style("stroke", "var(--midnight-green)")
            .style("stroke-width", "1px")
            .attr("y1", 0)
            .attr("y2", vis.height);

        //Mouseover area
        vis.svg.append("rect")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .style("fill", "none")
            .style("pointer-events", "all")
            .on("mouseover", function() { vis.tooltip.style("opacity", 0.4); vis.focusLine.style("opacity", 0.4); })
            .on("mouseout", function() { vis.tooltip.style("opacity", 0); vis.focusLine.style("opacity", 0); })
            .on("mousemove", function(event) {
                let mouse = d3.pointer(event)
                let mouseX = mouse[0];

                // Get the x mouse position
                vis.updateTooltip(mouseX, event);
            });


        vis.wrangleData();
    }


    filterDate(newDate){
        const vis = this;
        vis.dateMax = newDate;

        // console.log("filterDate triggered", vis.dateMax);
        vis.wrangleData()
    }

    wrangleData() {
        let vis = this;

        // Extract x and y values from the data
        vis.xValues = vis.combinedArray.filter(d => d.period <= vis.dateMax)
            .map(d => d.period);
        vis.homePrices = vis.data.homePrice
            .filter(d => d.period <= vis.dateMax)
            .map(d => d.pct_change);
        vis.incomes = vis.data.income.filter(d => d.period <= vis.dateMax)
            .map(d => d.pct_change);

        vis.updateVis();
    }


    updateVis() {
        let vis = this;
        // Set up scales
        // let xScale = d3.scaleTime().domain(d3.extent(vis.xValues)).range([0, vis.width]);
        vis.xScale.domain(d3.extent(vis.xValues))
        // let yScale = d3.scaleLinear().domain([0, d3.max([...vis.homePrices, ...vis.incomes])]).range([vis.height, 0]);
        vis.yScale.domain([0, d3.max([...vis.homePrices, ...vis.incomes])])


        const uniqueYears = Array.from(new Set(vis.xValues.map(d => d.getFullYear())));
        const showEveryOtherYear = uniqueYears.length > 20;
        // console.log("uniqueYears", uniqueYears);

        vis.xTickValues = vis.xValues.filter(d => {
            const year = d.getFullYear();
            const month = d.getMonth();
            if (showEveryOtherYear) {
                return uniqueYears.indexOf(year) % 2 === 0 && month === 0; // Show only first month of every other year
            } else {
                return month === 0; // Show only first month of every year
            }
        })

        vis.xAxis.call(
            d3.axisBottom(vis.xScale)
                .tickValues(vis.xTickValues)
                .tickFormat(d3.timeFormat("%Y"))
                .tickPadding(10) // Adjust as needed
                .tickSizeOuter(0) // Optional: Hide ticks at the ends
        );

        vis.xAxis.selectAll(".tick text")
            .style("text-anchor", "end")
            .attr("dx", "-0.5em")
            .attr("dy", "0.5em")
            .attr("transform", "rotate(-45)");

        // Define line functions
        let value1Line = d3.line()
          .x(d => vis.xScale(d.period))
          .y(d => vis.yScale(d.pct_change));
    
        let value2Line = d3.line()
          .x(d => vis.xScale(d.period))
          .y(d => vis.yScale(d.pct_change));


        // Select and update the first line, or create it if it doesn't exist
        vis.svg.selectAll(".value1-line")
            .data([
                vis.data.homePrice.filter(d => {  // Filter out any data points that are outside the y-axis scale
                    return (vis.yScale(d.pct_change) >=0)
                })
            ])
            .join(
                enter => enter.append("path")
                    .attr("class", "line value1-line")
                    .attr("fill", "none")
                    .attr("stroke", "var(--alloy-orange)"),
                update => update
            )
            .attr("d", value1Line);

        // Select and update the second line, or create it if it doesn't exist
        vis.svg.selectAll(".value2-line")
            .data([vis.data.income])
            .join(
                enter => enter.append("path")
                    .attr("class", "line value2-line")
                    .attr("fill", "none")
                    .attr("stroke", "var(--auburn)"),
                update => update
            )
            .transition().duration(50).attr("d", value2Line);


        vis.svg.selectAll(".value1-line, .value2-line")
            .attr("clip-path", "url(#clip)");
    }

    updateTooltip(mouseX, event) {
        const vis = this;
        // Convert mouseX to a date using the inverse of the xScale
        const x0 = vis.xScale.invert(mouseX);

        // Find the nearest data points for both lines
        const nearestHomePrice = vis.getNearestDataPoint(vis.data.homePrice, x0);
        const nearestIncome = vis.getNearestDataPoint(vis.data.income, x0);

        let xDate = x0.getFullYear().toString();

        let percentIncomeChange = ((nearestIncome.value - vis.data.income[0].value) / vis.data.income[0].value) * 100;
        let percentHomePriceChange = ((nearestHomePrice.value - vis.data.homePrice[0].value) / vis.data.homePrice[0].value) * 100;

        const leftPosition = (event.pageX > 1000) ? (event.pageX - 250) + "px" : (event.pageX + 30) + "px";
        
        // Update and show the tooltip
        vis.tooltip.html("Year: <b>" + xDate +
            "</b><br>Increase in Home Price: <b>" + percentHomePriceChange.toFixed(0) + "% </b>" +
            "<br>Increase Income: <b>" + percentIncomeChange.toFixed(0) + "% </b>"
        )
            .style("opacity", 1)
            .style("left", leftPosition)
            .style("top", (event.pageY - 28) + "px");

        // Update and show the vertical line
        vis.focusLine
            .attr("x1", vis.xScale(x0))
            .attr("x2", vis.xScale(x0))
            .style("opacity", 1);
    };

    // Helper function to find the nearest data point
    getNearestDataPoint(data, date) {
        return data.reduce((prev, curr) => {
            return (Math.abs(curr.period - date) < Math.abs(prev.period - date) ? curr : prev);
        });
    };

}