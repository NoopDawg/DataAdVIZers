// Set the margins for the SVG element
let margin = {top: 50, right: 40, bottom: 60, left: 60};

// Set the width and height of the SVG element
let width = 800 - margin.left - margin.right;
let height = 600 - margin.top - margin.bottom;

// Create the SVG element and append it to the michael div
let svg = d3.select("#michael").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Create the x and y scales
const xScale = d3.scaleTime().range([0, width]);
const yScale = d3.scaleLinear().range([height, 0]);

// Create the x and y axes
const xAxis = d3.axisBottom(xScale);
const yAxis = d3.axisLeft(yScale);

// Append x-axis to the SVG
svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${height})`)
    .call(xAxis)
    .append("title")
    .text("Date");

// Append y-axis to the SVG
svg.append("g")
    .attr("class", "y-axis")
    .call(yAxis);

// Create the line generator
const line = d3.line()
    .x(row => xScale(row.Date))
    .y(row => yScale(row.Sales))
    .curve(d3.curveCatmullRom.alpha(0.5));

var parseTime = d3.timeParse("%m/%d/%Y");
let originalData;

function loadData() {
    // Load the CSV data
    d3.csv("data/Yearly_Data.csv").then(function(data) {
        // Parse the dates and convert numbers
        data.forEach(function(d) {
            d.Date = parseTime(d.Date);
            d.Sales = +d.Sales;
            d.Dollar = +d.Dollar;
            d.Average = +d.Average;
            d.Median = +d.Median;
            d.Listings = +d.Listings;
            d.Inventory = +d.Inventory;
        });

        originalData = data;


        // Update the axes
        svg.select(".x-axis").call(xAxis);
        svg.select(".y-axis").call(yAxis);

        // Add the line to the SVG element
        svg.append("path")
            .datum(data)
            .attr("class", "line")
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("stroke-width", 1.5)
            .attr("d", line);

        // Call the updateVisualization function with the default y-axis column
        updateVisualization(originalData);
    }).catch(function(error) {
        console.log(error);
    });
}

loadData();

function updateVisualization(data) {
    // Update the x scale domain
    let yColumn = document.getElementById("area").value;
    console.log(yColumn)

    xScale.domain(d3.extent(data, d => d.Date));

    // Update the y scale domain based on the selected column
    yScale.domain([0, d3.max(data, d => d[yColumn])]);

    // Update the y axis based on the selected column
    yAxis.scale(yScale);

    // Update the x axis on the SVG element
    svg.select(".x-axis")
        .transition()
        .duration(800)
        .call(xAxis);

    // Update the y axis on the SVG element
    svg.select(".y-axis")
        .transition()
        .duration(800)
        .call(yAxis);

    // Update the line based on the selected column
    line.y(d => yScale(d[yColumn]));

    // Update the line on the SVG element
    svg.select(".line")
        .datum(data)
        .transition()
        .duration(800)
        .attr("d", line);
}