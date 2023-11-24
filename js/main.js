// Load Data
let parseDate = d3.timeParse("%Y-%m");
let formatDate = d3.timeFormat("%Y-Q%q");
let histogramRace

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
];
Promise.all(promises).then(function (data) {
    let homePricesPercentages = data[0]
    console.log(homePricesPercentages.sort((a, b) => b.date - a.date))
    let homePricesUnits = data[1]
    console.log(homePricesUnits)

    histogramRace = new HistogramRace("histogramRace", homePricesPercentages);
})