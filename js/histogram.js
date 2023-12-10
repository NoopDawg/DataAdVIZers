class HistogramRace {

    constructor(parentElement, percentageData, unitsData, eventHandler) {
        const self = this;
        self.priceBands = [
                "<$125,000",
                "$125,000 - $149,999",
                "$149,999  - $199,999",
                "$199,999 - $249,999",
                "$249,999 - $299,999",
                "$299,999 - $399,999",
                "$399,999 - $499,999",
                "$499,999 - $749,999",
                ">$749,999"
            ]

        // self.data = self.formatData(data);
        self.data = this.combineData(percentageData, unitsData);
        self.parentElement = parentElement;
        self.margins = { top: 20, right: 20, bottom: 100, left: 40 };
        self.priceBands = [...new Set(self.data.map(d => d.price_band))];
        self.dateOptions = [...new Set(self.data.map(d => formatQuarterDate(d.date)))]
            .map(d => parseQuarterDate(d)); //get unique dates (Dates objects don't work with sets)

        self.maxDate = d3.max(self.dateOptions);

        self.eventHandler = eventHandler;
        self.playDuration = 8000;
        self.updateInterval = self.playDuration / self.dateOptions.length;


        self.selectedDate = parseQuarterDate("2019-01");
        self.initVis();

        // const waitTime = 1000; // 1 second, for example
        // setTimeout(() => {
        //     self.autoPlayDates();
        // }, waitTime);
    }

    combineData(percentageData, unitsData) {
        const self = this;
        let combinedData = [];
        percentageData.forEach(d => {
            let units = unitsData.filter(e => ((e.date.getTime() - d.date.getTime()) < 1) && e.price_band == d.price_band)[0];
            combinedData.push({
                date: d.date,
                price_band: d.price_band,
                percentage: d.value,
                units: units.value
            })
        })
        return combinedData;
    }

    initVis() {
        const self = this;
        self.boundingClientRect = document.getElementById(self.parentElement).getBoundingClientRect();

        self.width = self.boundingClientRect.width - self.margins.left - self.margins.right
        self.height = self.boundingClientRect.height - self.margins.top - self.margins.bottom

        self.svg = d3.select("#" + self.parentElement).append("svg")
            .attr("class", "histogramRace")
            .attr("width", self.width + self.margins.left + self.margins.right)
            .attr("height", self.height + self.margins.top + self.margins.bottom)
            .append("g")
            .attr("transform", `translate(${self.margins.left}, ${self.margins.top})`)

        self.ymax = d3.max(self.data, d => d.percentage);

        self.xScale = d3.scaleBand().domain(self.priceBands).range([0, self.width]).padding(0.1);
        self.yScale = d3.scaleLinear().domain([0, self.ymax]).range([self.height, 0]);


        self.xAxis = d3.axisBottom(self.xScale);
        self.yAxis = d3.axisLeft(self.yScale);

        self.xAxisGroup = self.svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0, ${self.height})`)
            .call(self.xAxis);

        self.yAxisGroup = self.svg.append("g")
            .attr("class", "y-axis")
            .call(self.yAxis);

        d3.select(".x-axis").selectAll("text")
            .attr("text-anchor", "end")
            .attr("transform", "rotate(-25)")

        self.xAxisGroup.append("text")
            .attr("class", "axis-label")
            .attr("x", self.width / 2)
            .attr("y", 80)
            .attr("fill", "black")
            .attr("text-anchor", "middle")
            .text("Price Band");

        self.yAxisGroup.append("text")
            .attr("class", "axis-label")
            .attr("x", -self.height / 2)
            .attr("y", -30)
            .attr("fill", "black")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .text("Percentage of Homes Sold");


        self.svg.append("text")
            .attr("class", "title")
            .attr("id", "histogram-title")
            .attr("x", self.width / 2)
            .attr("y",  self.margins.top / 2)
            .attr("text-anchor", "middle")
            .text("Percentage of Homes Sold by Price Band in " + self.selectedDate.getFullYear());

        //Tooltip
        d3.select("body").append("div")
            .attr("class", "tooltip")
            .attr("id", "histogram-tooltip")
            .style("opacity", 0);

        self.wrangleData();
    }

    autoPlayDates() {
        const self = this;
        let currentIndex = 0;

        function updateChart() {
            if (currentIndex < self.dateOptions.length) {
            // if (currentIndex < 2) {
                self.selectedDate = self.dateOptions[currentIndex];

                self.eventHandler.trigger("autoMoveBrush", self.selectedDate);
                document.getElementById("currentYear").textContent = self.selectedDate.getFullYear().toString();

                self.wrangleData();
                self.updateVis();

                currentIndex++;
                setTimeout(updateChart, self.updateInterval);
            }
        }

        updateChart(); // Start the auto-play
    }

    onSelectionChange(date) {
        const self = this;
        self.selectedDate = date;
        document.getElementById("currentYear").textContent = self.selectedDate.getFullYear().toString();
        self.wrangleData();
    }

    wrangleData() {
        const self = this;

        self.selectedDate = self.selectedDate > self.maxDate ? self.maxDate : self.selectedDate;

        const oneMonthBefore = new Date(self.selectedDate.getFullYear(),
            self.selectedDate.getMonth() - 1, self.selectedDate.getDate());
        const oneMonthAfter = new Date(self.selectedDate.getFullYear(),
            self.selectedDate.getMonth() + 1, self.selectedDate.getDate());

        self.displayData = self.data.filter(d => {
            const date = d.date;
            return date >= oneMonthBefore && date <= oneMonthAfter;
        });

        // self.displayData = self.data.filter(d => d.date == self.selectedDate);
        self.updateVis();
    }

    catchNaN(value) {
        if (isNaN(Number(value))) {
            return 0;
        }
        return value;
    }

    updateVis() {
        const self = this;

        self.svg.select("#histogram-title")
            .text("Percentage of Homes Sold by Price Band in " + self.selectedDate.getFullYear().toString())

        const bars =  self.svg.selectAll("rect.bar")
            .data(self.displayData, d => d.price_band)

        bars.exit().remove() //unnecessary, should have the same number of bars

        // Define colors far bars
        var colorLeft = d3.rgb("#ee9b00ff");
        var colorRight = d3.rgb("#ae2012ff");
        var colorScale = d3.scaleLinear()
        .domain([0, self.displayData.length - 1])
        .range([colorLeft, colorRight]);

        // console.log(self.displayData)
        bars.enter()
            .append("rect")
            .attr("class", "bar")
            .on("mouseover", function (event, d) {
                let bar = d3.select(this)
                bar.attr("opacity", 1)
                let xPosition = parseFloat(bar.attr("x")) + self.xScale.bandwidth() + (self.margins.left * 2)
                let yPosition = parseFloat(bar.attr("y")) + 14
                self.currentTooltipBar = d;
                d3.select("#histogram-tooltip")
                    .attr("text-anchor", "left")
                    .classed("hidden", false)
                    .style("opacity", 1)
                    .style("left", self.boundingClientRect.left + xPosition + "px")
                    .style("top", self.boundingClientRect.top + yPosition + "px")
                    .html("Price Band: <b>" + d.price_band + "</b><br/>" + "Percentage: <b>" + d.percentage + "%</b>")
            })
            .on("mouseout", function (event, d) {
                self.currentTooltipBar = null;
                d3.select(this).attr("opacity", 0.5)
                d3.select("#histogram-tooltip")
                    .style("opacity", 0)
                    .classed("hidden", true)
            })
            .merge(bars)
            .transition()
            .duration(self.updateInterval)
            .attr("x", d => self.xScale(d.price_band))
            .attr("y", function (d) {
                return self.yScale(self.catchNaN(d.percentage))
            })
            .attr("width", self.xScale.bandwidth())
            .attr("height", d => self.height - self.yScale(self.catchNaN(d.percentage)))
            .attr("fill", function(d, i) { return colorScale(i); })
            .attr("opacity", 0.5)

        if (self.currentTooltipBar) {
            let barPriceBand = self.currentTooltipBar.price_band;
            let barPercentage = self.displayData.filter(d => d.price_band == barPriceBand)[0].percentage;

            d3.select("#histogram-tooltip")
            .html("Price Band: " + self.currentTooltipBar.price_band + "<br/>" + "Percentage: " + barPercentage + "%")
        }

    }
}