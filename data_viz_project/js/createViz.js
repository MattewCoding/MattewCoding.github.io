
/**
 * Creates a bar chart.
 * @param {string} container The location of the bar chart
 * @param {number[]} range The [minimum, maximum, step for the tickmarks]
 * @param {string} graphId The graph's id for CSS usage
 * @param {number} qAmount The amount of bars in the bar chart
 * @param {string} graphTitle The title of the graph, to be placed at the top
 * @param {string} scaleName The name of the scale used and stored in SVGConsts for scaling the different data values
 */
function createGenericBC(container, range, graphId, qAmount, graphTitle, scaleName) {
    BCC_SCALE = d3.scaleLinear(range.slice(0, 2), [0, ctx.INFO_W - SVGConsts.HORZ_PADDING]);
    SVGConsts.SCALES[scaleName] = BCC_SCALE;

    // Bar chart 2: Have you felt discr in the past 12 mnths?
    const infoBoxDF = d3.select("#" + container).append("div")
        .attr("id", graphId + "Container")
        .append("svg").attr("id", graphId)
        .attr("width", 0)
        .attr("height", (SVGConsts.WIDTH + SVGConsts.BAR_MARGIN) * (qAmount + 4))
    infoBoxDF.transition()
        .duration(dura.country_info_fade_in_duration)
        .ease(d3.easePolyOut)
        .attr("width", ctx.INFO_W + 15); // Need to account for text

    // Title
    infoBoxDF.append("text")
        .attr("id", graphId + "Title")
        .attr("x", ctx.INFO_W / 2 + 10)
        .attr("y", ctx.TITLE_POSITION_Y)
        .attr("font-size", ctx.TITLE_PX)
        .text(graphTitle);
    SVGConsts.TEXT_HEIGHT[graphId] = document.getElementById(graphId + "Title").getBBox().height + 10;

    // Axis line
    infoBoxDF.append("line")
        .style("stroke", "black")
        .style("stroke-width", 1)
        .attr("id", graphId + "Line")
        .attr("x1", SVGConsts.HORZ_PADDING + BCC_SCALE(range[0]))
        .attr("y1", (SVGConsts.WIDTH + SVGConsts.BAR_MARGIN) * qAmount + SVGConsts.TEXT_HEIGHT[graphId])
        .attr("x2", SVGConsts.HORZ_PADDING + BCC_SCALE(range[1]))
        .attr("y2", (SVGConsts.WIDTH + SVGConsts.BAR_MARGIN) * qAmount + SVGConsts.TEXT_HEIGHT[graphId]);

    const ticks = d3.range(range[0], range[1] + 1, range[2]);

    // Tick marks
    infoBoxDF.selectAll("." + graphId + "Tick")
        .data(ticks)
        .enter()
        .append("line")
        .attr("class", graphId + "Tick")
        .attr("x1", d => SVGConsts.HORZ_PADDING + BCC_SCALE(d))
        .attr("y1", (SVGConsts.WIDTH + SVGConsts.BAR_MARGIN) * qAmount + SVGConsts.TEXT_HEIGHT[graphId])  // Position the tick above the line
        .attr("x2", d => SVGConsts.HORZ_PADDING + BCC_SCALE(d))
        .attr("y2", (SVGConsts.WIDTH + SVGConsts.BAR_MARGIN) * qAmount + SVGConsts.WIDTH + SVGConsts.TEXT_HEIGHT[graphId]);

    // Numbers
    infoBoxDF.selectAll("." + graphId + "XLabel")
        .data(ticks)
        .enter()
        .append("text")
        .attr("class", graphId + "XLabel")
        .attr("x", d => SVGConsts.HORZ_PADDING + BCC_SCALE(d))
        .attr("y", (SVGConsts.WIDTH + SVGConsts.BAR_MARGIN) * qAmount + SVGConsts.WIDTH / 2 + 20 + SVGConsts.TEXT_HEIGHT[graphId])  // Position the label below the line
        .text(d => d + "%");
}

