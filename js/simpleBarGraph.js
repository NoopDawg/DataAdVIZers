// comparing the price of homes to annual household income from 1965
class SimpleBarGraph {

    constructor(parentElement) {
        this.parentElement = parentElement;

        if(parentElement === "#block2-graph"){
            // genZ expectations
            this.data = [
                { option: 'Ideal Home Price', amount: 223468, color: 'var(--alloy-orange)' },
                { option: 'Ideal Annual Income', amount: 171633, color: 'var(--auburn)' }
            ];
        }else{
            // current data
            this.data = [
                { option: 'Median Home Price', amount: 412000, color: 'var(--alloy-orange)' },
                { option: 'Median Annual Income', amount: 57406, color: 'var(--auburn)' }
            ];
        }

        this.initVis();
    }

    initVis() {
        let vis = this;

        // Set up the SVG and chart dimensions
        vis.margin = { top: 10, right: 10, bottom: 20, left: 10 };
        vis.width = 550 - vis.margin.left - vis.margin.right;
        vis.height = 200 - vis.margin.top - vis.margin.bottom;

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

        // Set up Y-axis scale
        var y = d3.scaleBand()
            .range([0, vis.height])
            .padding(0.3)
            .domain(vis.data.map(function(d) { return d.option; }));

        // Set up X-axis scale
        var x = d3.scaleLinear()
            .range([0, vis.width])
            .domain([0, 450000]);

        // Add bars to the chart
        vis.svg.selectAll(".bar")
            .data(vis.data)
            .enter().append("rect")
            .attr("class", "bar")
            .style("fill", function(d) { return d.color; })
            .attr("y", function(d) { return y(d.option); })
            .attr("height", y.bandwidth())
            .attr("x", 0) // Initial position at the left
            .attr("width", 0) // Initial width as 0
            .transition() // Apply transition
            .duration(4000) // Set the duration of the animation (adjust as needed)
            .attr("x", 0) // Final position
            .attr("width", function(d) { return x(d.amount); }); // Final width

        // Add text labels within the bars (left-aligned and white)
        vis.svg.selectAll(".bar-text")
            .data(vis.data)
            .enter().append("text")
            .attr("class", "bar-text")
            .attr("x", function(d) { return 5; }) // Left-align within the bar
            .attr("y", function(d) { return y(d.option) + (y.bandwidth() / 2); })
            .attr("dy", "0.35em") // Adjust vertical alignment
            .style("fill", "white") // Set text color to white
            .text(function(d) { return "$" + d.amount.toLocaleString(); });

        // Add X-axis with fewer ticks and increased tick spacing
        vis.svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(0," + vis.height + ")")
            .call(d3.axisBottom(x)
                .ticks(5) // Set the number of ticks
                .tickSizeInner(0) // Hide inner tick lines
                .tickSizeOuter(0) // Hide outer tick lines
                .tickPadding(10) // Padding between ticks and text
                .tickFormat(d3.format("$,.0f")) // Format ticks as dollars
            );

        // Remove Y-axis labels
        vis.svg.selectAll(".axisLeft .tick text").remove();
    }
}