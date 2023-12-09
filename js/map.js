class MapVis {
    constructor(_parentElement, statesGeoJSON, countyGeoJSON, _eventHandler) {
        this.parentElement = _parentElement;
        this.eventHandler = _eventHandler;

        this.statesGeoJSON = statesGeoJSON;
        this.countyGeoJSON = countyGeoJSON;
        this.data = [];
        this.displayData = [];


        this.minColor = "#94d2bdff";
        this.maxColor = "#ca6702ff";

        this.initVis()
    }


    initVis() {
        const self = this;

        self.margin = { top: 0, right: 0, bottom: 0, left: 0 }; //nothing needed
        self.width = document.getElementById(self.parentElement).getBoundingClientRect().width - self.margin.left - self.margin.right;
        self.height = document.getElementById(self.parentElement).getBoundingClientRect().height - self.margin.top - self.margin.bottom;

        //SVG Area
        self.svg = d3.select("#" + self.parentElement).append("svg")
            .attr("width", self.width + self.margin.left + self.margin.right)
            .attr("height", self.height + self.margin.top + self.margin.bottom)
            .append("g")
            .attr("transform", `translate(${self.margin.left}, ${self.margin.top})`);


        //Map Projection
        self.projection = d3.geoAlbersUsa()
            .scale(1000)  // Adjust as needed
            .translate([self.width/2, self.height/2]);  // Adjust as needed

        self.path = d3.geoPath().projection(self.projection);

        //color scale
        self.colorScale = d3.scaleLinear()
            .range([self.minColor, self.maxColor]);  // Colors for housing prices


        self.svg.selectAll("path")
            .data(self.statesGeoJSON.features)
            .enter()
            .append("path")
            .attr("d", self.path)
            .style("fill", "white")
            .style("stroke", "black")
            .style("stroke-width", 0.5)
            .style("opacity", 0.5)
            // function(d) {
            //     var value = sums[d.properties.name];
            //     console.log(value , rangeValue,'range');
            //     if (value >= rangeValue) {
            //         return color(value);
            //     } else {
            //         return "#f7f1deff";  // color for values below the range
            //     }
            // }
            )
    }

    updateVis() {

    }


}



