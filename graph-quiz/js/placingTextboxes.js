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
    setUpWorldGraph();
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
            const uWinNotif = document.getElementById('youWinNotification');
            uWinNotif.classList.add('show');
            uWinNotif.addEventListener('click', (event) => {
                if (event.target === uWinNotif) {
                    uWinNotif.classList.remove('show');
                }
            });
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

function setUpWorldGraph() {
    d3.json("./data/world_graph.json").then(function (data) {
        data.nodes.forEach(function (d) {
            //console.log(`${d.attributes.x}; ${d.attributes.y}`);
            let trueX = Math.round(parseInt(d.attributes.x) * 0.9772 + ctx.SVG_WIDTH / 2 - 161);
            let trueY = Math.round(-parseInt(d.attributes.y) * 0.9775 + ctx.SVG_HEIGHT / 2 + 50);

            label2Coord[d.attributes.label] = [trueX, trueY];
            answerKey[[trueX, trueY]] = {
                "answer": d.attributes.label,
                "userCorrect": false,
            };

            let initialX = trueX + 15; //35 - measureTextWidth(d.attributes.label) / 2;
            let initialY = trueY + 27;
            let newTextWidth = ctx.WIDTH;
            let newTrueX = trueX;

            const textElementShadow = svgElementForTextboxes.append("text")
                .attr("x", initialX)
                .attr("y", initialY)
                .attr("class", "svg-plaintextshadow")
                .text("?");

            const textElement = svgElementForTextboxes.append("text")
                .attr("x", initialX)
                .attr("y", initialY)
                .attr("class", "svg-plaintext")
                .attr("placeholder", "?")
                .text("?")
                .style("cursor", "pointer")
                .on("click", function (event, d) {
                    const existing = d3.select("foreignObject.editing");
                    if (!existing.empty()) existing.remove();

                    const fo = svgElementForTextboxes.append("foreignObject")
                        .attr("x", newTrueX)
                        .attr("y", trueY)
                        .attr("width", newTextWidth)
                        .attr("height", ctx.HEIGHT)
                        .classed("editing", true);

                    const input = fo.append("xhtml:input")
                        .attr("type", "text")
                        .attr("class", "svg-textbox")
                        .attr("placeholder", "?")
                        //.attr("label", d.attributes.label)
                        .property("value", () => {
                            if (textElement.text() == "?") {
                                return "";
                            } else {
                                return textElement.text();
                            }
                        })
                        .on("blur", function () {
                            const val = this.value.trim();
                            const xForNoninteractableElement = newTrueX + 13;

                            textElement.text(val || "?").style("display", null);
                            textElementShadow.text(val || "?").style("display", null);
                            textElement.attr("x", xForNoninteractableElement);
                            textElementShadow.attr("x", xForNoninteractableElement);

                            fo.remove();

                            const beforeCorrectnessCheck = answerKey[[trueX, trueY]].userCorrect;
                            const correctnessCheck = answerKey[[trueX, trueY]].answer === val;

                            if (!beforeCorrectnessCheck && correctnessCheck) amountCorrect++;
                            if (beforeCorrectnessCheck && !correctnessCheck) amountCorrect--;
                            answerKey[[trueX, trueY]].userCorrect = correctnessCheck;
                            //console.log(answerKey[[trueX, trueY]]);
                            //console.log(amountCorrect);
                        })
                        .on("keydown", function (event) {
                            if (event.key === "Enter") this.blur();
                        })
                        .on("input", function () {
                            const inputText = this.value || this.placeholder;
                            newTextWidth = measureTextWidth(inputText);
                            newTrueX = Math.min(Math.max(trueX - newTextWidth / 2 + 19.5, 0), 5100 - newTextWidth);
                            //console.log(`${Math.max(trueX - newTextWidth / 2 + 19.5, 0)} vs. ${5100 - newTextWidth}`)
                            //console.log(newTextWidth);
                            fo.attr("x", Math.max(0, newTrueX))
                                .attr("width", newTextWidth);
                        });

                    textElement.style("display", "none");
                    input.node().focus();
                });

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