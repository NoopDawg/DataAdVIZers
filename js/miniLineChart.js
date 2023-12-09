class MiniLineChart {

    constructor(_parentElement, incomeData, housingData)  {
        this.parentElementID = _parentElement;
        this.incomeData = incomeData;
        this.housingData = housingData;
        this.incomeData.sort((a, b) => a.year - b.year)
        this.housingData.sort((a, b) => (a.year + (0.1 * a.quarter)) - (b.year + (0.1 * b.quarter)))

        this.incomeData.forEach(d => {
            d.pct_change = (d.avg_annual_pay - d3.min(this.incomeData, d => d.avg_annual_pay)) / d3.min(this.incomeData, d => d.avg_annual_pay)
        })
        this.housingData.forEach(d => {
            d.pct_change = (d.index_sa - d3.min(this.housingData, d => d.index_sa)) / d3.min(this.housingData, d => d.index_sa)
        })
        console.log(this.incomeData)
        console.log(this.housingData)


        this.initVis();
    }



    initVis() {
        const self = this;
        self.element = document.getElementById(self.parentElementID);

        let bbox = self.element.getBoundingClientRect();

        self.svg = d3.select("#" + self.parentElementID).append('svg')
            .attr('width', bbox.width)
            .attr('height', bbox.height)
            .attr('id', self.parentElementID + '-svg');


        self.xScale = d3.scaleLinear().range([0, bbox.width]);

        self.yScale = d3.scaleLinear().range([bbox.height, 0]);

        console.log(d3.extent(self.housingData, function(d) { return d.date; }))
        console.log(d3.extent(self.housingData, function(d) { return d.pct_change;}))
        self.xScale.domain(d3.extent(self.incomeData, function(d) { return d.date; }));
        self.yScale.domain(d3.extent(self.incomeData, function(d) { return d.pct_change;}));

        self.line = d3.line()
            .x(function(d) { return self.xScale(d.year); })
            .y(function(d) { return self.yScale(d.pct_change); });



        console.log( "invalid values:",
            self.incomeData.map(d => self.yScale(d.pct_change)).filter(d => !(d >= 0))
        )

        console.log( "invalid values:", self.incomeData.filter(d => !(self.yScale(d.pct_change) > 0)))


        // Select and update the first line, or create it if it doesn't exist
        self.svg.selectAll(".value1-line")
            .data([self.incomeData])
            .join(
                enter => enter.append("path")
                    .attr("class", "income-line")
                    .attr("fill", "none")
                    .attr("stroke", "var(--midnight-green)"),
                update => update
            )
            .attr("d", self.line);


    }

    updateVis() {

    }
}