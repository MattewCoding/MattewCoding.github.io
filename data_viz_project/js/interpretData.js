const SVGConsts = {
    WIDTH: 10,
    BAR_MARGIN: 5,
    SCALES: {},
    TEXT_HEIGHT: {},
    RANGES: {},

    HORZ_PADDING: 105,
};

const haveYouFeltDiscInPast12 = {
    "In the past 12 months have you ever felt discriminated against due to being LGBTI when looking for a job?": "Job searching",
    "In the past 12 months have you ever felt discriminated against due to being LGBTI when at work?": "At work",
    "In the past 12 months have you ever felt discriminated against due to being LGBTI when trying to rent or buy housing?": "Looking for housing",
    "In the past 12 months have you ever felt discriminated against due to being LGBTI by healthcare or social services personnel (e.g. a receptionist, nurse or doctor, a social worker)?": "In healthcare",
    "In the past 12 months have you ever felt discriminated against due to being LGBTI by school/university personnel? This could have happened to you as a student or as a parent.": "In education",
    "In the past 12 months have you ever felt discriminated against due to being LGBTI at a cafe, restaurant, bar or nightclub?": "At third places",
    "In the past 12 months have you ever felt discriminated against due to being LGBTI at a shop?": "In shops",
    "In the past 12 months have you ever felt discriminated against due to being LGBTI when showing any official identification document that identifies your sex?": "When identifing",
};

const shortName2qCode = {
    "Job searching": "DEXindd1_2A",
    "At work": "DEXindd1_2B",
    "Looking for housing": "DEXindd1_2C",
    "In healthcare": "DEXindd1_2D",
    "In education": "DEXindd1_2E",
    "At third places": "DEXindd1_2F",
    "In shops": "DEXindd1_2G",
    "When identifing": "DEXindd1_2H",
};

const realTold2Code = {
    "realized": ["DEXa13"],
    "told others": ["DEXa14"],
    "realized/told others": ["DEXa13", "DEXa14"],
};

const peopleGroup2Code = {
    "family": "DEXg1_A",
    "friends": "DEXg1_B",
    "neighbors": "DEXg1_C",
    "work colleagues": "DEXg1_D",
    "students": "DEXg1_E",
    "superiors": "DEXg1_F",
    "customers": "DEXg1_G",
    "medical staff": "DEXg1_H",
}

function createAreaBC(data, infoBoxId, graphId, csvIndex, filterFunction, textFunction, scaleName, furtherProcessing = (d) => (d)) {
    const infoBoxDF = d3.select("#" + infoBoxId).select("#" + graphId);
    var discr = data[csvIndex];
    discr = discr.filter((line) => filterFunction(line));
    discr = furtherProcessing(discr);
    const BCC_SCALE = SVGConsts.SCALES[scaleName];

    infoBoxDF.selectAll("rect")
        .data(discr)
        .join(
            enter => (
                enter.append("rect")
                    .attr("transform", (_, i) => (`translate(${SVGConsts.HORZ_PADDING}, ${(SVGConsts.WIDTH + SVGConsts.BAR_MARGIN) * i + SVGConsts.TEXT_HEIGHT[graphId]})`))
                    .attr("height", SVGConsts.WIDTH)
                    .attr("fill", "#6E99A0")
                    .transition()
                    .duration(500)
                    .ease(d3.easeCubicOut)
                    .attr("width", (d) => {
                        if (!isNaN(parseInt(d.percentage))) {
                            return BCC_SCALE(Number(d.percentage));
                        } else {
                            return BCC_SCALE(0);
                        }
                    })
            ),
            update => (
                update.transition()
                    .duration(200)
                    .ease(d3.easeCubicOut)
                    .attr("width", (d) => {
                        if (!isNaN(parseInt(d.percentage))) {
                            return BCC_SCALE(Number(d.percentage));
                        } else {
                            return BCC_SCALE(0);
                        }
                    })
            ),
            exit => (exit.remove()),
        )

    infoBoxDF.selectAll("." + graphId + "YLabel")
        .data(discr)
        .enter()
        .append("text")
        .attr("class", graphId + "YLabel")
        .attr("x", SVGConsts.HORZ_PADDING - SVGConsts.BAR_MARGIN)
        .attr("y", (_, i) => (SVGConsts.WIDTH + SVGConsts.BAR_MARGIN) * i + SVGConsts.WIDTH + SVGConsts.TEXT_HEIGHT[graphId])
        .text(d => textFunction(d));
}