/**
 * Creates a diverging bar chart.
 * @param {string} container The location of the bar chart
 * @param {number[]} range The [minimum, maximum, step for the tickmarks]
 * @param {string} graphId The graph's id for CSS usage
 * @param {number} qAmount The amount of bars in the bar chart
 * @param {string} graphTitle The title of the graph, to be placed at the top
 * @param {string} scaleName The name of the scale used and stored in SVGConsts for scaling the different data values
 */
function createDivBC(container, range, graphId, qAmount, graphTitle, scaleName) {
    ctx.INFO_W_DIV = ctx.INFO_W;

    // Diverging bar chart: School reactions
    const infoBoxDF = d3.select("#" + container).append("div")
        .attr("id", graphId + "Container")
        .append("svg").attr("id", graphId)
        .attr("height", (SVGConsts.WIDTH + SVGConsts.BAR_MARGIN) * (qAmount + 5))
        .attr("width", 0);

    // Title
    const titleText = infoBoxDF.append("text")
        .attr("id", graphId + "Title")
        .attr("y", ctx.TITLE_POSITION_Y)
        .attr("font-size", ctx.TITLE_PX)
        .text(graphTitle);
    SVGConsts.TEXT_HEIGHT[graphId] = document.getElementById(graphId + "Title").getBBox().height + 10;
    textWidth = document.getElementById(graphId + "Title").getBBox().width + 5;

    // Footnote
    const footnoteText = infoBoxDF.append("text")
        .attr("id", graphId + "Footnote")
        .attr("y", (SVGConsts.WIDTH + SVGConsts.BAR_MARGIN) * qAmount + SVGConsts.WIDTH / 2 + 40 + SVGConsts.TEXT_HEIGHT[graphId])
        .attr("font-size", "12px")
        .style("font-style", "italic")
        .text("*respondents can answer having received both negative & positive comments");

    ctx.INFO_W_DIV = Math.max(ctx.INFO_W, textWidth - 15) + 20;
    infoBoxDF.transition().duration(dura.country_info_fade_in_duration).ease(d3.easePolyOut).attr("width", ctx.INFO_W_DIV + 15);
    titleText.attr("x", (ctx.INFO_W_DIV + 15) / 2);
    footnoteText.attr("x", ctx.INFO_W_DIV);

    combinedScale = d3.scaleLinear(range.slice(0, 2), [0, ctx.INFO_W_DIV - SVGConsts.HORZ_PADDING]);
    negativeScale = d3.scaleLinear([range[0], 0], [0, combinedScale(0)]);
    positiveScale = d3.scaleLinear([0, range[1]], [0, ctx.INFO_W_DIV - SVGConsts.HORZ_PADDING - combinedScale(0)]);
    SVGConsts.SCALES["divNegative"] = negativeScale;
    SVGConsts.SCALES["divPositive"] = positiveScale;
    SVGConsts.SCALES[scaleName] = combinedScale;

    // Y Axis line
    infoBoxDF.append("line")
        .style("stroke", "black")
        .style("stroke-width", 1)
        .attr("id", graphId + "Line")
        .attr("x1", SVGConsts.HORZ_PADDING + combinedScale(range[0]))
        .attr("y1", (SVGConsts.WIDTH + SVGConsts.BAR_MARGIN) * qAmount + SVGConsts.TEXT_HEIGHT[graphId])
        .attr("x2", SVGConsts.HORZ_PADDING + combinedScale(range[1]))
        .attr("y2", (SVGConsts.WIDTH + SVGConsts.BAR_MARGIN) * qAmount + SVGConsts.TEXT_HEIGHT[graphId]);

    // X Axis line
    infoBoxDF.append("line")
        .style("stroke", "black")
        .style("stroke-width", 1)
        .attr("id", graphId + "XLine")
        .attr("x1", SVGConsts.HORZ_PADDING + combinedScale(range[0]))
        .attr("y1", (SVGConsts.WIDTH + SVGConsts.BAR_MARGIN) * qAmount + SVGConsts.TEXT_HEIGHT[graphId])
        .attr("x2", SVGConsts.HORZ_PADDING + combinedScale(range[1]))
        .attr("y2", (SVGConsts.WIDTH + SVGConsts.BAR_MARGIN) * qAmount + SVGConsts.TEXT_HEIGHT[graphId]);

    const ticks = d3.range(range[0], range[1] + 1, range[2]);

    // Tick marks
    infoBoxDF.selectAll("." + graphId + "Tick")
        .data(ticks)
        .enter()
        .append("line")
        .attr("class", graphId + "Tick")
        .attr("x1", d => SVGConsts.HORZ_PADDING + combinedScale(d))
        .attr("y1", (SVGConsts.WIDTH + SVGConsts.BAR_MARGIN) * qAmount + SVGConsts.TEXT_HEIGHT[graphId])  // Position the tick above the line
        .attr("x2", d => SVGConsts.HORZ_PADDING + combinedScale(d))
        .attr("y2", (SVGConsts.WIDTH + SVGConsts.BAR_MARGIN) * qAmount + SVGConsts.WIDTH + SVGConsts.TEXT_HEIGHT[graphId]);

    // Zero line
    infoBoxDF.append("line")
        .attr("class", graphId + "Tick")
        .attr("x1", SVGConsts.HORZ_PADDING + combinedScale(0))
        .attr("y1", (SVGConsts.WIDTH + SVGConsts.BAR_MARGIN) * qAmount + SVGConsts.TEXT_HEIGHT[graphId])  // Position the tick above the line
        .attr("x2", SVGConsts.HORZ_PADDING + combinedScale(0))
        .attr("y2", SVGConsts.TEXT_HEIGHT[graphId]);

    // Numbers
    infoBoxDF.selectAll("." + graphId + "XLabel")
        .data(ticks)
        .enter()
        .append("text")
        .attr("class", graphId + "XLabel")
        .attr("x", d => SVGConsts.HORZ_PADDING + combinedScale(d))
        .attr("y", (SVGConsts.WIDTH + SVGConsts.BAR_MARGIN) * qAmount + SVGConsts.WIDTH / 2 + 20 + SVGConsts.TEXT_HEIGHT[graphId])  // Position the label below the line
        .text(d => Math.abs(d) + "%");
}

