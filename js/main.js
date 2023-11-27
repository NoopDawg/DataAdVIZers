// Load Data
let parseDate = d3.timeParse("%Y-%m");
let formatDate = d3.timeFormat("%YQ%q");
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
    lineChartBrush = new LineChartBrush("lineChartBrush", homePricesHPI, eventHandler);

    eventHandler.bind("selectionChanged", function(event){
        let newDate = event.detail;
        histogramRace.onSelectionChange(newDate);
    });

}

/**
 * Requires a date in the format "YYYYQq" e.g. "2022Q1"
 * @param dateString
 * @returns {Date | *}
 */
let parseDateString = (dateString) => {
    const self = this;
    let year = dateString.substring(0, 4);
    let quarter = dateString.substring(4).trim();
    let month = quarter == "Q1" ? "01" : quarter == "Q2" ? "04" : quarter == "Q3" ? "07" : "10";
    return parseDate(year + "-" + month)
}

/**
 * Round a date to the nearest quarter
 * @param date e.g. "Date Object"
 * @returns {Date | *} Date object rounded to the nearest quarter
 */
let roundToQuarter = (date) => {
    let dateString = formatDate(date);
    return parseDateString(dateString);
}

function autoPlayViz() {
    histogramRace.autoPlayDates();
}