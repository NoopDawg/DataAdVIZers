// comparing the price of homes to annual household income from 1965
class SimpleBarGraph {

    constructor(parentElement) {
        this.parentElement = parentElement;
        this.data = [
            { option: 'Gen Z’s Expectations', amount: 223468, color: 'var(--alloy-orange)' },
            { option: 'Actual U.S. Median Sales Price', amount: 363300, color: 'var(--auburn)' }
        ];

        this.initVis();
    }

    initVis() {
        let vis = this;

        // Set up the SVG and chart dimensions
        vis.margin = { top: 50, right: 0, bottom: 30, left: 0 };
        vis.width = 550 - vis.margin.left - vis.margin.right;
        vis.height = 400 - vis.margin.top - vis.margin.bottom;

        // Append the SVG to the parent element
        vis.svg = d3.select(vis.parentElement)
            .append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        // Set up X-axis scale
        var x = d3.scaleBand()
            .range([0, vis.width])
            .padding(0.3)
            .domain(vis.data.map(function(d) { return d.option; }));

        // Set up Y-axis scale
        var y = d3.scaleLinear()
            .range([vis.height, 0])
            .domain([0, d3.max(vis.data, function(d) { return d.amount; })]);

        // Add bars to the chart
        vis.svg.selectAll(".bar")
            .data(vis.data)
            .enter().append("rect")
            .attr("class", "bar")
            .style("fill", function(d) { return d.color; })
            .attr("x", function(d) { return x(d.option); })
            .attr("width", x.bandwidth())
            .attr("y", vis.height) // Initial position at the bottom
            .attr("height", 0) // Initial height as 0
            .transition() // Apply transition
            .duration(5000) // Set the duration of the animation (adjust as needed)
            .attr("y", function(d) { return y(d.amount); }) // Final position
            .attr("height", function(d) { return vis.height - y(d.amount); }); // Final height

        // Add text labels on top of the bars
        vis.svg.selectAll(".bar-text")
            .data(vis.data)
            .enter().append("text")
            .attr("class", "bar-text")
            .attr("x", function(d) { return x(d.option) + (x.bandwidth() / 2) - 40; })
            .attr("y", function(d) { return y(d.amount) - 5; })
            .text(function(d) { return "$" + d.amount.toLocaleString(); });

        // Add X-axis
        vis.svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + vis.height + ")")
        .call(d3.axisBottom(x)
            .tickSizeInner(0) // Hide inner tick lines
            .tickSizeOuter(0) // Hide outer tick lines
            .tickPadding(10) // Padding between ticks and text
        );
    }
}