/**
 * Creates a scatter plot.
 * @param {string} container The location of the bar chart
 * @param {number[]} range The [minimum, maximum, step for the tickmarks]
 * @param {string} graphId The graph's id for CSS usage
 * @param {string[]} graphLabels Three strings: the title (top), x label (bottom), and y label (left) of the graph
 * @param {string} scaleName The name of the scale used and stored in SVGConsts for scaling the different data values
 * @param {boolean} multipleChoice Whether or not the x axis can vary according to a \<select\>
 */
function createScatterplot(container, range, graphId, graphLabels, scaleName, multipleChoice) {
    const graphTitle = graphLabels[0], graphX = graphLabels[1], graphY = graphLabels[2];

    ctx.SP_W[graphId] = ctx.INFO_W;
    SVGConsts.RANGES[graphId] = range;

    const infoBoxDF = d3.select("#" + container).append("div")
        .attr("id", graphId + "Container")
        .append("svg")
        .attr("id", graphId)
        .attr("width", 0);

    // Title
    const titleText = infoBoxDF.append("text")
        .attr("id", graphId + "Title")
        .attr("y", ctx.TITLE_POSITION_Y)
        .attr("font-size", ctx.TITLE_PX)
        .text(graphTitle);

    SVGConsts.TEXT_HEIGHT[graphId] = document.getElementById(graphId + "Title").getBBox().height + 10;
    const textHeight = SVGConsts.TEXT_HEIGHT[graphId];
    const textWidth = document.getElementById(graphId + "Title").getBBox().width + 5;

    const bottomMargin = multipleChoice ? 3 : 2;

    ctx.SP_W[graphId] = Math.max(ctx.INFO_W, textWidth - 15) + 20;
    infoBoxDF
        .attr("height", 400 + textHeight * bottomMargin)
        .transition().duration(dura.country_info_fade_in_duration).ease(d3.easePolyOut)
        .attr("width", ctx.SP_W[graphId] + 40);
    titleText.attr("x", (ctx.SP_W[graphId] + 40) / 2);

    //console.log(range);
    const X_SCALE = d3.scaleLinear(range[0].slice(0, 2), [0, ctx.SP_W[graphId] - SVGConsts.HORZ_PADDING]);
    const Y_SCALE = d3.scaleLinear(range[1].slice(0, 2), [0, 400 - SVGConsts.BAR_MARGIN - textHeight]);
    SVGConsts.SCALES[scaleName + "_X"] = X_SCALE;
    SVGConsts.SCALES[scaleName + "_Y"] = Y_SCALE;

    // X Axis line
    infoBoxDF.append("line")
        .style("stroke", "black")
        .style("stroke-width", 1)
        .attr("id", graphId + "XLine")
        .attr("transform", function () {
            let xTranslate = SVGConsts.HORZ_PADDING + X_SCALE(range[0][0]);
            let yTranslate = SVGConsts.TEXT_HEIGHT[graphId] + Y_SCALE(range[1][1]);
            return `translate(${xTranslate}, ${yTranslate})`;
        })
        .attr("x2", X_SCALE(range[0][1]) - X_SCALE(range[0][0]));

    // Y Axis line
    infoBoxDF.append("line")
        .style("stroke", "black")
        .style("stroke-width", 1)
        .attr("id", graphId + "Line")
        .attr("transform", function () {
            let xTranslate = SVGConsts.HORZ_PADDING + X_SCALE(range[0][0]);
            let yTranslate = SVGConsts.TEXT_HEIGHT[graphId] + Y_SCALE(range[1][0]);
            return `translate(${xTranslate}, ${yTranslate})`;
        })
        .attr("y2", Y_SCALE(range[1][1]) - Y_SCALE(range[1][0]));


    const yTicks = d3.range(range[1][0], range[1][1] - 1, range[1][2]);
    infoBoxDF.selectAll("." + graphId + "YTick")
        .data(yTicks)
        .enter()
        .append("line")
        .style("stroke", "black")
        .style("stroke-width", 1)
        .attr("class", graphId + "YTick")
        .attr("transform", function (d) {
            return `translate(${SVGConsts.HORZ_PADDING + X_SCALE(range[0][0]) - SVGConsts.WIDTH}, ${SVGConsts.TEXT_HEIGHT[graphId] + Y_SCALE(d)})`
        })
        .attr("x2", SVGConsts.WIDTH);
    infoBoxDF.selectAll("." + graphId + "YLabel")
        .data(yTicks)
        .enter()
        .append("text")
        .attr("class", graphId + "YLabel")
        .attr("transform", function (d) {
            return `translate(${SVGConsts.HORZ_PADDING + X_SCALE(range[0][0]) - SVGConsts.WIDTH - 5}, ${SVGConsts.TEXT_HEIGHT[graphId] + Y_SCALE(d) + 4})`
        })
        .text(d => d + "%");

    infoBoxDF.append("text")
        .attr("class", graphId + "MainLabelX")
        .attr("transform", function () {
            return `translate(${SVGConsts.HORZ_PADDING + X_SCALE(range[0][1] / 2)}, ${SVGConsts.TEXT_HEIGHT[graphId] + Y_SCALE(range[1][1]) + 40})`
        })
        .style("letter-spacing", "0.25px")
        .text(graphX);

    infoBoxDF.append("text")
        .attr("class", graphId + "MainLabelY")
        .attr("transform", function () {
            return `translate(${SVGConsts.HORZ_PADDING / 3}, ${SVGConsts.TEXT_HEIGHT[graphId] + Y_SCALE(range[1][0] / 2)}) rotate(-90)`
        })
        .style("letter-spacing", "0.5px")
        .text(graphY);
}

