// Load Data
let parseDate = d3.timeParse("%Y-%m");
let formatDate = d3.timeFormat("%Y-Q%q");
let histogramRace, lineChartBrush

let promises = [
    d3.csv("data/quarterlyHomePricePercentages_melted.csv", function(d) {
        // Transform "2022Q1" into "2022-01"
        let year = d["Period"].substring(0, 4);
        let quarter = d["Period"].substring(4).trim();
        let month = quarter == "Q1" ? "01" : quarter == "Q2" ? "04" : quarter == "Q3" ? "07" : "10";
        return {
            period: d['Period'],
            date: d['Period'],
            price_band: d["Price Band"],
            value: +d["percentage"]
        };
    }),
    d3.csv("data/quarterlyHomePriceUnits_melted.csv", function(d) {
        // Transform "2022Q1" into "2022-01"
        let year = d["Period"].substring(0, 4);
        let quarter = d["Period"].substring(4).trim();
        let month = quarter == "Q1" ? "01" : quarter == "Q2" ? "04" : quarter == "Q3" ? "07" : "10";
        return {
            period: d['Period'],
            date: d['Period'],
            price_band: d["Price Band"],
            value: +d["percentage"]
        };
    }),
    d3.csv("data/quarterlyHPI_summary.csv", function(d) {
        return {
            period: d['Period'],
            date: d['Period'],
            hpi: d['housing_price_index_sa']
       }
    })
];
Promise.all(promises).then(function (data) {
        createVisualizations(data)
    }
)


function createVisualizations(data) {
    let homePricesPercentages = data[0]
    console.log(homePricesPercentages.sort((a, b) => b.date - a.date))
    let homePricesUnits = data[1]
    console.log(homePricesUnits)
    let homePricesHPI = data[2]


    let eventHandler = {
        bind: (eventName, handler) => {
            document.body.addEventListener(eventName, handler);
        },
        trigger: (eventName, extraParameters) => {
            document.body.dispatchEvent(new CustomEvent(eventName, {
                detail: extraParameters
            }));
        }
    }

    histogramRace = new HistogramRace("histogramRace", homePricesPercentages);
    lineChartBrush = new LineChartBrush("lineChartBrush", homePricesHPI);

    eventHandler.bind("selectionChanged", function(event){
        let rangeStart = event.detail[0];
        let rangeEnd = event.detail[1];
        console.log(rangeStart)
        console.log(rangeEnd)
        histogramRace.onSelectionChange(rangeStart, rangeEnd);
    });

}

function autoPlayViz() {
    histogramRace.autoPlayDates();
}