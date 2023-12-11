// comparing the price of homes to annual household income from 1965
class mapDoubleLineChart {
    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data;
        this.incomeData = data.incomeData;
        this.stateHpiData = data.stateHpiData;
        this.current_listing_prices = data.currentMedianPrices;
        this.states = data.currentMedianPrices.map(d => d.state);
        console.log(data)

        this.maxPct = d3.max([
            d3.max(data.stateHpiData, d => d.pct_change),
            d3.max(data.incomeData, d => d.pct_change)
        ])

        this.minPct = d3.min([
            d3.min(data.stateHpiData, d => d.pct_change),
            d3.min(data.incomeData, d => d.pct_change)
        ])



        this.initVis();
    }

    initVis() {
        let vis = this;

        // Set up the SVG and chart dimensions
        vis.margin = { top: 20, right: 40, bottom: 55, left: 50 };
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
        vis.xScale = d3.scaleTime().range([0, vis.width])
            .domain(
                [
                    d3.max([d3.min(vis.incomeData, d => d.date), d3.min(vis.stateHpiData, d => d.date)]),
                    d3.min([d3.max(vis.incomeData, d => d.date), d3.max(vis.stateHpiData, d => d.date)])
                ]
            )

        vis.xAxis = vis.svg.append("g")
            .attr("transform", "translate(0," + vis.height + ")")
            .attr("class", "axis-ticks x-axis")

        const uniqueYears = Array.from(new Set(vis.incomeData.map(d => d.date.getFullYear())));
        const showEveryOtherYear = uniqueYears.length > 20;

        vis.xTickValues = vis.incomeData.map(d=> d.date).filter(d => {
            const year = d.getFullYear();
            const month = d.getMonth();
            if (showEveryOtherYear) {
                return uniqueYears.indexOf(year) % 2 === 0 && month === 0; // Show only first month of every other year
            } else {
                return month === 0; // Show only first month of every year
            }
        })

        vis.xAxis.call(d3.axisBottom(vis.xScale)
                .tickFormat(d3.timeFormat("%Y"))
                .tickPadding(10) // Adjust as needed
                .tickSizeOuter(0) // Optional: Hide ticks at the ends
            )

        // Add labels
        vis.svg.append("text")
            .attr("transform", "translate(" + (vis.width / 2) + " ," + (vis.height + 50) + ")")
            .style("text-anchor", "middle")
            .attr("class", "axis")
            .text("Year");

        // Add y-axis
        vis.svg.append("g") //adds group, axis is called in updateVis
            .attr("class", "axis-ticks y-axis")

        vis.yScale = d3.scaleLinear().range([vis.height, 0]);
        vis.yScale.domain([vis.minPct, vis.maxPct]);

        vis.svg.append("text")
            .attr("class", "axis")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - 50)
            .attr("x", 0 - (vis.height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Percent Change (%)");

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

        vis.svg.append("text")
            .attr("x", (vis.width))
            .attr("y", (vis.margin.top))
            .attr("class", "legend")
            .attr("id", "linechart-curr-price")
            .style("text-anchor", "end")




        vis.wrangleData("California");
    }

    // Function to convert date property to "1984-01-01" format
    convertDateFormat(obj) {
        // Split the input date string into month and year
        const [monthStr, yearStr] = obj.period.split('-');

        // Map the month abbreviation to its numerical value
        const monthAbbreviations = {
            Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
            Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
        };

        const inputDate = new Date(parseInt(yearStr, 10), monthAbbreviations[monthStr]);
        const year = inputDate.getFullYear();
        const month = (inputDate.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-indexed
        const day = inputDate.getDate().toString().padStart(2, '0');

        // Combine the formatted components
        const formattedDate = `${year}-${month}-${day}`;

        // Update the "period" property in the object
        obj.period = formattedDate;
        // console.log("formattedDate", formattedDate);

        return formattedDate;
    }

    filterDate(newDate){
        const vis = this;
        vis.dateMax = newDate;

        // console.log("filterDate triggered", vis.dateMax);
        vis.wrangleData("California")
    }

    wrangleData(stateName) {
        let vis = this;

        // Filter data by state
        vis.displayData = {
            homePrice: vis.stateHpiData.filter(d => d.state === stateName),
            income: vis.incomeData.filter(d => d.state === stateName),
            current_listing_pricing: vis.current_listing_prices.filter(d => d.state === stateName)
        };

        vis.updateVis();
    }


    updateVis() {
        let vis = this;
        // Set up scales
        vis.yAxis = d3.axisLeft(vis.yScale).ticks(10);
        d3.select(".y-axis")
            .call(vis.yAxis);

        // Define line functions
        let value1Line = d3.line()
          .x(d => vis.xScale(d.date))
          .y(d => vis.yScale(d.pct_change));
    
        let value2Line = d3.line()
          .x(d => vis.xScale(d.date))
          .y(d => vis.yScale(d.pct_change));


        // Select and update the first line, or create it if it doesn't exist
        vis.svg.selectAll(".value1-line")
            .data([
                vis.displayData.homePrice.filter(d => {  // Filter out any data points that are outside the y-axis scale
                    return (vis.yScale(d.pct_change) >=0)
                })
            ])
            .join(
                enter => enter.append("path")
                    .attr("class", "line value1-line")
                    .attr("fill", "none")
                    .attr("stroke", "var(--alloy-orange)")
                    .attr("stroke-width", "2px"),
                update => update
            )
            .attr("d", value1Line);

        // Select and update the second line, or create it if it doesn't exist
        vis.svg.selectAll(".value2-line")
            .data([vis.displayData.income])
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

        //
        // vis.svg.select("#linechart-curr-price").text(
        //     "2023 Median Home Price: $" + vis.displayData.current_listing_pricing[0].median_listing_price.toLocaleString()
        // )

        let text = vis.svg.select("#linechart-curr-price");
        text.selectAll("*").remove(); // Clear existing content

        let textData = [
            "State: " + vis.displayData.current_listing_pricing[0].state,
            "2023 Median Home Price: $" + vis.displayData.current_listing_pricing[0].median_listing_price.toLocaleString()
        ];

        textData.forEach((line, index) => {
            text.append("tspan")
                .attr("x", (vis.width))
                .attr("dy", index === 0 ? 0 : "1.2em") // Add space for lines after the first
                .style("text-anchor", "end")
                .text(line);
        });
    }

    updateTooltip(mouseX, event) {
        const vis = this;
        // Convert mouseX to a date using the inverse of the xScale
        const x0 = vis.xScale.invert(mouseX);

        // Find the nearest data points for both lines
        const nearestHomePrice = vis.getNearestDataPoint(vis.displayData.homePrice, x0);
        const nearestIncome = vis.getNearestDataPoint(vis.displayData.income, x0);

        let xDate = x0.getFullYear().toString();

        let percentIncomeChange = nearestIncome.pct_change;
        let percentHomePriceChange = nearestHomePrice.pct_change;

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
            return (Math.abs(curr.date - date) < Math.abs(prev.date - date) ? curr : prev);
        });
    };

}