/**
 * Update function for the 1st SVG selector
 */
function updateDVS() {
    ctx.SP1_QUESTIONS_X = shortName2qCode[d3.select("#discrVsatisgovSelector").select("option:checked").text()];
    loadLgbtData();
}

/**
 * Creates a CDF.
 * @param {string} container The location of the bar chart
 * @param {number[]} range The [minimum, maximum, step for the tickmarks]
 * @param {string} graphId The graph's id for CSS usage
 * @param {string[]} graphLabels Three strings: the title (top), x label (bottom), and y label (left) of the graph
 * @param {string} scaleName The name of the scale used and stored in SVGConsts for scaling the different data values
 * @param {boolean} multipleChoice Whether or not the x axis can vary according to a \<select\>
 */
function createCDF(container, range, graphId, graphLabels, scaleName, multipleChoice) {
    const graphTitle = graphLabels[0], graphX = graphLabels[1], graphY = graphLabels[2];

    ctx.SP_W[graphId] = ctx.INFO_W;
    SVGConsts.RANGES[graphId] = range;

    const infoBoxDF = d3.select("#" + container).append("div")
        .attr("id", graphId + "Container")
        .append("svg")
        .attr("id", graphId)
        .attr("width", 0);

    // Title
    const titleText = infoBoxDF.append("text")
        .attr("id", graphId + "Title")
        .attr("y", ctx.TITLE_POSITION_Y)
        .attr("font-size", ctx.TITLE_PX)
        .text(graphTitle);

    SVGConsts.TEXT_HEIGHT[graphId] = document.getElementById(graphId + "Title").getBBox().height + 10;
    const textHeight = SVGConsts.TEXT_HEIGHT[graphId];
    const textWidth = document.getElementById(graphId + "Title").getBBox().width + 5;

    const bottomMargin = multipleChoice ? 3 : 2;

    ctx.SP_W[graphId] = Math.max(ctx.INFO_W, textWidth - 15) + 20;
    infoBoxDF
        .attr("height", 300 + textHeight * bottomMargin)
        .transition().duration(dura.country_info_fade_in_duration).ease(d3.easePolyOut)
        .attr("width", ctx.SP_W[graphId] + 15);
    titleText.attr("x", (ctx.SP_W[graphId] + 15) / 2);

    //console.log(range);
    const X_SCALE = d3.scaleLinear(range[0].slice(0, 2), [0, ctx.SP_W[graphId] - SVGConsts.HORZ_PADDING]);
    const Y_SCALE = d3.scaleLinear(range[1].slice(0, 2), [0, 300 - SVGConsts.BAR_MARGIN - textHeight]);
    SVGConsts.SCALES[scaleName + "_X"] = X_SCALE;
    SVGConsts.SCALES[scaleName + "_Y"] = Y_SCALE;

    // X Axis line
    infoBoxDF.append("line")
        .style("stroke", "black")
        .style("stroke-width", 1)
        .attr("id", graphId + "XLine")
        .attr("transform", function () {
            let xTranslate = SVGConsts.HORZ_PADDING + X_SCALE(range[0][0]);
            let yTranslate = SVGConsts.TEXT_HEIGHT[graphId] + Y_SCALE(range[1][1]);
            return `translate(${xTranslate}, ${yTranslate})`;
        })
        .attr("x2", X_SCALE(range[0][1]) - X_SCALE(range[0][0]));

    // Y Axis line
    infoBoxDF.append("line")
        .style("stroke", "black")
        .style("stroke-width", 1)
        .attr("id", graphId + "Line")
        .attr("transform", function () {
            let xTranslate = SVGConsts.HORZ_PADDING + X_SCALE(range[0][0]);
            let yTranslate = SVGConsts.TEXT_HEIGHT[graphId] + Y_SCALE(range[1][0]);
            return `translate(${xTranslate}, ${yTranslate})`;
        })
        .attr("y2", Y_SCALE(range[1][1]) - Y_SCALE(range[1][0]));

    // Tick marks


    const yTicks = d3.range(range[1][0], range[1][1] - 1, range[1][2]);
    infoBoxDF.selectAll("." + graphId + "YTick")
        .data(yTicks)
        .enter()
        .append("line")
        .style("stroke", "black")
        .style("stroke-width", 1)
        .attr("class", graphId + "YTick")
        .attr("transform", function (d) {
            return `translate(${SVGConsts.HORZ_PADDING + X_SCALE(range[0][0]) - SVGConsts.WIDTH}, ${SVGConsts.TEXT_HEIGHT[graphId] + Y_SCALE(d)})`
        })
        .attr("x2", SVGConsts.WIDTH);
    infoBoxDF.selectAll("." + graphId + "YLabel")
        .data(yTicks)
        .enter()
        .append("text")
        .attr("class", graphId + "YLabel")
        .attr("transform", function (d) {
            return `translate(${SVGConsts.HORZ_PADDING + X_SCALE(range[0][0]) - SVGConsts.WIDTH - 5}, ${SVGConsts.TEXT_HEIGHT[graphId] + Y_SCALE(d) + 4})`
        })
        .text(d => d + "%");

    // Labels
    infoBoxDF.append("text")
        .attr("class", graphId + "MainLabelX")
        .attr("transform", function () {
            return `translate(${SVGConsts.HORZ_PADDING + X_SCALE(range[0][1] / 2)}, ${SVGConsts.TEXT_HEIGHT[graphId] + Y_SCALE(range[1][1]) + 40})`
        })
        .style("letter-spacing", "0.25px")
        .text(graphX);

    infoBoxDF.append("text")
        .attr("class", graphId + "MainLabelY")
        .attr("transform", function () {
            return `translate(${SVGConsts.HORZ_PADDING / 3}, ${SVGConsts.TEXT_HEIGHT[graphId] + Y_SCALE(range[1][0] / 2)}) rotate(-90)`
        })
        .style("letter-spacing", "0.5px")
        .text(graphY);
}

