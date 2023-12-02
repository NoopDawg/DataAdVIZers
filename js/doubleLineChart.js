// comparing the price of homes to annual household income from 1965
class DoubleLineChart {

    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data;
        // console.log(this.data);

        this.initVis();
    }

    initVis() {
        let vis = this;

        // Set up the SVG and chart dimensions
        vis.margin = { top: 0, right: 40, bottom: 55, left: 75 };
        vis.width = document.querySelector(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.querySelector(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // Append the SVG to the parent element
        vis.svg = d3.select(vis.parentElement)
            .append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

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

    wrangleData() {
        let vis = this;

        // change to same date format
        vis.data.homePrice.forEach(vis.convertDateFormat);
        
        // Combine the arrays
        vis.combinedArray = [...vis.data.homePrice, ...vis.data.income];

        // console.log(this.data);
        console.log(this.combinedArray);

        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        // Extract x and y values from the data
        vis.combinedArray.forEach(d => {
            d.period = new Date(d.period);
        });
        let xValues = vis.combinedArray.map(d => d.period);
        let homePrices = vis.data.homePrice.map(d => d.value);
        let incomes = vis.data.income.map(d => d.value);
    
        // Set up scales
        let xScale = d3.scaleTime().domain(d3.extent(xValues)).range([0, vis.width]);
        let yScale = d3.scaleLinear().domain([0, d3.max([...homePrices, ...incomes])]).range([vis.height, 0]);
    
        // Define line functions
        let value1Line = d3.line()
          .x(d => xScale(d.period))
          .y(d => yScale(d.value));
    
        let value2Line = d3.line()
          .x(d => xScale(d.period))
          .y(d => yScale(d.value));
    
        // Add value1 line
        vis.svg.append("path")
          .data([vis.data.homePrice])
          .attr("class", "line value1-line")
          .attr("d", value1Line)
          .attr("fill", "none")
          .attr("stroke", "var(--midnight-green)");
    
        // Add value2 line
        vis.svg.append("path")
          .data([vis.data.income])
          .attr("class", "line value2-line")
          .attr("d", value2Line)
          .attr("fill", "none")
          .attr("stroke", "var(--rust)");
    
        // Add x-axis with ticks for the first month of each year
        const uniqueYears = Array.from(new Set(xValues.map(d => d.getFullYear())));
        const showEveryOtherYear = uniqueYears.length > 20;

        vis.svg.append("g")
            .attr("transform", "translate(0," + vis.height + ")")
            .attr("class", "axis-ticks")
            .call(d3.axisBottom(xScale)
                .tickValues(xValues.filter(d => {
                    const year = d.getFullYear();
                    const month = d.getMonth();
                    if (showEveryOtherYear) {
                        return uniqueYears.indexOf(year) % 2 === 0 && month === 0; // Show only first month of every other year
                    } else {
                        return month === 0; // Show only first month of every year
                    }
                }))
                .tickFormat(d3.timeFormat("%Y"))
                .tickPadding(10) // Adjust as needed
                .tickSizeOuter(0) // Optional: Hide ticks at the ends
            )
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-0.5em")
            .attr("dy", "0.5em")
            .attr("transform", "rotate(-45)");


        // Add y-axis
        vis.svg.append("g")
          .attr("class", "axis-ticks")
          .call(d3.axisLeft(yScale));
    
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
    }
}