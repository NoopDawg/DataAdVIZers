// Load Data
let parseQuarterDate = d3.timeParse("%Y-%m");
let formatQuarterDate = d3.timeFormat("%Y-%m");
let parseDateYear = d3.timeParse("%m/%d/%Y");
let formatDate = d3.timeFormat("%YQ%q");

let histogramRace, lineChartBrush, doubleLineChart, timeLineFilter, mapVis, mapDoubleLine

let promises = [
    d3.csv("data/quarterlyHomePricePercentages_melted.csv", function(d) {
        // Transform "2022Q1" into "2022-01"
        let year = d["Period"].substring(0, 4);
        let quarter = d["Period"].substring(4).trim();
        let month = quarter == "Q1" ? "01" : quarter == "Q2" ? "04" : quarter == "Q3" ? "07" : "10";
        return {
            period: d['Period'],
            date: convertQuarterDataToDate(d['Period']),
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
            date: convertQuarterDataToDate(d['Period']),
            price_band: d["Price Band"],
            value: +d["units"]
        };
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
    d3.json("geojson/states.json"),
    d3.json("geojson/counties.geojson"),
    d3.csv("data/incomeData_county_1990_2022.csv", function (d) {
        return {
            avg_annual_pay: +d['Annual Average Pay'],
            annual_avg_weekly_wage: +d['Annual Average Weekly Wage'],
            area_type: d['Area Type'],
            area: d['Area'],
            state: d['St Name'],
            year: d['Year'],
            date: convertQuarterDataToDate(d['Year'] + 'Q1'),
        }
    }),
    d3.csv("data/quarterlyHPI_by_state.csv", function(d) {
        return {
            state: getStateName(d['state']),
            state_code: d['state'],
            year: +d['yr'],
            quarter: +d['qtr'],
            date: convertQuarterDataToDate(d['yr'] + 'Q' + d['qtr']),
            index_nsa: +d['index_nsa'],
            index_sa: +d['index_sa']
        }
    }),
    d3.csv("data/current_state_median_prices.csv", function(d) {
        return {
            state: d['state'],
            state_code: d['state_code'],
            median_listing_price: +d['median_listing_price'],
            average_listing_price: +d['average_listing_price']
        }
    })
];
Promise.all(promises).then(function (data) {
        createVisualizations(data)
    }
)


function createVisualizations(data) {
    let homePricesPercentages = data[0]
    let timeLineData = homePricesPercentages.map(d => {
        return {Date: d.date}
    })
    let homePricesUnits = data[1]
    const MedianHouseholdIncome = data[2];
    const MedianPricesOfHousesSold = data[3];

    const statesGeoJSON = data[4];
    const countiesGeoJSON = data[5];

    const incomeData = data[6];
    const stateHpiData = data[7];

    const currentMedianPrices = data[8];

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
    // console.log(currentPath);
    // INIT VIZ BASED ON CURRENT PAGE
    if (currentPath === 'exploreData.html') {
        const doubleLineData = {
            income: MedianHouseholdIncome,
            homePrice: MedianPricesOfHousesSold
        };

        histogramRace = new HistogramRace("histogramRace", homePricesPercentages, homePricesUnits, eventHandler);
        timeLineFilter = new TimeLineFilter("timeline", timeLineData, eventHandler);
        doubleLineChart = new DoubleLineChart("#doubleLineChart", doubleLineData);

        autoPlayViz();

        // adding listeners for replay animation button
        replayButton();

        // explore page nav buttons
        // Find the parent div with id exploreNavBtns
        const exploreNavBtns = document.getElementById('exploreNavBtns');

        // Find all children with class button
        const buttonChildren = exploreNavBtns.querySelectorAll('.button');

        // Attach onhover function for the first child
        buttonChildren[0].addEventListener('mouseover', function() {
            this.innerHTML = "<img src=\"css/arrow-left-solid.svg\" alt=\"Left Arrow\"> Go back";
        });
        buttonChildren[0].addEventListener('mouseout', function() {
            this.innerHTML = "<img src=\"css/arrow-left-solid.svg\" alt=\"Left Arrow\">";
        });
        setTimeout(function() {
            buttonChildren[1].innerHTML = "Learn what it takes to get a home today <img src=\"css/arrow-right-solid.svg\" alt=\"Right Arrow\">";
        }, 9000);
    }
    if(currentPath === 'currentMarket.html') {
        loanSectionListeners();
        incomeData.sort((a, b) => a.year - b.year)
        stateHpiData.sort((a, b) => (a.year + (0.1 * a.quarter)) - (b.year + (0.1 * b.quarter)))

        incomeData.forEach(d => {
            d.pct_change = (d.avg_annual_pay - incomeData[0].avg_annual_pay) * 100 / incomeData[0].avg_annual_pay
        })
        stateHpiData.forEach(d => {
            d.pct_change = (d.index_sa - stateHpiData[0].index_sa) * 100 / stateHpiData[0].index_sa
        })

        const mapData = {
            incomeData: incomeData.filter(d => d.area_type === "State"),
            stateHpiData: stateHpiData,
            currentMedianPrices: currentMedianPrices
        }

        mapVis = new MapVis("map", statesGeoJSON, countiesGeoJSON, mapData, eventHandler);

        mapDoubleLine = new mapDoubleLineChart("#mapDoubleLineChart", mapData);
        // adding listeners for source button
        sourcesButton();

        // footer button
        const backBtn = document.getElementById('backBtn');
        backBtn.addEventListener('mouseover', function() {
            this.innerHTML = "<img src=\"css/arrow-left-solid.svg\" alt=\"Left Arrow\"> Go back";
        });
        backBtn.addEventListener('mouseout', function() {
            this.innerHTML = "<img src=\"css/arrow-left-solid.svg\" alt=\"Left Arrow\">";
        });
    }

    eventHandler.bind("selectionChanged", function(event){
        let newDate = event.detail;
        histogramRace.onSelectionChange(newDate);
        doubleLineChart.filterDate(newDate);
    });

    eventHandler.bind("stateSelectionChanged", function(event){
        let stateName = event.detail;
        mapDoubleLine.wrangleData(stateName);
    })


    eventHandler.bind("autoMoveBrush", function(event){
        let newDate = event.detail;
        //lineChartBrush.moveBrush(newDate);
        timeLineFilter.moveBrush(newDate);
        doubleLineChart.filterDate(newDate);
    })
}

function loanSectionListeners(){
    //Loan Section
    document.getElementById("loanLength").value = 30
    document.getElementById("interestRate").value = 7.0
    let totalLoanInput = document.getElementById("totalLoan");

    totalLoanInput.addEventListener("focus", function() {
        let value = this.value.replace(/[^0-9.-]+/g, "");
        console.log(value)
        this.value = value;
    });

    totalLoanInput.addEventListener("blur", function() {
        let value = parseFloat(this.value);
        if (!isNaN(value)) {
            this.value = value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
        }
    });

    let downPayment = document.getElementById("downPayment");

    downPayment.addEventListener("focus", function() {
        let value = this.value.replace(/[^0-9.-]+/g, "");
        console.log(value)
        this.value = value;
    });

    downPayment.addEventListener("blur", function() {
        let value = parseFloat(this.value);
        if (!isNaN(value)) {
            this.value = value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
        }
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

let convertQuarterDataToDate = function(dateString) {
    let year = dateString.substring(0, 4);
    let quarter = dateString.substring(4).trim();
    let month = quarter == "Q1" ? "01" : quarter == "Q2" ? "04" : quarter == "Q3" ? "07" : "10";
    return parseQuarterDate(year + "-" + month)
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

function sourcesButton(){
    // Get the button element
    var button = document.getElementById("sourcesBtn");

    // Store the original HTML content
    var originalContent = button.innerHTML;

    // Change content on hover
    button.addEventListener("mouseover", function() {
        // Replace the content with the desired text or HTML
        button.innerHTML = originalContent + " Sources";
    });

    button.addEventListener("click", function() {
        showSourcesModal();
    });

    // Restore content when not hovering
    button.addEventListener("mouseout", function() {
        button.innerHTML = originalContent;
    });
}

function showSourcesModal() {
    console.log("here")
    document.getElementById('sourcesModal').style.display = 'flex';
}
function hideSourcesModal() {
    document.getElementById('sourcesModal').style.display = 'none';
}

function parseFloatDollars(value) {
    let number = value.replace(/[^0-9.-]+/g, "");
    return parseFloat(number);
}

function calculatePayment() {
    var totalLoan = parseFloatDollars(document.getElementById("totalLoan").value) || 0;
    var downPayment = parseFloatDollars(document.getElementById("downPayment").value) || 0;
    var loanLength = parseFloat(document.getElementById("loanLength").value) || 0;
    var interestRate = parseFloat(document.getElementById("interestRate").value) || 0;

    var principal = totalLoan - downPayment;
    var calculatedInterest = interestRate / 100 / 12;
    var calculatedPayments = loanLength * 12;

    var x = Math.pow(1 + calculatedInterest, calculatedPayments);
    var monthlyPayment = (principal * x * calculatedInterest) / (x - 1);

    // value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    document.getElementById("result").innerHTML = "Total Loan Amount: " + totalLoan.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) +
            "<br>Monthly Payment: " + monthlyPayment.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  }

 function getStateCode(stateName) {
     let state_dict = {
         'Alabama': 'AL',
         'Alaska': 'AK',
         'American Samoa': 'AS',
         'Arizona': 'AZ',
         'Arkansas': 'AR',
         'California': 'CA',
         'Colorado': 'CO',
         'Connecticut': 'CT',
         'Delaware': 'DE',
         'District Of Columbia': 'DC',
         'Federated States Of Micronesia': 'FM',
         'Florida': 'FL',
         'Georgia': 'GA',
         'Guam': 'GU',
         'Hawaii': 'HI',
         'Idaho': 'ID',
         'Illinois': 'IL',
         'Indiana': 'IN',
         'Iowa': 'IA',
         'Kansas': 'KS',
         'Kentucky': 'KY',
         'Louisiana': 'LA',
         'Maine': 'ME',
         'Marshall Islands': 'MH',
         'Maryland': 'MD',
         'Massachusetts': 'MA',
         'Michigan': 'MI',
         'Minnesota': 'MN',
         'Mississippi': 'MS',
         'Missouri': 'MO',
         'Montana': 'MT',
         'Nebraska': 'NE',
         'Nevada': 'NV',
         'New Hampshire': 'NH',
         'New Jersey': 'NJ',
         'New Mexico': 'NM',
         'New York': 'NY',
         'North Carolina': 'NC',
         'North Dakota': 'ND',
         'Northern Mariana Islands': 'MP',
         'Ohio': 'OH',
         'Oklahoma': 'OK',
         'Oregon': 'OR',
         'Palau': 'PW',
         'Pennsylvania': 'PA',
         'Puerto Rico': 'PR',
         'Rhode Island': 'RI',
         'South Carolina': 'SC',
         'South Dakota': 'SD',
         'Tennessee': 'TN',
         'Texas': 'TX',
         'Utah': 'UT',
         'Vermont': 'VT',
         'Virgin Islands': 'VI',
         'Virginia': 'VA',
         'Washington': 'WA',
         'West Virginia': 'WV',
         'Wisconsin': 'WI',
         'Wyoming': 'WY'
     }


     return state_dict[stateName];

 }

function getStateName(stateCode) {
    let codeToState = {
        'AL': 'Alabama',
        'AK': 'Alaska',
        'AS': 'American Samoa',
        'AZ': 'Arizona',
        'AR': 'Arkansas',
        'CA': 'California',
        'CO': 'Colorado',
        'CT': 'Connecticut',
        'DE': 'Delaware',
        'DC': 'District Of Columbia',
        'FM': 'Federated States Of Micronesia',
        'FL': 'Florida',
        'GA': 'Georgia',
        'GU': 'Guam',
        'HI': 'Hawaii',
        'ID': 'Idaho',
        'IL': 'Illinois',
        'IN': 'Indiana',
        'IA': 'Iowa',
        'KS': 'Kansas',
        'KY': 'Kentucky',
        'LA': 'Louisiana',
        'ME': 'Maine',
        'MH': 'Marshall Islands',
        'MD': 'Maryland',
        'MA': 'Massachusetts',
        'MI': 'Michigan',
        'MN': 'Minnesota',
        'MS': 'Mississippi',
        'MO': 'Missouri',
        'MT': 'Montana',
        'NE': 'Nebraska',
        'NV': 'Nevada',
        'NH': 'New Hampshire',
        'NJ': 'New Jersey',
        'NM': 'New Mexico',
        'NY': 'New York',
        'NC': 'North Carolina',
        'ND': 'North Dakota',
        'MP': 'Northern Mariana Islands',
        'OH': 'Ohio',
        'OK': 'Oklahoma',
        'OR': 'Oregon',
        'PW': 'Palau',
        'PA': 'Pennsylvania',
        'PR': 'Puerto Rico',
        'RI': 'Rhode Island',
        'SC': 'South Carolina',
        'SD': 'South Dakota',
        'TN': 'Tennessee',
        'TX': 'Texas',
        'UT': 'Utah',
        'VT': 'Vermont',
        'VI': 'Virgin Islands',
        'VA': 'Virginia',
        'WA': 'Washington',
        'WV': 'West Virginia',
        'WI': 'Wisconsin',
        'WY': 'Wyoming'
    };

    return codeToState[stateCode];
}

