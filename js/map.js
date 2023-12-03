var w = 800;
var h = 600;
var json;  // Define json here

var projection = d3.geoAlbersUsa()
    .scale(1000)  // Adjust as needed
    .translate([w/2, h/2]);  // Adjust as needed

var path = d3.geoPath().projection(projection);

const colorLeft = "#94d2bdff";
const colorRight = "#ca6702ff";
var color = d3.scaleLinear()
    .range([colorLeft, colorRight]);  // Colors for housing prices

var mapsvg = d3.select("#map")
    .append("svg")
    .attr("width", w)
    .attr("height", h);

var maptooltip = d3.select("#map")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

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
                return "#f7f1deff";  // color for values below the range
            }
        })
        .on('mouseover', function(event, d) {
            // Highlight the state
            d3.select(this).style("fill", "orange");

            // Show maptooltip with state name and average home value
            maptooltip.transition()
                .duration(200)
                .style("opacity", .9);
            maptooltip.html(`<strong>${d.properties.name}</strong><br>Avg Home Value: $${averages[d.properties.name].toFixed(2)}`)
                .style("left", (event.pageX) + "px")
                .style("top", (event.pageY - 28) + "px");
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

            // Hide maptooltip
            maptooltip.transition()
                .duration(0)
                .style("opacity", 0);
        });
}

// Update the map and the range value display whenever the range value changes
d3.select("#range-filter").on("input", function() {
    const inputElement = document.getElementById('range-input');
    var rangeValue = +d3.select(this).node().value;  // Convert to number from the slider
    console.log("Range Value:", rangeValue);  // Debugging line
    inputElement.value = rangeValue;
    d3.select("#range-filter").text(rangeValue);  // Update the range value display

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

// Create an SVG element for the legend
var legendWidth = 300;
var legendHeight = 30;

var legend = d3.select("#legend")
  .append("svg")
  .attr("width", legendWidth)
  .attr("height", legendHeight)
  .append("g")
  .attr("transform", "translate(10,0)");

// Create a linear gradient for the legend
var legendGradient = legend.append("defs")
  .append("linearGradient")
  .attr("id", "legend-gradient")
  .attr("x1", "0%")
  .attr("y1", "0%")
  .attr("x2", "100%")
  .attr("y2", "0%");

legendGradient.append("stop")
  .attr("offset", "0%")
  .attr("style", "stop-color:" + colorLeft + ";stop-opacity:1");

legendGradient.append("stop")
  .attr("offset", "100%")
  .attr("style", "stop-color:" + colorRight + ";stop-opacity:1");

// Create a rectangle to display the gradient
legend.append("rect")
  .attr("width", legendWidth - 20)
  .attr("height", legendHeight)
  .style("fill", "url(#legend-gradient)");