function createDivergingAreaBC(data, infoBoxId, graphId, csvIndex, filterFunction, textFunction, scaleName, furtherProcessing = (d) => (d)) {
    const infoBoxDF = d3.select("#" + infoBoxId).select("#" + graphId);
    var discr = data[csvIndex];
    discr = discr.filter((line) => filterFunction(line));
    discr = furtherProcessing(discr);

    discrPos = discr.filter(d => d.question_code == ctx.BAR3A_QUESTIONS);

    const countriesOrderSortObject = Object.keys(countriesOrder).sort((a, b) => {
        // Find the corresponding weight for each name
        let posA = Number(discrPos.find(d => d.CountryCode == a).percentage);
        let posB = Number(discrPos.find(d => d.CountryCode == b).percentage);

        if (!posA) posA = 0;
        if (!posB) posB = 0;

        // Compare weights and return sorting order
        return posB - posA;
    })

    let countriesOrderSort = {};
    countriesOrderSortObject.forEach((ct, i) => {
        countriesOrderSort[ct] = i;
    });

    const BCC_SCALE = SVGConsts.SCALES[scaleName];
    const NEG_SCALE = SVGConsts.SCALES["divNegative"];
    const POS_SCALE = SVGConsts.SCALES["divPositive"];

    // interpolateRdYlGn but with the middle cut off
    const greenColorScale = d3.scaleLinear()
        .domain([0, 60])
        .range(["#90CF69", "#006837"]);
    const redColorScale = d3.scaleLinear()
        .domain([0, 100])
        .range(["#F06B42", "#A50026"]);

    infoBoxDF.selectAll("rect")
        .data(discr)
        .join(
            enter => (
                enter.append("rect")
                    .attr("transform", (d) => {
                        if (d.question_code == ctx.BAR3A_QUESTIONS) {
                            // +1 to avoid overlap with 0 line
                            return `translate(
                                ${SVGConsts.HORZ_PADDING + BCC_SCALE(0) + 1},
                                ${(SVGConsts.WIDTH + SVGConsts.BAR_MARGIN) * countriesOrderSort[d.CountryCode] + SVGConsts.TEXT_HEIGHT[graphId]}
                            )`
                        } else {
                            // -1 avoid 0 line
                            return `translate(
                                ${SVGConsts.HORZ_PADDING + BCC_SCALE(0) - 1},
                                ${(SVGConsts.WIDTH + SVGConsts.BAR_MARGIN) * countriesOrderSort[d.CountryCode] + SVGConsts.TEXT_HEIGHT[graphId]}
                            )`
                        }
                    })
                    .attr("height", SVGConsts.WIDTH)
                    .attr("fill", (d) => {
                        if (d.question_code == ctx.BAR3A_QUESTIONS) {
                            return greenColorScale(Number(d.percentage));
                        } else {
                            return redColorScale(Number(d.percentage));
                        }
                    })
                    .transition()
                    .duration(500)
                    .ease(d3.easeCubicOut)
                    .attr("width", (d) => POS_SCALE(Number(d.percentage)))
                    .attr("x", (d) => {
                        if (d.question_code == ctx.BAR3B_QUESTIONS) {
                            return NEG_SCALE(-Number(d.percentage)) - BCC_SCALE(0);
                        }
                    })
            ),
            update => (
                update.transition()
                    .duration(200)
                    .ease(d3.easeCubicOut)
                    .attr("width", (d) => {
                        if (d.percentage) {
                            return POS_SCALE(Number(d.percentage));
                        } else {
                            return POS_SCALE(0);
                        }
                    })
                    .attr("x", (d) => {
                        if (d.question_code == ctx.BAR3B_QUESTIONS) {
                            if (d.percentage) {
                                return NEG_SCALE(-Number(d.percentage)) - BCC_SCALE(0);
                            } else {
                                return negativeScale(0) - BCC_SCALE(0);
                            }
                        }
                    })
                    .attr("transform", (d) => {
                        if (d.question_code == ctx.BAR3A_QUESTIONS) {
                            // +1 to avoid overlap with 0 line
                            return `translate(
                                ${SVGConsts.HORZ_PADDING + BCC_SCALE(0) + 1},
                                ${(SVGConsts.WIDTH + SVGConsts.BAR_MARGIN) * countriesOrderSort[d.CountryCode] + SVGConsts.TEXT_HEIGHT[graphId]}
                            )`
                        } else {
                            // -1 avoid 0 line
                            return `translate(
                                ${SVGConsts.HORZ_PADDING + BCC_SCALE(0) - 1},
                                ${(SVGConsts.WIDTH + SVGConsts.BAR_MARGIN) * countriesOrderSort[d.CountryCode] + SVGConsts.TEXT_HEIGHT[graphId]}
                            )`
                        }
                    })
                    .attr("fill", (d) => {
                        if (d.question_code == ctx.BAR3A_QUESTIONS) {
                            return greenColorScale(Number(d.percentage));
                        } else {
                            return redColorScale(Number(d.percentage));
                        }
                    })
            ),
            exit => (exit.remove()),
        )

    infoBoxDF.selectAll("." + graphId + "YLabel")
        .data(discr)
        .join(
            enter => (enter
                .filter(d => d.question_code == ctx.BAR3A_QUESTIONS)
                .append("text")
                .attr("class", graphId + "YLabel")
                .attr("x", SVGConsts.HORZ_PADDING - SVGConsts.BAR_MARGIN)
                .attr("y", (d) => (SVGConsts.WIDTH + SVGConsts.BAR_MARGIN) * countriesOrderSort[d.CountryCode] + SVGConsts.WIDTH + SVGConsts.TEXT_HEIGHT[graphId])
                .text(d => textFunction(d))
            ),
            update => (update
                .transition()
                .duration(200)
                .attr("y", (d) => (SVGConsts.WIDTH + SVGConsts.BAR_MARGIN) * countriesOrderSort[d.CountryCode] + SVGConsts.WIDTH + SVGConsts.TEXT_HEIGHT[graphId])
            )
        );
}

