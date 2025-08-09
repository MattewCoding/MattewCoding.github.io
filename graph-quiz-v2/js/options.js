/////////////////////
// Timer constants //
/////////////////////

const TIMER_CTX = {
    S_MOD: 60,
    S_IN_M: 60,
    M_IN_H: 60,
    S_IN_H: 3600,
    UPD8_INTERVAL: 1000,
    TIMER: {
        "active": false,
        "amount": 0,
    }
}

let secs = 0;
let mins = 0;
let hours = 0;
let timer;
let startTime;
let firstInit = true;

const hourTimer = d3.select("#hour-timer").on('input', updateApprox);
const minTimer = d3.select("#minute-timer").on('input', updateApprox);

///////////////////////
// Pacific constants //
///////////////////////

const PACIFIC_TRANSLATOR = {
    "no": 0,
    "yes-two": 1,
    "yes-one": 2,
};
const PACIFIC_ATTR = {
    "viewBox": ["0 0 5100 3100", "-104 0 5595 3100", "-63 -145 5685 3614"],
    "href": ["./media/world-normal.svg", "./media/world-pacific-two.png", "./media/world-pacific-one.png"],
    "x": [50, -104, -63],
    "y": [50, 64, -145],
    "width": [5000, 5495, 5585],
    "height": [3000, 3000, 3514]
};

/////////////////////
// Hints constants //
/////////////////////

/////////////////////////
// Functions and stuff //
/////////////////////////

function roundToNearest(value, round) {
    return Math.round(value / round) * round;
}

function updateApprox() {
    const hourValue = hourTimer.property('value') * 3600 || 0;
    const minValue = minTimer.property('value') * 60 || 0;
    const secondsPerNode = Math.round((hourValue + minValue) / 796);
    let actText = `(~ ${secondsPerNode} seconds per node)`;

    // What is wrong with you
    if (secondsPerNode < 6) {
        actText = `(~ ${secondsPerNode} seconds per node :o )`;
    }
    if (secondsPerNode == 1) {
        actText = `(~ 1 second per node :o )`;
    }
    if (secondsPerNode == 0) {
        actText = `(No time per node :O )`;
    }
    
    // Why the frick would you need this much time
    if (secondsPerNode > 63) {
        actText = `(~ ${roundToNearest(secondsPerNode, 6) / 60} minutes per node :( )`;
    }
    if (secondsPerNode > 3780) {
        actText = `(~ ${roundToNearest(secondsPerNode, 360) / 3600} hours per node >:( )`;
    }
    if (secondsPerNode > 60*60*24) {
        actText = `(~ ${roundToNearest(secondsPerNode, (60*60*24)/10) / (60*60*24)} days per node >:O )`;
    }

    d3.select("#approx-custom-timer").text(actText);
}

function resizeOptionsWindow() {
    if (d3.select("#backgroundOptions").style("display") == "none") return;

    const bgOptions = d3.select("#backgroundOptions");
    const bgOptionsHeight = bgOptions.node().getBoundingClientRect().height;
    const bgOptionsWidth = bgOptions.node().getBoundingClientRect().width;

    const marginPercent = 3;
    const paddingBottomPercent = 4;
    const paddingTopPercent = 2;
    const emptySpaceAmt = (marginPercent * 2 + paddingTopPercent + paddingBottomPercent) / 100 * bgOptionsWidth;
    const usableHeight = bgOptionsHeight - emptySpaceAmt;

    d3.select("#bodyOptions").style("height", `${usableHeight}px`);
    updateApprox();
    //console.log(`${backgroundOptionsHeight} - ${spaceToBeEmpty} = ${usableHeight}`);
}
resizeOptionsWindow();
window.addEventListener("resize", () => {
    resizeOptionsWindow();
});

