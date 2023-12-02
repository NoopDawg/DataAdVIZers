var w = 800;
var h = 600;
var json;  // Define json here

var projection = d3.geoAlbersUsa()
    .scale(1000)  // Adjust as needed
    .translate([w/2, h/2]);  // Adjust as needed

var path = d3.geoPath().projection(projection);

var color = d3.scaleQuantize()
    .range(["#f7fbff", "#deebf7", "#c6dbef", "#9ecae1", "#6baed6", "#4292c6", "#2171b5", "#08519c", "#08306b"]);  // Colors for housing prices

var mapsvg = d3.select("#map-area")
    .append("svg")
    .attr("width", w)
    .attr("height", h);

var averages = {};

d3.json("data/city.json").then(function(data) {
    json = data;  // Assign the data to json
    console.log("GeoJSON data:", json.features);
    d3.csv("data/state.csv").then(function(data) {
        console.log('CSV data:', data);

        // Calculate average price for each state
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

        color.domain(d3.extent(Object.values(averages).map(d => Number(d))));
        console.log(Object.values(averages));

        drawMap(json);
    });
});

function drawMap(json) {
    var rangeValue = +d3.select("#range-filter").node().value;  // Convert to number
    console.log("Range Value:", rangeValue);  // Debugging line

    mapsvg.selectAll("path")
        .data(json.features)
        .enter()
        .append("path")
        .attr("d", path)
        .style("fill", function(d) {
            var value = averages[d.properties.name];
            if (value >= rangeValue) {
                return color(value);
            } else {
                return "#ccc";  // color for values below the range
            }
        })
        .on('mouseover', function(event, d) {
            // Highlight the state
            d3.select(this).style("fill", "orange");
        })
        .on('mouseout', function(event, d) {
            // Unhighlight the state
            d3.select(this).style("fill", function(d) {
                var value = averages[d.properties.name];
                if (value >= rangeValue) {
                    return color(value);
                } else {
                    return "#ccc";  // color for values below the range
                }
            });
        });
}

// Update the map and the range value display whenever the range value changes
d3.select("#range-filter").on("input", function() {
    var rangeValue = +this.value;  // Convert to number directly from 'this'
    console.log("Range Value:", rangeValue);  // Debugging line
    d3.select("#range-value").text(rangeValue);  // Update the range value display

    mapsvg.selectAll("path")
        .style("fill", function(d) {
            var value = averages[d.properties.name];
            if (value >= rangeValue) {
                return color(value);
            } else {
                return "#ccc";  // color for values below the range
            }
        });
});