function createScatterplotArea(data, infoBoxId, graphId, csvIndices, filterFunction, scaleName, furtherProcessing = (d) => (d), varyX = true) {
    range = SVGConsts.RANGES[graphId];

    const infoBoxDF = d3.select("#" + infoBoxId).select("#" + graphId);

    if (Array.isArray(csvIndices)) {
        var discr = data[csvIndices[0]].concat(data[csvIndices[1]]);
    } else {
        var discr = data[csvIndices];
    }
    discr = discr.filter((line) => filterFunction(line));
    discr = furtherProcessing(discr);

    const maxXVal = d3.max(discr, (d) => (d.percentage_x));
    let step = maxXVal > 45 ? 10 : 5;
    let max10Val = Math.ceil(maxXVal / step + 1) * step;
    if (!varyX) {
        max10Val = 100;
        step = 10;
    }

    const xTicks = d3.range(0, max10Val + 1, step);

    const X_SCALE = d3.scaleLinear([0, max10Val], [0, ctx.SP_W[graphId] - SVGConsts.HORZ_PADDING]);
    const Y_SCALE = SVGConsts.SCALES[scaleName + "_Y"];

    infoBoxDF.selectAll("circle")
        .data(discr)
        .join(
            enter => (
                enter.append("circle")
                    .attr("r", 3)
                    .attr("transform", (d) => `translate(
                            ${SVGConsts.HORZ_PADDING + X_SCALE(d.percentage_x)},
                            ${SVGConsts.TEXT_HEIGHT[graphId] + Y_SCALE(d.percentage_y)}
                        )`
                    )
                    //.attr("sdfg", (d) => (console.log(d)))
                    .attr("fill", "black")
                    .append("title")
                    .text(d => d.CountryCode)
            ),
            update => (
                update.transition()
                    .duration(200)
                    .ease(d3.easeCubicOut)
                    .attr("transform", (d) => `translate(
                            ${SVGConsts.HORZ_PADDING + X_SCALE(d.percentage_x)},
                            ${SVGConsts.TEXT_HEIGHT[graphId] + Y_SCALE(d.percentage_y)}
                        )`
                    )

            )
        );


    // Tick marks
    infoBoxDF.selectAll("." + graphId + "XTick")
        .data(xTicks)
        .join(
            enter => (
                enter.append("line")
                    .style("stroke", "black")
                    .style("stroke-width", 1)
                    .attr("class", graphId + "XTick")
                    .attr("transform", function (d) {
                        return `translate(${SVGConsts.HORZ_PADDING + X_SCALE(d)}, ${SVGConsts.TEXT_HEIGHT[graphId] + Y_SCALE(range[1][1])})`
                    })
                    .attr("y2", SVGConsts.WIDTH)
            ),
            update => (
                update.transition()
                    .duration(200)
                    .ease(d3.easeCubicOut)
                    .attr("transform", function (d) {
                        return `translate(${SVGConsts.HORZ_PADDING + X_SCALE(d)}, ${SVGConsts.TEXT_HEIGHT[graphId] + Y_SCALE(range[1][1])})`
                    })
            ),
            exit => (exit.remove()),
        )
    infoBoxDF.selectAll("." + graphId + "XLabel")
        .data(xTicks)
        .join(
            enter => (
                enter.append("text")
                    .attr("class", graphId + "XLabel")
                    .attr("transform", function (d) {
                        return `translate(${SVGConsts.HORZ_PADDING + X_SCALE(d)}, ${SVGConsts.TEXT_HEIGHT[graphId] + Y_SCALE(range[1][1]) + 20})`
                    })
                    .text(d => d + "%")
            ),
            update => (
                update.transition()
                    .duration(200)
                    .ease(d3.easeCubicOut)
                    .attr("transform", function (d) {
                        return `translate(${SVGConsts.HORZ_PADDING + X_SCALE(d)}, ${SVGConsts.TEXT_HEIGHT[graphId] + Y_SCALE(range[1][1]) + 20})`
                    })
                    .text(d => d + "%")
            ),
            exit => (exit.remove()),
        )
}