/**
 * Creates a CDF.
 * @param {string} container The location of the bar chart
 * @param {number[]} range The [minimum, maximum, step for the tickmarks]
 * @param {string} graphId The graph's id for CSS usage
 * @param {string[]} graphLabels Three strings: the title (top), x label (bottom), and y label (left) of the graph
 * @param {string} scaleName The name of the scale used and stored in SVGConsts for scaling the different data values
 * @param {boolean} multipleChoice Whether or not the x axis can vary according to a \<select\>
 */
function createViolinPlot(container, range, graphId, graphLabels, scaleName) {
    const graphTitle = graphLabels[0], graphX = graphLabels[1], graphY = graphLabels[2];

    ctx.SP_W[graphId] = ctx.INFO_W;
    SVGConsts.RANGES[graphId] = range;

    const infoBoxDF = d3.select("#" + container).append("div")
        .attr("id", graphId + "Container")
        .append("svg")
        .attr("id", graphId)
        .attr("width", 0);

    // Title
    const titleText = infoBoxDF.append("text")
        .attr("id", graphId + "Title")
        .attr("y", ctx.TITLE_POSITION_Y)
        .attr("font-size", ctx.TITLE_PX)
        .text(graphTitle);

    SVGConsts.TEXT_HEIGHT[graphId] = document.getElementById(graphId + "Title").getBBox().height + 10;
    const textHeight = SVGConsts.TEXT_HEIGHT[graphId];
    const textWidth = document.getElementById(graphId + "Title").getBBox().width + 5;

    ctx.SP_W[graphId] = Math.max(ctx.INFO_W, textWidth - 15) + 20;
    infoBoxDF
        .attr("height", 100 + textHeight * 2)
        .transition().duration(dura.country_info_fade_in_duration).ease(d3.easePolyOut)
        .attr("width", ctx.SP_W[graphId] + 40);
    titleText.attr("x", (ctx.SP_W[graphId] + 40) / 2);

    //console.log(range);
    SVGConsts.REDUCED_PADDING = SVGConsts.HORZ_PADDING - 50;
    const reducedPadding = SVGConsts.REDUCED_PADDING;
    const X_SCALE = d3.scaleLinear(range[0].slice(0, 2), [0, ctx.SP_W[graphId] - reducedPadding]);
    const Y_SCALE = d3.scaleLinear(range[1].slice(0, 2), [0, 100 - SVGConsts.BAR_MARGIN - textHeight]);
    SVGConsts.SCALES[scaleName + "_X"] = X_SCALE;
    SVGConsts.SCALES[scaleName + "_Y"] = Y_SCALE;

    // X Axis line
    infoBoxDF.append("line")
        .style("stroke", "black")
        .style("stroke-width", 1)
        .attr("id", graphId + "XLine")
        .attr("transform", function () {
            let xTranslate = reducedPadding + X_SCALE(range[0][0]);
            let yTranslate = SVGConsts.TEXT_HEIGHT[graphId] + Y_SCALE(range[1][1]);
            return `translate(${xTranslate}, ${yTranslate})`;
        })
        .attr("x2", X_SCALE(range[0][1]) - X_SCALE(range[0][0]));

    // Y Axis line
    infoBoxDF.append("line")
        .style("stroke", "black")
        .style("stroke-width", 1)
        .attr("id", graphId + "Line")
        .attr("transform", function () {
            let xTranslate = reducedPadding + X_SCALE(range[0][0]);
            let yTranslate = SVGConsts.TEXT_HEIGHT[graphId] + Y_SCALE(range[1][0]);
            return `translate(${xTranslate}, ${yTranslate})`;
        })
        .attr("y2", Y_SCALE(range[1][1]) - Y_SCALE(range[1][0]));

    // Labels
    infoBoxDF.append("text")
        .attr("class", graphId + "MainLabelX")
        .attr("transform", function () {
            return `translate(${reducedPadding + X_SCALE(range[0][1] / 2)}, ${SVGConsts.TEXT_HEIGHT[graphId] + Y_SCALE(range[1][1]) + 40})`
        })
        .style("letter-spacing", "0.25px")
        .text(graphX);

    infoBoxDF.append("text")
        .attr("class", graphId + "MainLabelY")
        .attr("transform", function () {
            return `translate(${reducedPadding / 3}, ${SVGConsts.TEXT_HEIGHT[graphId] + Y_SCALE(range[1][0] / 2)}) rotate(-90)`
        })
        .style("letter-spacing", "0.5px")
        .text(graphY);


    const ticks = d3.range(range[0][0], range[0][1] + 1, range[0][2]);
    // Tick marks
    infoBoxDF.selectAll("." + graphId + "Tick")
        .data(ticks)
        .enter()
        .append("line")
        .attr("class", graphId + "Tick")
        .attr("x1", d => reducedPadding + X_SCALE(d))
        .attr("y1", SVGConsts.TEXT_HEIGHT[graphId] + Y_SCALE(range[1][1]))  // Position the tick above the line
        .attr("x2", d => reducedPadding + X_SCALE(d))
        .attr("y2", SVGConsts.TEXT_HEIGHT[graphId] + Y_SCALE(range[1][1]) + SVGConsts.WIDTH);
    
    // Numbers
    infoBoxDF.selectAll("." + graphId + "XLabel")
        .data(ticks)
        .enter()
        .append("text")
        .attr("class", graphId + "XLabel")
        .attr("x", d => reducedPadding + X_SCALE(d))
        .attr("y", SVGConsts.TEXT_HEIGHT[graphId] + Y_SCALE(range[1][1]) + SVGConsts.WIDTH / 2 + 20)  // Position the label below the line
        .text(d => d);
}

