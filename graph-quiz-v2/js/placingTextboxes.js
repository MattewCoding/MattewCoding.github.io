const svgElementForTextboxes = d3.select('#graphMap');
const ctx = {
    HEIGHT: 40,
    IMAGE_OFFSET_X: 50,
    IMAGE_OFFSET_Y: 50,
    CIRCLE_RAD: 20,

    SVG_WIDTH: 5000,
    SVG_HEIGHT: 3000,

    FONT_SIZE: "22px",

    MAX_PROVINCES: 777,
};
let amountCorrect = 0;
let answerKey = {};
let label2Coord = {};
//let userAns = {};

main();

function main() {
    ctx.WIDTH = ceilTwoInt(measureTextWidth("?"));
    //setUpWorldGraph();
    configureSubmitButton();
}

function configureSubmitButton() {
    const submitButton = document.getElementById('submitButton');
    const amtWrongNotif = document.getElementById('amountWrongNotification');
    const progressBar = document.getElementById('progress-bar');
    const amountWrong = document.getElementById('amountWrong');
    let hideTimeout;

    submitButton.addEventListener('click', (e) => {
        if (amountCorrect == 0) {// ctx.MAX_PROVINCES) {
            let secondsPassed = roundToNearest(Date.now() - startTime, TIMER_CTX.UPD8_INTERVAL) / TIMER_CTX.UPD8_INTERVAL;
            if (TIMER_CTX.TIMER["active"]) {
                secondsPassed = TIMER_CTX.TIMER["amount"] - secondsPassed;
            }

            const seconds = secondsPassed % TIMER_CTX.S_MOD;
            const minutes = Math.floor(secondsPassed / TIMER_CTX.S_IN_M) % TIMER_CTX.M_IN_H;
            const hours = Math.floor(secondsPassed / TIMER_CTX.S_IN_H);
            let timeParts = [];
            if (hours > 0) {
                timeParts.push(`${hours} ${hours == 1 ? 'hour' : 'hours'}`);
            }
            if (minutes > 0) {
                timeParts.push(`${minutes} ${minutes == 1 ? 'minute' : 'minutes'}`);
            }
            if (seconds > 0) {
                timeParts.push(`${seconds} ${seconds == 1 ? 'second' : 'seconds'}`);
            }
            const formattedTime = timeParts.join(", ");

            let uWinText;
            if (TIMER_CTX.TIMER["active"]) {
                uWinText = `You win with ${formattedTime} left!`;
            } else {
                uWinText = `You win after ${formattedTime}!`;
            }

            d3.select('#youWinNotification')
                .classed('show', true)
                .on('click', function (event) {
                    if (event.target === this) {
                        d3.select(this).classed('show', false);
                    }
                });
            d3.select('#youWin')
                .text(uWinText);

            endTimer();
            return;
        }

        amountWrong.innerHTML = amountCorrect + " / " + ctx.MAX_PROVINCES + " Correct";
        clearTimeout(hideTimeout);

        // Reset state
        amtWrongNotif.classList.remove('exiting');
        void amtWrongNotif.offsetWidth; // force reflow to restart animation

        // Start progress bar animation
        progressBar.style.animation = 'none';
        void progressBar.offsetWidth;
        progressBar.style.animation = null;

        // Animate in
        amtWrongNotif.classList.add('entering');

        svgElementForTextboxes.selectAll("circle")
            .each(function (d) {
                const isCorrect = answerKey[label2Coord[d.attributes.label]].userCorrect;
                if (isCorrect) {
                    d3.select(this)
                        .style("stroke", "black");
                } else {
                    d3.select(this)
                        .style("stroke", "red");
                }
            });

        hideTimeout = setTimeout(() => {
            amtWrongNotif.classList.remove('entering');
            amtWrongNotif.classList.add('exiting');
        }, 5000);
    });
}

function checkFirstLetterDisplay(label) {
    //console.log(HINTS_CTX.FIRST_LETTER);
    if (HINTS_CTX.FIRST_LETTER) {
        return label
            .split(' ')
            .map(word => word.charAt(0) + "_ ")
            .join('');
    } return "?";
}