//
//
// var w = 800;
// var h = 600;
// var json;  // Define json here
//
// var projection = d3.geoAlbersUsa()
//     .scale(1000)  // Adjust as needed
//     .translate([w/2, h/2]);  // Adjust as needed
//
// var path = d3.geoPath().projection(projection);
//
// const colorLeft = "#94d2bdff";
// const colorRight = "#ca6702ff";
// var color = d3.scaleLinear()
//     .range([colorLeft, colorRight]);  // Colors for housing prices
//
// var mapsvg = d3.select("#map")
//     .append("svg")
//     .attr("width", w)
//     .attr("height", h);
//
// var maptooltip = d3.select("#map")
//     .append("div")
//     .attr("class", "tooltip")
//     .style("opacity", 0);
//
// var sums = {};
// let originalData;
// d3.json("data/states.json").then(function(data) {
//     json = data;
//     console.log("GeoJSON data:", json.features);
//     d3.csv("data/median_value_by_portal_code.csv").then(function(data) {
//
//         originalData = data;
//         console.log('CSV data:', originalData);
//         originalData.forEach(function(d) {
//             if (!sums[d.state] && sums[d.state] != 0) {
//                 sums[d.state] = 0;
//             }else{
//                 sums[d.state] += Number(d.active_listing_count);
//             }
//
//         });
//         drawMap(json, 97000);
//         // Calculate sum of active_listing_count for each state
//     });
// });
// console.log(originalData,'data');
// function updateVisualization(data, rangeValue) {
//
//     data.forEach(function(d) {
//         if (+d.value < rangeValue) {  // Filter data
//             if (!sums[d.state] && sums[d.state] != 0) {
//                 sums[d.state] = 0;
//             }else{
//                 sums[d.state] += Number(d.active_listing_count);
//             }
//
//         }
//     });
//
//     color.domain(d3.extent(Object.values(sums).map(d => Number(d))));
//     console.log(Object.values(sums));
//     drawMap(json, rangeValue);
// }
//
// function drawMap(json, rangeValue) {
//     mapsvg.selectAll("*").remove(); // Clear previous elements
//
//     mapsvg.selectAll("path")
//         .data(json.features)
//         .enter()
//         .append("path")
//         .attr("d", path)
//         .style("fill", function(d) {
//             var value = sums[d.properties.name];
//             console.log(value , rangeValue,'range');
//             if (value >= rangeValue) {
//                 return color(value);
//             } else {
//                 return "#f7f1deff";  // color for values below the range
//             }
//         })
//         .on('mouseover', function(event, d) {
//             // Highlight the state
//             d3.select(this).style("fill", "orange");
//
//             // Show maptooltip with state name and average home value
//             maptooltip.transition()
//                 .duration(200)
//                 .style("opacity", .9);
//             maptooltip.html(`<strong>${d.properties.name}</strong><br>Total Active Listings: ${sums[d.properties.name]}`)
//                 .style("left", (event.pageX) + "px")
//                 .style("top", (event.pageY - 28) + "px");
//         })
//         .on('mouseout', function(event, d) {
//             // Unhighlight the state
//             d3.select(this).style("fill", function(d) {
//                 var value = sums[d.properties.name];
//                 if (value >= rangeValue) {
//                     return color(value);
//                 } else {
//                     return "#ccc";
//                 }
//             });
//
//             // Hide maptooltip
//             maptooltip.transition()
//                 .duration(0)
//                 .style("opacity", 0);
//         });
//
//     // Append text labels
//     mapsvg.selectAll("text")
//         .data(json.features)
//         .enter()
//         .append("text")
//         .attr("x", function(d) {
//             return path.centroid(d)[0]; // X-coordinate at centroid
//         })
//         .attr("y", function(d) {
//             return path.centroid(d)[1]; // Y-coordinate at centroid
//         })
//         .text(function(d) {
//             var avgValue = sums[d.properties.name]/1000  // Convert to thousands
//             return `${avgValue.toFixed(0)}`;
//         })
//         .attr("text-anchor", "middle") // Center the text
//         .attr("alignment-baseline", "middle") // Center the text
//         .style("font-size", "10px") // Adjust font size as needed
//         .style("fill", "black"); // Text color
//
//     mapsvg.selectAll("text")
//         .text(function(d) {
//             return `${sums[d.properties.name]}`;
//         })
// }
//
// // Update the map and the range value display whenever the range value changes
// d3.select("#range-filter").on("input", function() {
//     const inputElement = document.getElementById('range-input');
//     var rangeValue = +d3.select(this).node().value;  // Convert to number from the slider
//     console.log("Range Value:", rangeValue);  // Debugging line
//     inputElement.value = rangeValue;
//     d3.select("#range-filter").text(rangeValue);  // Update the range value display
//     updateVisualization(originalData,rangeValue)
//     // Update text labels
//     mapsvg.selectAll("text")
//         .text(function(d) {
//             var avgValue = sums[d.properties.name]; // Convert to thousands
//             return avgValue ? `${avgValue.toFixed(0)}` : '0';
//         });
//
//     // Update map colors
//     mapsvg.selectAll("path")
//         .style("fill", function(d) {
//             var value = sums[d.properties.name];
//             if (value >= rangeValue) {
//                 return color(value);
//             } else {
//                 return "#ccc";
//             }
//         });
// });
//
// // Create an SVG element for the legend
// var legendWidth = 300;
// var legendHeight = 30;
//
// var legend = d3.select("#legend")
//     .append("svg")
//     .attr("width", legendWidth)
//     .attr("height", legendHeight)
//     .append("g")
//     .attr("transform", "translate(10,0)");
//
// // Create a linear gradient for the legend
// var legendGradient = legend.append("defs")
//     .append("linearGradient")
//     .attr("id", "legend-gradient")
//     .attr("x1", "0%")
//     .attr("y1", "0%")
//     .attr("x2", "100%")
//     .attr("y2", "0%");
//
// legendGradient.append("stop")
//     .attr("offset", "0%")
//     .attr("style", "stop-color:" + colorLeft + ";stop-opacity:1");
//
// legendGradient.append("stop")
//     .attr("offset", "100%")
//     .attr("style", "stop-color:" + colorRight + ";stop-opacity:1");
//
// // Create a rectangle to display the gradient
// legend.append("rect")
//     .attr("width", legendWidth - 20)
//     .attr("height", legendHeight)
//     .style("fill", "url(#legend-gradient)");