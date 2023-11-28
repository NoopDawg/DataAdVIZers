var w = 800;
var h = 600;

var projection = d3.geoAlbersUsa()
    .scale(1000)  // Adjust as needed
    .translate([w/2, h/2]);  // Adjust as needed

var path = d3.geoPath().projection(projection);

var color = d3.scaleQuantize()
    .range(["#f7fbff", "#deebf7", "#c6dbef", "#9ecae1", "#6baed6", "#4292c6", "#2171b5", "#08519c", "#08306b"]);
// Colors for housing prices

var mapsvg = d3.select("#map-area")
    .append("svg")
    .attr("width", w)
    .attr("height", h);

d3.json("data/city.json").then(function(json) {
    console.log("GeoJSON data:", json.features);
    d3.csv("data/state.csv").then(function(data) {
        console.log('CSV data:', data);

        // Calculate average price for each state
        var averages = {};
        data.forEach(function(d) {
            if (!averages[d.state]) {
                averages[d.state] = { sum: 0, count: 0 };
            }
            averages[d.state].sum += +d.value;
            averages[d.state].count += 1;
        });
        for (var state in averages) {
            averages[state] = averages[state].sum / averages[state].count;
        }

        color.domain([
            d3.min(Object.values(averages)),
            d3.max(Object.values(averages))
        ]);

        mapsvg.selectAll("path")
            .data(json.features)
            .enter()
            .append("path")
            .attr("d", path)
            .style("fill", function(d) {
                var value = averages[d.properties.name];
                return color(value);
            });
    });
});