const updateStopwatch = () => {
    let secondsPassed = roundToNearest(Date.now() - startTime, TIMER_CTX.UPD8_INTERVAL) / TIMER_CTX.UPD8_INTERVAL;
    if (TIMER_CTX.TIMER["active"]) {
        secondsPassed = TIMER_CTX.TIMER["amount"] - secondsPassed;
    }

    const seconds = secondsPassed % TIMER_CTX.S_MOD;
    const minutes = Math.floor(secondsPassed / TIMER_CTX.S_IN_M) % TIMER_CTX.M_IN_H;
    const hours = Math.floor(secondsPassed / TIMER_CTX.S_IN_H);

    const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    d3.select("#counter").text(formattedTime);

    if (secondsPassed <= 0 && TIMER_CTX.TIMER["active"]) {
        const uLoseNotif = document.getElementById('youLoseNotification');
        uLoseNotif.classList.add('show');
        clearInterval(timer);
    }
};

const startTimer = () => {
    if (firstInit) startTime = Date.now();
    updateStopwatch();
    timer = setInterval(updateStopwatch, TIMER_CTX.UPD8_INTERVAL);
    firstInit = false;
};

function endTimer() {
    clearInterval(timer);
    firstInit = true;
}

function setTimer() {
    const mode = document.querySelector('input[name="mode"]:checked')?.value;
    switch (mode) {
        case "stopwatch":
            TIMER_CTX.TIMER["active"] = false;
            break;
        case "timer80":
            TIMER_CTX.TIMER["active"] = true;
            TIMER_CTX.TIMER["amount"] = 80 * 60;
            break;
        case "timer130":
            TIMER_CTX.TIMER["active"] = true;
            TIMER_CTX.TIMER["amount"] = 130 * 60;
            break;
        case "custom":
            const hourValue = hourTimer.property('value') * 3600;
            const minValue = minTimer.property('value') * 60;
            TIMER_CTX.TIMER["active"] = true;
            TIMER_CTX.TIMER["amount"] = Math.round(hourValue + minValue);
    }
    startTimer();
}

function setPacific() {
    const pacificOpt = PACIFIC_TRANSLATOR[document.querySelector('input[name="pacific"]:checked')?.value];
    d3.select("#graphMap").attr("viewBox", PACIFIC_ATTR["viewBox"][pacificOpt]);
    d3.select("#graphImage")
        .attr("href", PACIFIC_ATTR["href"][pacificOpt])
        .attr("x", PACIFIC_ATTR["x"][pacificOpt])
        .attr("y", PACIFIC_ATTR["y"][pacificOpt])
        .attr("width", PACIFIC_ATTR["width"][pacificOpt])
        .attr("height", PACIFIC_ATTR["height"][pacificOpt]);
}

const HINTS_CTX = {
    FIRST_LETTER: false,
    REGION_COLORS: false,
    STARTING_COLORS: false,
};

function setHints() {
    const hints = Array.from(document.querySelectorAll('input[name="hints"]:checked')).map(h => h.value);

    // Reset hints
    HINTS_CTX.FIRST_LETTER = false;
    HINTS_CTX.REGION_COLORS = false;
    HINTS_CTX.STARTING_COLORS = false;

    //console.log(hints);
    // Set selected hints to true
    hints.forEach((item) => {
        if (item == "first-letter") {
            HINTS_CTX.FIRST_LETTER = true;
        }
        if (item == "region-colors") {
            HINTS_CTX.REGION_COLORS = true;
        }
        if (item == "starting-colors") {
            HINTS_CTX.STARTING_COLORS = true;
        }
    });
}

function startGame() {
    d3.select("#backgroundOptions")
        .transition()
        .duration(750)
        .ease(d3.easeCubicOut)
        .style("opacity", 0)
        .on("end", function () {
            d3.select(this).style("display", "none");
            d3.select("#play-game").text("Resume game");
        });
    d3.select("#bodyOptions")
        .style("margin-top", "3%")
        .transition()
        .duration(750)
        .ease(d3.easeCubicOut)
        .style("margin-top", "-4%");

    setTimer();
    setPacific();
    setHints();
    setUpWorldGraph();
}