function createCDFArea(data, infoBoxId, graphId, csvIndices, filterFunction, scaleName, furtherProcessing = (d) => (d)) {
    range = SVGConsts.RANGES[graphId];

    const infoBoxDF = d3.select("#" + infoBoxId).select("#" + graphId);

    if (Array.isArray(csvIndices)) {
        var discr = data[csvIndices[0]].concat(data[csvIndices[1]]);
    } else {
        var discr = data[csvIndices];
    }
    discr = discr.filter((line) => filterFunction(line));
    discr = furtherProcessing(discr);

    const X_SCALE = SVGConsts.SCALES[scaleName + "_X"];
    const Y_SCALE = SVGConsts.SCALES[scaleName + "_Y"];

    //console.log(discr);

    const colorsQuestions = {
        "DEXa13": "#6E99A0",
        "DEXa14": "#6D9E70",
    }
    infoBoxDF.selectAll("rect." + graphId + "ItsLikeAnAuc")
        .data(discr)
        .join(
            enter => {
                enter.append("rect")
                    .attr("class", graphId + "ItsLikeAnAuc")
                    .style("fill", (d) => (colorsQuestions[d.question_code]))
                    .style("opacity", 0.5)
                    .attr("transform", (d) => `translate(
                            ${SVGConsts.HORZ_PADDING + X_SCALE(value_to_age_range[d.answer])},
                            ${SVGConsts.TEXT_HEIGHT[graphId] + Y_SCALE(0)}
                        )`
                    )
                    .attr("width", (d) => (X_SCALE(value_to_age_range[String(Number(d.answer) + 1)]) - X_SCALE(value_to_age_range[d.answer])))
                    .transition()
                    .duration(200)
                    .ease(d3.easeCubicOut)
                    .attr("transform", (d) => `translate(
                            ${SVGConsts.HORZ_PADDING + X_SCALE(value_to_age_range[d.answer])},
                            ${SVGConsts.TEXT_HEIGHT[graphId] + Y_SCALE(d.percentage)}
                        )`
                    )
                    .attr("height", (d) => (Y_SCALE(0) - Y_SCALE(d.percentage)))
            },
            update => (
                update.transition()
                    .duration(200)
                    .ease(d3.easeCubicOut)
                    .attr("transform", (d) => `translate(
                            ${SVGConsts.HORZ_PADDING + X_SCALE(value_to_age_range[d.answer])},
                            ${SVGConsts.TEXT_HEIGHT[graphId] + Y_SCALE(d.percentage)}
                        )`
                    )
                    .attr("width", (d) => (X_SCALE(value_to_age_range[String(Number(d.answer) + 1)]) - X_SCALE(value_to_age_range[d.answer])))
                    .attr("height", (d) => (Y_SCALE(0) - Y_SCALE(d.percentage)))
            ),
            exit => (exit.transition()
                .duration(200)
                .ease(d3.easeCubicOut)
                .attr("transform", (d) => `translate(
                        ${SVGConsts.HORZ_PADDING + X_SCALE(value_to_age_range[d.answer])},
                        ${SVGConsts.TEXT_HEIGHT[graphId] + Y_SCALE(0)}
                    )`
                )
                .attr("height", 0)
                .remove()
            ),
        );
    infoBoxDF.selectAll("line." + graphId + "CdfLine")
        .data(discr)
        .join(
            enter => {
                enter.append("line")
                    .attr("class", graphId + "CdfLine")
                    .style("stroke", "black")
                    .style("stroke-width", 1)
                    .attr("transform", (d) => `translate(
                            ${SVGConsts.HORZ_PADDING + X_SCALE(value_to_age_range[d.answer])},
                            ${SVGConsts.TEXT_HEIGHT[graphId] + Y_SCALE(0)}
                        )`
                    )
                    .attr("x2", (d) => (X_SCALE(value_to_age_range[String(Number(d.answer) + 1)]) - X_SCALE(value_to_age_range[d.answer])))
                    .transition()
                    .duration(200)
                    .ease(d3.easeCubicOut)
                    .attr("transform", (d) => `translate(
                            ${SVGConsts.HORZ_PADDING + X_SCALE(value_to_age_range[d.answer])},
                            ${SVGConsts.TEXT_HEIGHT[graphId] + Y_SCALE(d.percentage)}
                        )`
                    );
            },
            update => (
                update.transition()
                    .duration(200)
                    .ease(d3.easeCubicOut)
                    .attr("transform", (d) => `translate(
                            ${SVGConsts.HORZ_PADDING + X_SCALE(value_to_age_range[d.answer])},
                            ${SVGConsts.TEXT_HEIGHT[graphId] + Y_SCALE(d.percentage)}
                        )`
                    )
                    .attr("x2", (d) => (X_SCALE(value_to_age_range[String(Number(d.answer) + 1)]) - X_SCALE(value_to_age_range[d.answer])))

            ),
            exit => (exit.transition()
                .duration(200)
                .ease(d3.easeCubicOut)
                .attr("transform", (d) => `translate(
                        ${SVGConsts.HORZ_PADDING + X_SCALE(value_to_age_range[d.answer])},
                        ${SVGConsts.TEXT_HEIGHT[graphId] + Y_SCALE(0)}
                    )`
                )
                .remove()
            ),
        );
    infoBoxDF.selectAll("line." + graphId + "CdfConnector")
        .data(discr)
        .join(
            enter => {
                enter.append("line")
                    .attr("class", graphId + "CdfConnector")
                    .style("stroke", "black")
                    .style("stroke-width", 1)
                    .attr("transform", (d) => `translate(
                            ${SVGConsts.HORZ_PADDING + X_SCALE(value_to_age_range[String(Number(d.answer) + 1)])},
                            ${SVGConsts.TEXT_HEIGHT[graphId] + Y_SCALE(0)}
                        )`
                    )
                    .attr("y2", 0)
                    .transition()
                    .duration(200)
                    .ease(d3.easeCubicOut)
                    .attr("transform", (d) => `translate(
                            ${SVGConsts.HORZ_PADDING + X_SCALE(value_to_age_range[String(Number(d.answer) + 1)])},
                            ${SVGConsts.TEXT_HEIGHT[graphId] + Y_SCALE(d.percentage)}
                        )`
                    )
                    .attr("y2", (d) => (Y_SCALE(d.nextPercentage) - Y_SCALE(d.percentage)));
            },
            update => (
                update.transition()
                    .duration(200)
                    .ease(d3.easeCubicOut)
                    .attr("transform", (d) => `translate(
                            ${SVGConsts.HORZ_PADDING + X_SCALE(value_to_age_range[String(Number(d.answer) + 1)])},
                            ${SVGConsts.TEXT_HEIGHT[graphId] + Y_SCALE(d.percentage)}
                        )`
                    )
                    .attr("y2", (d) => (Y_SCALE(d.nextPercentage) - Y_SCALE(d.percentage)))
            ),
            exit => (exit.transition()
                .duration(200)
                .ease(d3.easeCubicOut)
                .attr("transform", (d) => `translate(
                        ${SVGConsts.HORZ_PADDING + X_SCALE(value_to_age_range[String(Number(d.answer) + 1)])},
                        ${SVGConsts.TEXT_HEIGHT[graphId] + Y_SCALE(0)}
                    )`
                )
                .attr("y2", 0)
                .remove()),
        );

    infoBoxDF.selectAll("." + graphId + "XTick")
        .data(discr)
        .enter().append("line")
        .style("stroke", "black")
        .style("stroke-width", 1)
        .attr("class", graphId + "XTick")
        .attr("transform", function (d) {
            return `translate(${SVGConsts.HORZ_PADDING + X_SCALE(value_to_age_range[d.answer])}, ${SVGConsts.TEXT_HEIGHT[graphId] + Y_SCALE(range[1][1])})`
        })
        .attr("y2", SVGConsts.WIDTH);
    infoBoxDF.selectAll("." + graphId + "XLabel")
        .data(discr)
        .enter()
        .append("text")
        .attr("class", graphId + "XLabel")
        .attr("transform", function (d) {
            return `translate(${SVGConsts.HORZ_PADDING + X_SCALE(value_to_age_range[d.answer])}, ${SVGConsts.TEXT_HEIGHT[graphId] + Y_SCALE(range[1][1]) + 20})`
        })
        .text(d => value_to_age_range[d.answer]);
}

