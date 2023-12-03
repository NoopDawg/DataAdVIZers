// Load Data
let parseQuarterDate = d3.timeParse("%Y-%m");
let parseDateYear = d3.timeParse("%m/%d/%Y");
let formatDate = d3.timeFormat("%YQ%q");
let histogramRace, lineChartBrush, doubleLinecChart, timeLineFilter

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
            value: +d["units"]
        };
    }),
    d3.csv("data/quarterlyHPI_summary.csv", function(d) {
        return {
            period: d['Period'],
            date: d['Period'],
            hpi: d['housing_price_index_sa']
        }
    }),
    d3.csv("data/MedianHouseholdIncome1984-2022.csv", function(d) {
        return {
            period: d['DATE'],
            value: +d['MEHOINUSA646N']
        }
    }),
    d3.csv("data/MedianPricesOfHousesSold1984-2022.csv", function(d) {
        return {
            period: d['DATE'],
            value: +d['INCOME'] * 1000
        }
    }),
    d3.csv("data/Yearly_Data.csv", function(d) {
        return {
            Date: parseDateYear(d.Date),
            Sales: +d.Sales,
            Dollar: +d.Dollar,
            Average: +d.Average,
            Median: +d.Median,
            Listings: +d.Listings,
            Inventory: +d.Inventory,
        }
    })
];
Promise.all(promises).then(function (data) {
        createVisualizations(data)
    }
)


function createVisualizations(data) {
    let homePricesPercentages = data[0]
    let homePricesUnits = data[1]
    let homePricesHPI = data[2]
    let michaelData = data[5]

    const MedianHouseholdIncome = data[3];
    const MedianPricesOfHousesSold = data[4];
    const doubleLineData = {
        income: MedianHouseholdIncome,
        homePrice: MedianPricesOfHousesSold
    };

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

    //
    // CREATING VIZ BASED ON CURRENT PAGE
    //
    function getLastPartOfPath() {
        var pathArray = window.location.pathname.split('/');
        return pathArray[pathArray.length - 1];
    }
    const currentPath = getLastPartOfPath();
    console.log(currentPath);

    //filter timeline data
    michaelData = michaelData.filter(function (d) {
        return d.Date >= parseDateYear("01/01/2002");
    })
    // michaelData = michaelData.filter(function (d) {
    //     return d.Date.getMonth() + 1 == 1 ||
    //         d.Date.getMonth() + 1 == 4 ||
    //         d.Date.getMonth() + 1 == 7 ||
    //         d.Date.getMonth() + 1 == 10;
    // })

    console.log(michaelData)
    console.log(michaelData)
    console.log(homePricesUnits)

    // INIT VIZ BASED ON CURRENT PAGE
    if (currentPath === 'exploreData.html') {
        histogramRace = new HistogramRace("histogramRace", homePricesPercentages, homePricesUnits, eventHandler);
        // lineChartBrush = new LineChartBrush("michael", homePricesHPI, eventHandler);
        timeLineFilter = new TimeLineFilter("michael", michaelData, eventHandler);
        doubleLinecChart = new DoubleLineChart("#doubleLineChart", doubleLineData);
        // autoPlayViz();

        replayButton();
    }
    if(currentPath === 'currentMarket.html') {
        // map vis called here?
    }

    eventHandler.bind("selectionChanged", function(event){
        let newDate = event.detail;
        histogramRace.onSelectionChange(newDate);
        doubleLinecChart.filterDate(newDate);
    });

    eventHandler.bind("autoMoveBrush", function(event){
        let newDate = event.detail;
        //lineChartBrush.moveBrush(newDate);
        timeLineFilter.moveBrush(newDate);
        doubleLinecChart.filterDate(newDate);
    })
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
    return parseQuarterDate(year + "-" + month)
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


// Reload the page on window resize (automatic responsivness)
window.addEventListener('resize', function () {
    location.reload();
});

function updateTimeLineBrush(){
    timeLineFilter.updateVisualization()
}

function replayButton(){
    // Get the button element
    var button = document.getElementById("play-button");

    // Store the original HTML content
    var originalContent = button.innerHTML;

    // Change content on hover
    button.addEventListener("mouseover", function() {
        // Replace the content with the desired text or HTML
        button.innerHTML = "Replay Animation";
    });

    // Restore content when not hovering
    button.addEventListener("mouseout", function() {
        button.innerHTML = originalContent;
    });
}

function calculatePayment() {
    var totalLoan = parseFloat(document.getElementById("totalLoan").value) || 0;
    var downPayment = parseFloat(document.getElementById("downPayment").value) || 0;
    var loanLength = parseFloat(document.getElementById("loanLength").value) || 0;
    var interestRate = parseFloat(document.getElementById("interestRate").value) || 0;

    var principal = totalLoan - downPayment;
    var calculatedInterest = interestRate / 100 / 12;
    var calculatedPayments = loanLength * 12;

    var x = Math.pow(1 + calculatedInterest, calculatedPayments);
    var monthlyPayment = (principal * x * calculatedInterest) / (x - 1);

    document.getElementById("result").innerHTML = "Total Loan Amount: $" + totalLoan.toFixed(2) +
            "<br>Monthly Payment: $" + monthlyPayment.toFixed(2);
  }