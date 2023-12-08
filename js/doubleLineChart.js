// comparing the price of homes to annual household income from 1965
class DoubleLineChart {

    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data;
        // console.log(this.data);



        // Combine the arrays
        this.combinedArray = [...data.homePrice, ...data.income];
        this.combinedArray.forEach(d => {
            d.period = new Date(d.period);
        });
        this.dateMax = new Date(d3.max(this.combinedArray, d => d.period));

        this.initVis();
    }

    initVis() {
        let vis = this;

        // Set up the SVG and chart dimensions
        vis.margin = { top: 20, right: 40, bottom: 85, left: 72 };
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
                // .tickValues(vis.xValues.filter(d => {
                //     const year = d.getFullYear();
                //     const month = d.getMonth();
                //     if (showEveryOtherYear) {
                //         return uniqueYears.indexOf(year) % 2 === 0 && month === 0; // Show only first month of every other year
                //     } else {
                //         return month === 0; // Show only first month of every year
                //     }
                // }))
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
            .attr("y", 0 - 75)
            .attr("x", 0 - (vis.height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Value ($)");

        // Add legend
        vis.svg.append("text")
            .attr("x", 30)
            .attr("y", 20)
            .attr("class", "legend")
            .style("fill", "var(--midnight-green)")
            .text("Median House Price");

        vis.svg.append("text")
            .attr("x", 30)
            .attr("y", 50)
            .attr("class", "legend")
            .style("fill", "var(--rust)")
            .text("Median Household Income");


        vis.wrangleData();
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
        vis.wrangleData()
    }

    wrangleData() {
        let vis = this;

        // Extract x and y values from the data
        vis.xValues = vis.combinedArray.filter(d => d.period <= vis.dateMax)
            .map(d => d.period);
        vis.homePrices = vis.data.homePrice
            .filter(d => d.period <= vis.dateMax)
            .map(d => d.value);
        vis.incomes = vis.data.income.filter(d => d.period <= vis.dateMax)
            .map(d => d.value);

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
          .y(d => vis.yScale(d.value));
    
        let value2Line = d3.line()
          .x(d => vis.xScale(d.period))
          .y(d => vis.yScale(d.value));


        // Select and update the first line, or create it if it doesn't exist
        vis.svg.selectAll(".value1-line")
            .data([
                vis.data.homePrice.filter(d => {  // Filter out any data points that are outside the y-axis scale
                    return (vis.yScale(d.value) >=0)
                })
            ])
            .join(
                enter => enter.append("path")
                    .attr("class", "line value1-line")
                    .attr("fill", "none")
                    .attr("stroke", "var(--midnight-green)"),
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
                    .attr("stroke", "var(--rust)"),
                update => update
            )
            .transition().duration(50).attr("d", value2Line);


        vis.svg.selectAll(".value1-line, .value2-line")
            .attr("clip-path", "url(#clip)");

        // // Add value1 line
        // vis.svg
        //     .append("path")
        //     // .select("#path-homePrice")
        //     .data([vis.data.homePrice])
        //     .attr("class", "line value1-line")
        //     .attr("d", value1Line)
        //     .attr("fill", "none")
        //     .attr("stroke", "var(--midnight-green)");
        //
        // // Add value2 line
        // vis.svg.append("path")
        //   .data([vis.data.income])
        //   .attr("class", "line value2-line")
        //   .attr("d", value2Line)
        //   .attr("fill", "none")
        //   .attr("stroke", "var(--rust)");

    }
}