function createViolinArea(data, infoBoxId, graphId, csvIndices, filterFunction, scaleName, furtherProcessing = (d) => (d)) {
    range = SVGConsts.RANGES[graphId];

    const infoBoxDF = d3.select("#" + infoBoxId).select("#" + graphId);

    if (Array.isArray(csvIndices)) {
        var discr = data[csvIndices[0]].concat(data[csvIndices[1]]);
    } else {
        var discr = data[csvIndices];
    }
    discr = discr.filter((line) => filterFunction(line));
    discr = furtherProcessing(discr);

    const X_SCALE = SVGConsts.SCALES[scaleName + "_X"];
    const Y_SCALE = SVGConsts.SCALES[scaleName + "_Y"];

    densityPlot(X_SCALE, Y_SCALE, range, discr, graphId);

    infoBoxDF.selectAll("circle")
        .data(discr)
        .join(
            enter => (
                enter.append("circle")
                    .attr("r", 3)
                    .attr("transform", (d) => `translate(
                            ${SVGConsts.REDUCED_PADDING + X_SCALE(d.percentage)},
                            ${SVGConsts.TEXT_HEIGHT[graphId] + (Math.random() * 20) + Y_SCALE(range[1][1] / 2)}
                        )`
                    )
                    //.attr("sdfg", (d) => (console.log(d)))
                    .attr("fill", "black")
                    .append("title")
                    .text(d => d.CountryCode)
            ),
            update => (
                update.transition()
                    .duration(200)
                    .ease(d3.easeCubicOut)
                    .attr("transform", (d) => `translate(
                            ${SVGConsts.REDUCED_PADDING + X_SCALE(d.percentage)},
                            ${SVGConsts.TEXT_HEIGHT[graphId] + (Math.random() * 20) + Y_SCALE(range[1][1] / 2)}
                        )`
                    )

            )
        );
}