/**
 * Update function for the 1st CDF selector
 */
function updateCDF() {
    ctx.CDF1_QUESTIONS = realTold2Code[d3.select("#realToldLGBSelector").select("option:checked").text()];
    loadLgbtData();
}

function updateFVF_X(){
    const t = d3.select("#lgbtFriendsFamilySelectorX").select("option:checked").text();
    ctx.SP3_QUESTIONS_X = peopleGroup2Code[t];
    d3.select(".lgbtFriendsFamilyMainLabelX").text(`% of respondents who are open about being LGBTI with ${t}`);
    loadLgbtData();
}
function updateFVF_Y(){
    const t = d3.select("#lgbtFriendsFamilySelectorY").select("option:checked").text();
    ctx.SP3_QUESTIONS_Y = peopleGroup2Code[t];
    d3.select(".lgbtFriendsFamilyMainLabelY").text(`% of respondents who are open about being LGBTI with ${t}`);
    loadLgbtData();
}

function createVizElems() {
    // Bar chart 1: Have you felt discr in the past 12 mnths (by country)?
    createGenericBC("information", [0, 50, 10], "discrFelt", 8, " Percentage who felt discriminated...", "DF_SCALE");

    // Bar chart 2: Have you felt discr in the past 12 mnths (by subset)?
    //createGenericBC("other", [0, 100, 10], "discrFeltSubset", 8, " Percentage who felt discriminated...", "DFS_SCALE");


    createViolinPlot(
        "other",
        [[0, 10, 1], [0, 10, 1]],
        "avgSatisfaction",
        [
            "Average satisfaction with per country",
            "Satisfaction",
            "",
        ],
        "AVG_SATIS",
    );
    
    createDivBC("other", [-100, 100, 20], "divergingBarChart", countries.length, "% of LGBTI people who report receiving negative and positive comments*", "divBoth");

    createScatterplot(
        "other",
        [[0, 50, 10], [100, 0, -10]],
        "discrVsatisgov",
        [
            "Does increased discrimination lead to govenment dissatisfaction?",
            "% of respondents who experienced discrimination while...",
            "% of respondents dissatisfied with the government"
        ],
        "DISCR_SATIS",
        true
    );
    d3.select("#discrVsatisgovContainer")
        .append("select")
        .attr("id", "discrVsatisgovSelector")
        .attr("class", "blendSelector")
        .attr("onclick", "updateDVS()");
    fillDropdown("discrVsatisgovSelector", Object.values(haveYouFeltDiscInPast12));

    d3.select("#other").append("div").attr("id", "scatterplots");

    createScatterplot(
        "scatterplots",
        [[0, 100, 10], [100, 0, -10]],
        "lgbtSchoolWork",
        [
            "LGBTI Openness at School vs. at Work",
            "% of respondents who are open about being LGBTI at school",
            "% of respondents who are open about being LGBTI at work"
        ],
        "SCHOOL_WORK",
        false
    );

    createScatterplot(
        "scatterplots",
        [[0, 100, 10], [100, 0, -10]],
        "lgbtFriendsFamily",
        [
            "LGBTI Openness with ~~~~~~~~~~~~ vs. with ~~~~~~~~~~~~",
            "% of respondents who are open about being LGBTI with friends",
            "% of respondents who are open about being LGBTI with family"
        ],
        "FRIENDS_FAMILY",
        false
    );
    d3.select("#lgbtFriendsFamilyContainer")
        .append("select")
        .attr("id", "lgbtFriendsFamilySelectorX")
        .attr("class", "blendSelector")
        .attr("onclick", "updateFVF_X()");
    fillDropdown("lgbtFriendsFamilySelectorX", Object.keys(peopleGroup2Code));
    d3.select("#lgbtFriendsFamilySelectorX").property("selectedIndex", 1);

    d3.select("#lgbtFriendsFamilyContainer")
        .append("select")
        .attr("id", "lgbtFriendsFamilySelectorY")
        .attr("class", "blendSelector")
        .attr("onclick", "updateFVF_Y()");
    fillDropdown("lgbtFriendsFamilySelectorY", Object.keys(peopleGroup2Code));

    createCDF(
        "information",
        [[0, 60, 10], [100, 0, -10]],
        "realToldLGB",
        [
            "CDF of when LGB people ~~~~~~~~~~~~~~~ they were LGB",
            "Years old",
            "Probability",
        ],
        "RT_LGB",
        false
    );
    d3.select("#realToldLGBContainer")
        .append("select")
        .attr("id", "realToldLGBSelector")
        .attr("class", "blendSelector")
        .attr("onclick", "updateCDF()");
    fillDropdown("realToldLGBSelector", Object.keys(realTold2Code));
}