function transformData(data) {
    csv_satisfaction = data[3];
    avg_satis = {};
    countries.forEach((country) => {
        avg_satis[country] = 0;
    });

    csv_satisfaction = csv_satisfaction
        .filter((line) => (line.target_group == "All" && line.question_code == ctx.MAP_QUESTION))
        .forEach((line) => {
            avg_satis[line.CountryCode] += (Number(ans_to_weight[line.answer])) * (Number(line.percentage));
        });
    ctx.AVG_SATIS = avg_satis;
    //console.log(avg_satis);

    return data;
}

function createColorScaleLegend(colorScale) {
    const height = 251;
    const width = 15;
    const mapScaler = d3.select("#mapScaleRefSvg");

    // Append a gradient to the SVG
    var gradient = mapScaler.append("defs")
        .append("linearGradient")
        .attr("id", "colorGradient")
        .attr("x1", "0%")
        .attr("x2", "0%")
        .attr("y1", "0%")
        .attr("y2", "100%");

    const scaleColorStops = d3.range(-200, 200, 10);
    const scaleTick = d3.range(100, - 1, -10);
    const yScale = d3.scaleLinear([100, 0], [10, height - 3]);

    // Create color stops based on the scale's range
    gradient.selectAll("stop")
        .data(scaleColorStops)
        .enter().append("stop")
        .attr("offset", function (d) { return (d + 200) / 400 * 100 + "%"; })  // Scale the values to percentage offsets
        .attr("stop-color", function (d) { return colorScale(-d); });

    // Create a rectangle to display the gradient
    mapScaler.append("rect")
        .attr("width", width)
        .attr("height", height)
        .style("fill", "url(#colorGradient)");

    mapScaler.selectAll(".mapScaleRefXLabel")
        .data(scaleTick)
        .enter()
        .append("text")
        .attr("class", "mapScaleRefXLabel")
        .attr("x", width + 15)
        .attr("y", d => yScale(d))
        .text(d => d + "%");
}
function createTitle() {
    const svgWidth = 320;
    const mapTitle = d3.select("#mapTitleSvg");
    mapTitle.append("text")
        .attr("id", "mapTitle1")
        .attr("x", svgWidth / 2)
        .attr("y", 17)
        .attr("font-size", ctx.TITLE_PX)
        .text("Do you agree that your government effectively");
    mapTitle.append("text")
        .attr("id", "mapTitle2")
        .attr("x", svgWidth / 2)
        .attr("y", 34)
        .attr("font-size", ctx.TITLE_PX)
        .text("combats LGBTI prejudice and intolerance?");
}

function createMapBis(svgEl, geoData, geoId, geoClass, borders, borderClass) {
    thresh = 0
    darkenAmt = 1;

    const colorScale = d3.scaleSequential([-200, 200], d3.interpolateRdYlGn);

    var isSelectable = [];
    var notSelectable = [];
    geoData.features.forEach(feature => {
        var ctName = feature.properties.na;
        if (countries.includes(ctName)) {
            isSelectable.push(feature);
        }
        else {
            notSelectable.push(feature);
        }
    });

    createTitle();
    createColorScaleLegend(colorScale);

    var geoPathGen = d3.geoPath().projection(ctx.proj);
    svgEl.append("g")
        .attr("id", geoId + "Sel")
        .selectAll("path")
        .data(isSelectable)
        .enter()
        .append("path")
        .attr("id", (d) => (d.properties.na.replace(" ", "")))
        .attr("class", (d) => { if (d.properties.na == "Austria") return "countryAreaSel" }) // Initial default selection
        .attr("onclick", (d) => (`switchSelector('${d.properties.na}')`))
        .attr("d", (d) => (geoPathGen(d)))
        .attr("fill", (d) => (colorScale(ctx.AVG_SATIS[d.properties.na])))
        .on("mouseover", function (event, d) {
            d3.select(this).attr("fill", () => { return d3.hsl(colorScale(ctx.AVG_SATIS[d.properties.na])).darker(darkenAmt); });
        })
        .on("mouseout", function (event, d) {
            d3.select(this).attr("fill", () => { return colorScale(ctx.AVG_SATIS[d.properties.na]); });
        })
        .append("title")
        .text((d) => (d.properties.na));
    svgEl.append("g")
        .attr("id", geoId + "NotSel")
        .selectAll("path")
        .data(notSelectable)
        .enter()
        .append("path")
        .attr("d", (d) => (geoPathGen(d)))
        .attr("class", "nutsArea");
    svgEl.append("g")
        .attr("id", "regionBorder")
        .selectAll("path")
        .data(borders.features)
        .enter()
        .append("path")
        .attr("d", (d) => (geoPathGen(d)))
        .attr("class", borderClass);
}

function createMap(data, svgEl) {
    var graticule = data[0];
    ctx.proj = d3.geoIdentity().reflectY(true).fitSize([ctx.MAP_W, ctx.MAP_H], graticule);
    createMapBis(svgEl, data[1], "countriesInside", "countryArea", data[2], "countryBorder");
}

/**
 * Loads the data needed to create the map.
 * @param {object} svgEl The element containing the map
 */
function loadMapData(svgEl) {
    //ctx.MAP_QUESTION = "DEXlife_sat";
    // Does your government effectively combat LGBTI prejudice and intolerance?
    ctx.MAP_QUESTION = "DEXind_b5"; // Do you think the government in the country where you live combats effectively prejudice and intolerance against LGBTI people?

    var promises = [d3.json("./media/data/map/gra.geojson"), // graticule
    d3.json("./media/data/map/countryrg.geojson"),  // country Area
    d3.json("./media/data/map/countrybn.geojson"),  // country border
    //d3.csv("./media/data/LGBTI_Survey_2020/all/Living_openly_and_daily_life.csv") // Personal satisfaction
    d3.csv("./media/data/LGBTI_Survey_2020/all/Social_attitudes_and_government_response.csv") // Gov satisfaction
    ];
    Promise.all(promises).then(function (data) {
        createMap(transformData(data), svgEl);
    }).catch(function (error) { console.log(error) });
}

/**
 * Creates and displays the map.
 */
function loadMap() {
    var mapBox = d3.select("#map-box").node();
    ctx.MAP_W = (Number)(mapBox.clientWidth) + 5; // Hide sloped border bc coords not aligned exactly to border
    ctx.MAP_H = (Number)(ctx.MAP_W * ctx.RATIO);

    d3.select("#map-box")
        .attr("height", ctx.MAP_H);

    var svgEl = d3.select("#map-box").append("svg").attr("id", "mainSVGElement")
        .attr("width", ctx.MAP_W)
        .attr("height", ctx.MAP_H);
    loadMapData(svgEl);
}