function createCharts(data) {
    function discrToSimpleLabel(d) { return haveYouFeltDiscInPast12[d.question_label]; }

    // Bar chart 1
    function discrFeltFct(line) {
        return (line.target_group == ctx.SUBSET_SELECTED
            && line.question_code.includes(ctx.BAR1_QUESTIONS)
            && line.CountryCode == ctx.OLD_SEL
            && line.answer == "Yes")
    }
    createAreaBC(data, "information", "discrFelt", 0, discrFeltFct, discrToSimpleLabel, "DF_SCALE");

    function diverging(line) {
        return (line.target_group == ctx.SUBSET_SELECTED
            && [ctx.BAR3A_QUESTIONS, ctx.BAR3B_QUESTIONS].some(questionId => line.question_code.includes(questionId))
            && line.CountryCode != "EU-28"
            && ["Always", "Often"].includes(line.answer));
    }
    function sumAnswersFromSameCountry(discr) {
        const sums = discr.reduce((d, question) => {
            d[question.CountryCode + "__" + question.question_code] = (d[question.CountryCode + "__" + question.question_code] || 0) + Number(question.percentage);
            return d;
        }, {});

        // Reformat so that the template code understands
        var newDiscr = [];
        for (let key in sums) {
            let keySpl = key.split("__");
            newDiscr.push({
                CountryCode: keySpl[0],
                question_code: keySpl[1],
                percentage: sums[key],
            });
        }

        //console.log(newDiscr);
        return newDiscr;
    }
    function getCountry(d) { return d.CountryCode; }
    createDivergingAreaBC(data, "other", "divergingBarChart", 0, diverging, getCountry, "divBoth", sumAnswersFromSameCountry);

    function discrSatis(line) {
        return (line.target_group == ctx.SUBSET_SELECTED
            && ((line.question_code.includes(ctx.SP1_QUESTIONS_X) && line.answer.includes("Yes"))
                || line.question_code.includes(ctx.SP1_QUESTIONS_Y) && line.answer.includes("No"))
            && line.CountryCode != "EU-28");
    }
    function sumAnswersFromSameCountryAndAssociateXY(discr) {
        const sums = discr.reduce((d, question) => {
            if (!d[question.CountryCode]) {
                d[question.CountryCode] = {};
            }
            d[question.CountryCode][question.question_code] = (d[question.CountryCode][question.question_code] || 0) + Number(question.percentage);
            return d;
        }, {});

        // Reformat so that the template code understands
        const newDiscr = Object.keys(sums).map(CountryCode => {
            const countryData = sums[CountryCode];

            // Prepare the new dictionary with both question codes
            return {
                CountryCode: CountryCode,
                question_code_x: ctx.SP1_QUESTIONS_X,
                percentage_x: countryData[ctx.SP1_QUESTIONS_X] || 0,
                question_code_y: ctx.SP1_QUESTIONS_Y,
                percentage_y: countryData[ctx.SP1_QUESTIONS_Y] || 0
            };
        });

        return newDiscr;
    }
    createScatterplotArea(data, "other", "discrVsatisgov", [0, 2], discrSatis, "DISCR_SATIS", sumAnswersFromSameCountryAndAssociateXY);

    function schoolWork(line) {
        return (line.target_group == ctx.SUBSET_SELECTED
            && (line.question_code.includes(ctx.SP2_QUESTIONS_X) || line.question_code.includes(ctx.SP2_QUESTIONS_Y))
            && line.answer.includes("open")
            && line.CountryCode != "EU-28");
    }
    function setupSP_SW(discr) {
        const sums = discr.reduce((d, question) => {
            if (!d[question.CountryCode]) {
                d[question.CountryCode] = {};
            }
            d[question.CountryCode][question.question_code] = (d[question.CountryCode][question.question_code] || 0) + Number(question.percentage);
            return d;
        }, {});

        const newDiscr = Object.keys(sums).map(CountryCode => {
            const countryData = sums[CountryCode];

            return {
                CountryCode: CountryCode,
                question_code_x: ctx.SP2_QUESTIONS_X,
                percentage_x: countryData[ctx.SP2_QUESTIONS_X] || 0,
                question_code_y: ctx.SP2_QUESTIONS_Y,
                percentage_y: countryData[ctx.SP2_QUESTIONS_Y] || 0
            };
        });

        return newDiscr;
    }
    createScatterplotArea(data, "scatterplots", "lgbtSchoolWork", 1, schoolWork, "SCHOOL_WORK", setupSP_SW, varyX = false);


    function friendsFamily(line) {
        return (line.target_group == ctx.SUBSET_SELECTED
            && (line.question_code.includes(ctx.SP3_QUESTIONS_X) || line.question_code.includes(ctx.SP3_QUESTIONS_Y))
            && ["Most", "All"].includes(line.answer)
            && line.CountryCode != "EU-28")
    }
    function setupSP_FF(discr) {
        const sums = discr.reduce((d, question) => {
            if (!d[question.CountryCode]) {
                d[question.CountryCode] = {};
            }
            d[question.CountryCode][question.question_code] = (d[question.CountryCode][question.question_code] || 0) + Number(question.percentage);
            return d;
        }, {});

        const newDiscr = Object.keys(sums).map(CountryCode => {
            const countryData = sums[CountryCode];

            return {
                CountryCode: CountryCode,
                question_code_x: ctx.SP3_QUESTIONS_X,
                percentage_x: countryData[ctx.SP3_QUESTIONS_X] || 0,
                question_code_y: ctx.SP3_QUESTIONS_Y,
                percentage_y: countryData[ctx.SP3_QUESTIONS_Y] || 0
            };
        });

        //console.log(newDiscr);

        return newDiscr;
    }
    createScatterplotArea(data, "scatterplots", "lgbtFriendsFamily", 1, friendsFamily, "FRIENDS_FAMILY", setupSP_FF, varyX = false);


    function realTold(line) {
        return (line.target_group == ctx.SUBSET_SELECTED
            && ctx.CDF1_QUESTIONS.includes(line.question_code)
            && line.CountryCode == ctx.OLD_SEL);
    }
    function setupCDF_RT_LGB(discr) {
        let newDiscr = {};
        let divider = {};

        for (let cdfIndex = 0; cdfIndex < Object.keys(ctx.CDF1_QUESTIONS).length; cdfIndex++) {
            newDiscr[ctx.CDF1_QUESTIONS[cdfIndex]] = {};
            for (let i = 0; i < Object.keys(age_range_to_value).length; i++) {
                newDiscr[ctx.CDF1_QUESTIONS[cdfIndex]][i] = 0;
            }
        }
        //console.log(newDiscr);

        discr.forEach(question => {
            for (let i = Object.keys(age_range_to_value).length - 1; i >= age_range_to_value[question.answer]; i--) {
                newDiscr[question.question_code][i] += Number(question.percentage);
            }
            divider[question.question_code] = 1;
            if ((question.answer == "Dont know") && question.percentage != "0") {
                divider[question.question_code] = 1 - Number(question.percentage) / 100;
            }
        });
        //console.log(discr);

        let newDiscrTrue = [];
        Object.keys(newDiscr).map(question => {

            Object.keys(newDiscr[question]).map(answer => {
                let questionResults = {};
                questionResults["answer"] = answer;
                questionResults["percentage"] = newDiscr[question][answer] / divider[question];
                questionResults["nextPercentage"] = (newDiscr[question][String(Number(answer) + 1)]) ? newDiscr[question][String(Number(answer) + 1)] / divider[question] : newDiscr[question][answer] / divider[question];
                questionResults["CountryCode"] = discr[0].CountryCode;
                questionResults["question_code"] = question;
                questionResults["question_label"] = discr[0].question_label;

                newDiscrTrue.push(questionResults);
            });
        });
        return newDiscrTrue;
    }
    createCDFArea(data, "information", "realToldLGB", 1, realTold, "RT_LGB", setupCDF_RT_LGB);

    function avgSatis(line) {
        return (line.target_group == ctx.SUBSET_SELECTED
            && line.question_code.includes(ctx.VP1_QUESTION)
            && line.CountryCode != "EU-28");
    }
    function calculateAvgSatifaction(discr) {
        //console.log(discr);
        const sums = discr.reduce((d, question) => {
            d[question.CountryCode] = (d[question.CountryCode] || 0) + Number(question.percentage) * Number(question.answer);
            return d;
        }, {});

        const newDiscr = Object.keys(sums).map(CountryCode => {
            const countryData = sums[CountryCode];

            // Prepare the new dictionary with both question codes
            return {
                CountryCode: CountryCode,
                question_code: ctx.VP1_QUESTION,
                percentage: countryData / 100 || 0,
            };
        });
        return newDiscr;
    }
    createViolinArea(data, "other", "avgSatisfaction", 1, avgSatis, "AVG_SATIS", calculateAvgSatifaction);

}

/**
 * Loads the CSV files to create the data. This loads the data and creates the associated visuals,
 * but it does NOT create the non-data items (axis lines, labels, title, numbering, etc.)
 */
function loadLgbtData() {
    // 109 = size of LGBT subset selection
    //ctx.INFO_W = (Number)(d3.select("#countryAndButtonSetup").style('width').slice(0, -2)) - 109 - ctx.INFO_MARGIN;

    var promises = [
        d3.csv("./media/data/LGBTI_Survey_2020/all/Discrimination.csv"),
        d3.csv("./media/data/LGBTI_Survey_2020/all/Living_openly_and_daily_life.csv"),
        d3.csv("./media/data/LGBTI_Survey_2020/all/Social_attitudes_and_government_response.csv"),
        d3.csv("./media/data/LGBTI_Survey_2020/all/Socio_demographics.csv"),
    ];
    Promise.all(promises).then(function (data) {
        createCharts(data);
    }).catch(function (error) { console.log(error) });
}