function setUpWorldGraph() {

    d3.json("./data/world_graph.json").then(function (data) {
        // Preprocess node positions
        data.nodes.forEach(d => {
            let trueX = Math.round(parseInt(d.attributes.x) * 0.9772 + ctx.SVG_WIDTH / 2 - 161);
            let trueY = Math.round(-parseInt(d.attributes.y) * 0.9775 + ctx.SVG_HEIGHT / 2 + 50);
            d.trueX = trueX;
            d.trueY = trueY;

            label2Coord[d.attributes.label] = [trueX, trueY];
            answerKey[[trueX, trueY]] = {
                answer: d.attributes.label,
                userCorrect: false,
            };
        });

        // Add main text elements
        const mainTexts = svgElementForTextboxes.selectAll(".svg-plaintext")
            .data(data.nodes)
            .enter()
            .append("text")
            .attr("class", "svg-plaintext")
            //.attr("test", d => console.log(d))
            .attr("x", d => d.trueX + 34 - measureTextWidth(checkFirstLetterDisplay(d.attributes.label)) / 2)
            .attr("y", d => d.trueY + 27)
            .attr("placeholder", d => checkFirstLetterDisplay(d.attributes.label))
            .text(d => (d.userInput || checkFirstLetterDisplay(d.attributes.label)))
            .style("cursor", "pointer")
            .on("click", function (event, d) {
                const trueX = d.trueX;
                const trueY = d.trueY;
                //const initialText = checkFirstLetterDisplay(d.attributes.label);
                let newTextWidth = ctx.WIDTH;
                let newTrueX = trueX;

                const text = d3.select(this);
                text.attr("x", trueX);

                const existing = d3.select("foreignObject.editing");
                if (!existing.empty()) existing.remove();

                const fo = svgElementForTextboxes.append("foreignObject")
                    .attr("x", d.newTrueX || newTrueX)
                    .attr("y", trueY)
                    .attr("width", d.newWidth || newTextWidth)
                    .attr("height", ctx.HEIGHT)
                    .classed("editing", true);

                const input = fo.append("xhtml:input")
                    .attr("type", "text")
                    .attr("class", "svg-textbox")
                    .attr("placeholder", "?")
                    .property("value", () => {
                        //console.log(text.text())
                        if (text.text() === d.attributes.label.split(' ').map(word => word.charAt(0) + "_ ").join('')
                            || text.text() === "?") {
                            return "";
                        }
                        return text.text();
                    })
                    .on("blur", function () {
                        const val = this.value.trim() || checkFirstLetterDisplay(d.attributes.label);

                        // Edge case: user clicks to edit text but doesn't type anything b4 leaving
                        newTextWidth = measureTextWidth(val);
                        newTrueX = Math.min(Math.max(trueX - newTextWidth / 2 + 19.5, 0), 5100 - newTextWidth);
                        d.newTrueX = newTrueX;
                        d.newWidth = newTextWidth;

                        const xForNoninteractableElement = newTrueX + 34 - measureTextWidth(checkFirstLetterDisplay(d.attributes.label)) / 2;
                        //console.log(measureTextWidth(val));
                        console.log(val);

                        text.text(val || checkFirstLetterDisplay(d.attributes.label)).style("display", null);
                        text.attr("x", xForNoninteractableElement);
                        d.userInput = val;

                        fo.remove();

                        const beforeCorrectnessCheck = answerKey[[trueX, trueY]].userCorrect;
                        const correctnessCheck = answerKey[[trueX, trueY]].answer === val;

                        if (!beforeCorrectnessCheck && correctnessCheck) amountCorrect++;
                        if (beforeCorrectnessCheck && !correctnessCheck) amountCorrect--;
                        answerKey[[trueX, trueY]].userCorrect = correctnessCheck;
                    })
                    .on("keydown", function (event) {
                        if (event.key === "Enter") this.blur();
                    })
                    .on("input", function () {
                        const inputText = this.value || this.placeholder;
                        newTextWidth = measureTextWidth(inputText);
                        newTrueX = Math.min(Math.max(trueX - newTextWidth / 2 + 19.5, 0), 5100 - newTextWidth);
                        d.newTrueX = newTrueX;
                        d.newWidth = newTextWidth;

                        fo.attr("x", newTrueX)
                            .attr("width", newTextWidth);
                    });

                text.style("display", "none");
                input.node().focus();
            });

    }).catch(function (error) {
        console.error("Error loading the file:", error);
    });
}


/*
d3.csv("./data/centers.txt").then(function (data) {
    data.forEach(function (d) {
        const trueX = parseInt(d.x) - ctx.WIDTH / 2 - 1 + ctx.IMAGE_OFFSET_X;
        const trueY = parseInt(d.y) + ctx.HEIGHT / 2 - 7 + ctx.IMAGE_OFFSET_Y;

        const foreignObject = svgElementForTextboxes.append("foreignObject")
            .attr("x", trueX)
            .attr("y", trueY)
            .attr("width", ctx.WIDTH)
            .attr("height", ctx.HEIGHT);

        foreignObject.append("xhtml:input")
            .attr("class", "svg-textbox")
            .attr("type", "text")
            .attr("placeholder", "?")
            .attr("data-x", trueX - ctx.SVG_WIDTH / 2)
            .attr("data-y", trueY - ctx.SVG_HEIGHT / 2)
            .on("blur", function () {
                console.log("Coordinates: x = " + this.getAttribute("data-x") + ", y = " + this.getAttribute("data-y"));
                console.log("Text entered (on blur):", this.value);
            })
            .on("keydown", function (event) {
                if (event.key === "Enter") {
                    this.blur();
                }
            })
            .on("input", function () {
                const inputText = this.value || this.placeholder;
                const newTextWidth = measureTextWidth(inputText);
                foreignObject // Updating
                    .attr("x", parseInt(d.x) - newTextWidth / 2 - 1 + ctx.IMAGE_OFFSET_X)
                    .attr("width", newTextWidth);
            });
    });
}).catch(function (error) {
    console.error("Error loading the file:", error);
});*/

function ceilTwoInt(number) {
    return Math.ceil(number / 2) * 2;
}

function measureTextWidth(text) {

    // Create a temporary text element to measure the width of the placeholder
    const tempText = svgElementForTextboxes.append("text")
        .style("visibility", "hidden") // Hide the text
        .style("font-family", "Arial, sans-serif")
        .style("font-size", ctx.FONT_SIZE)
        .text(text); // Placeholder text

    // Calculate the width of the text based on the temporary text element
    // margin_left + right + width_calc + padding + text_outline + text_indent
    //      4      +   4   +      8     +    5    +       4      +      2      = 27
    const textWidth = parseInt(tempText.node().getBBox().width) + 27;

    // Remove the temporary text element after calculating the width
    tempText.remove();

    return textWidth;
}