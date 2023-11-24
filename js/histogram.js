class HistogramRace {

    constructor(parentElement, data) {
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
        self.data = data;
        self.parentElement = parentElement;
        self.margins = { top: 20, right: 20, bottom: 60, left: 20 };
        self.priceBands = [...new Set(data.map(d => d.price_band))];
        self.dateOptions = [...new Set(data.map(d => d.date))].map(d => self.formatData(d));


        self.playDuration = 10000;
        self.updateInterval = self.playDuration / self.dateOptions.length;


        self.selectedDate = parseDate("2019-01");
        self.data.forEach(d => {
            d.date = self.formatData(d.date);
        })
        self.initVis();
        self.autoPlayDates()
    }

    formatData(dateString) {
        const self = this;
        let year = dateString.substring(0, 4);
        let quarter = dateString.substring(4).trim();
        let month = quarter == "Q1" ? "01" : quarter == "Q2" ? "04" : quarter == "Q3" ? "07" : "10";
        return parseDate(year + "-" + month)
    }

    initVis() {
        const self = this;
        self.width = document.getElementById(self.parentElement).getBoundingClientRect().width - self.margins.left - self.margins.right
        self.height = document.getElementById(self.parentElement)
            .getBoundingClientRect().height - self.margins.top - self.margins.bottom

        self.svg = d3.select("#" + self.parentElement).append("svg")
            .attr("class", "histogramRace")
            .attr("width", self.width + self.margins.left + self.margins.right)
            .attr("height", self.height + self.margins.top + self.margins.bottom)
            .append("g")
            .attr("transform", `translate(${self.margins.left}, ${self.margins.top})`)

        self.ymax = d3.max(self.data, d => d.value);

        self.xScale = d3.scaleBand().domain(self.priceBands).range([0, self.width]).padding(0.1);
        self.yScale = d3.scaleLinear().domain([0, self.ymax]).range([self.height, 0]);


        self.xAxis = d3.axisBottom(self.xScale);
        self.yAxis = d3.axisLeft(self.yScale);

        self.svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0, ${self.height})`)
            .call(self.xAxis);

        self.svg.append("g")
            .attr("class", "y-axis")
            .call(self.yAxis);

        d3.select(".x-axis").selectAll("text")
            .attr("text-anchor", "end")
            .attr("transform", "rotate(-25)")

        self.svg.append("text")
            .attr("class", "title")
            .attr("id", "histogram-title")
            .attr("x", self.width / 2)
            .attr("y",  self.margins.top / 2)
            .attr("text-anchor", "middle")
            .text("Percentage of Homes Sold by Price Band in " + self.selectedDate.getFullYear() + "-" + (self.selectedDate.getMonth() + 1))


        self.wrangleData();
    }

    autoPlayDates() {
        const self = this;
        let currentIndex = 0;

        function updateChart() {
            if (currentIndex < self.dateOptions.length) {
            // if (currentIndex < 783) {
                self.selectedDate = self.dateOptions[currentIndex];
                self.wrangleData();
                self.updateVis();

                currentIndex++;
                setTimeout(updateChart, self.updateInterval);
            }
        }

        updateChart(); // Start the auto-play
    }

    wrangleData() {
        const self = this;
        console.log(self.selectedDate);
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
            .text("Percentage of Homes Sold by Price Band in " + formatDate(self.selectedDate))

        const bars =  self.svg.selectAll("rect.bar")
            .data(self.displayData, d => d.price_band)

        bars.exit().remove() //unnecessary, should have the same number of bars

        // console.log(self.displayData)
        bars.enter()
            .append("rect")
            .attr("class", "bar")
            .merge(bars)
            .transition()
            .duration(self.updateInterval)
            .attr("x", d => self.xScale(d.price_band))
            .attr("y", function (d) {
                return self.yScale(self.catchNaN(d.value))
            })
            .attr("width", self.xScale.bandwidth())
            .attr("height", d => self.height - self.yScale(self.catchNaN(d.value)))
            .attr("fill", "steelblue")
            .attr("opacity", 0.5)
    }
}