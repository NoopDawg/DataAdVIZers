// comparing the price of homes to annual household income from 1965
class DoubleLineChart {

    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data;

        this.initVis();
    }

    initVis() {
        let vis = this;

        // Set up the SVG and chart dimensions
        vis.margin = { top: 20, right: 20, bottom: 30, left: 50 };
        vis.width = 600 - vis.margin.left - vis.margin.right;
        vis.height = 400 - vis.margin.top - vis.margin.bottom;

        // Append the SVG to the parent element
        vis.svg = d3.select(vis.parentElement)
            .append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        vis.wrangleData();
    }

    wrangleData() {
        let vis = this;

        // Filter data to include only the relevant years
        vis.filteredData = {
            income: vis.data.yData.filter(d => d.period >= "1984-01-01" && d.period <= "2022-01-01"),
            homePrice: vis.data.xData.filter(d => new Date(d.period).getFullYear() >= 1984 && new Date(d.period).getFullYear() <= 2022)
        };

        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        // Extract x and y values from the data
        let xValues = vis.filteredData.income.map(d => new Date(d.period).getFullYear());
        let incomeValues = vis.filteredData.income.map(d => d.income);
        let homePriceValues = vis.filteredData.homePrice.map(d => d.value);

        // Set up scales
        let xScale = d3.scaleLinear().domain([1984, 2022]).range([0, vis.width]);
        let yScale = d3.scaleLinear().domain([0, d3.max([...incomeValues, ...homePriceValues])]).range([vis.height, 0]);

        // Define line functions
        let incomeLine = d3.line()
            .x((d, i) => xScale(xValues[i]))
            .y(d => yScale(d));

        let homePriceLine = d3.line()
            .x((d, i) => xScale(xValues[i]))
            .y(d => yScale(d));

        // Add income line
        vis.svg.append("path")
            .data([incomeValues])
            .attr("class", "line income-line")
            .attr("d", incomeLine)
            .attr("fill", "none")
            .attr("stroke", "blue");

        // Add home price line
        vis.svg.append("path")
            .data([homePriceValues])
            .attr("class", "line home-price-line")
            .attr("d", homePriceLine)
            .attr("fill", "none")
            .attr("stroke", "orange");

        // Add x-axis
        vis.svg.append("g")
            .attr("transform", "translate(0," + vis.height + ")")
            .call(d3.axisBottom(xScale).ticks(10));

        // Add y-axis
        vis.svg.append("g")
            .call(d3.axisLeft(yScale));

        // Add labels
        vis.svg.append("text")
            .attr("transform", "translate(" + (vis.width / 2) + " ," + (vis.height + vis.margin.top + 20) + ")")
            .style("text-anchor", "middle")
            .text("Year");

        vis.svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - vis.margin.left)
            .attr("x", 0 - (vis.height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Amount ($)");

        // Add legend
        vis.svg.append("text")
            .attr("x", vis.width - 20)
            .attr("y", 10)
            .attr("class", "legend")
            .style("fill", "blue")
            .text("Median Income");

        vis.svg.append("text")
            .attr("x", vis.width - 20)
            .attr("y", 30)
            .attr("class", "legend")
            .style("fill", "orange")
            .text("Median Home Price");
    }
}