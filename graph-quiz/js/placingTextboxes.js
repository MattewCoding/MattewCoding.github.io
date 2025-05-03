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
    const notification = document.getElementById('notification');
    const progressBar = document.getElementById('progress-bar');
    const amountWrong = document.getElementById('amountWrong');
    let hideTimeout;

    submitButton.addEventListener('click', (e) => {
        amountWrong.innerHTML = amountCorrect + " / " + ctx.MAX_PROVINCES + " Correct";
        clearTimeout(hideTimeout);

        // Reset state
        notification.classList.remove('exiting');
        void notification.offsetWidth; // force reflow to restart animation

        // Start progress bar animation
        progressBar.style.animation = 'none';
        void progressBar.offsetWidth;
        progressBar.style.animation = null;

        // Animate in
        notification.classList.add('entering');

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
            notification.classList.remove('entering');
            notification.classList.add('exiting');
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
            //userAns[[trueX, trueY]] = "";
            /*svgElementForTextboxes.append("circle")
                .datum(d)
                .attr("cx", trueX + 19)
                .attr("cy", trueY + 19)
                .attr("r", ctx.CIRCLE_RAD)
                .attr("fill", "grey")
                .attr("stroke", "black")
                .attr("stroke-width", 4);*/

            const foreignObject = svgElementForTextboxes.append("foreignObject")
                .datum(d)
                .attr("x", trueX)
                .attr("y", trueY)
                .attr("width", ctx.WIDTH)
                .attr("height", ctx.HEIGHT);

            foreignObject.append("xhtml:input")
                .attr("class", "svg-textbox")
                .attr("type", "text")
                .attr("placeholder", "?")
                //.attr("label", d.attributes.label)
                .on("blur", function () {
                    //console.log("Coordinates: x = " + this.getAttribute("data-x") + ", y = " + this.getAttribute("data-y"));
                    //console.log("Text entered (on blur):", this.value);
                    const beforeCorrectnessCheck = answerKey[[trueX, trueY]].userCorrect;
                    const correctnessCheck = answerKey[[trueX, trueY]].answer == this.value;

                    // User correctly answered
                    if (!beforeCorrectnessCheck && correctnessCheck) {
                        amountCorrect++;
                    }

                    // User had correct answer but switched to wrong
                    if (beforeCorrectnessCheck && !correctnessCheck) {
                        amountCorrect--;
                    }

                    answerKey[[trueX, trueY]].userCorrect = correctnessCheck;
                    console.log(answerKey[[trueX, trueY]]);
                    console.log(amountCorrect);
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
                        .attr("x", Math.max(0, trueX - newTextWidth / 2 + 18))
                        .attr("width", newTextWidth);
                });
        });

        /*data.edges.forEach(function (d) {
            const sourceCoords = label2Coord[d.source];
            const targetCoords = label2Coord[d.target];

            svgElementForTextboxes.append("line")
                .datum(d)
                .attr("x1", sourceCoords[0] + 19)
                .attr("y1", sourceCoords[1] + 19)
                .attr("x2", targetCoords[0] + 19)
                .attr("y2", targetCoords[1] + 19)
                .attr("stroke", "black")
                .attr("stroke-width", 2)
                .lower();
        });*/
        //console.log(Object.keys(answerKey).length);
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
        .attr("x", 0)
        .attr("y", -9999) // Move it out of view
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