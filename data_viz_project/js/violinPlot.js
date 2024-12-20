function densityPlot(effTScale, Y_SCALE, range, data, sG) {
    //console.log(data);

    let effTs = data.map(function (p) { return p.percentage; });

    let density = kernelDensityEstimator(kernelEpanechnikov(1), effTScale.ticks(50))(effTs);
    let maxDensity = d3.max(density, (d) => (d[1]));
    let densityScale = d3.scaleLinear()
        .domain([0, maxDensity])
        .range([0, Y_SCALE(range[1][1]) / 3]);
    // remove entries where y=0 to avoid unnecessarily-long tails
    let i = 0;
    let lastNonZeroBucket = -1;
    while (i < density.length) {
        // walk array backward, find last entry >0 at index n, keep n+1
        if (density[i][0] > 0) {
            lastNonZeroBucket = i;
            break;
        }
        i++;
    }
    if (lastNonZeroBucket != density.length) {
        density = density.splice(lastNonZeroBucket);
    }
    // insert a point at 0,0 so that the path fill does not cross the curve
    density.unshift([0, 0]);
    density.push([range[1][1], 0]);
    //console.log(density);

    //console.log(density);
    // Update or append bottomPath
    d3.select("#" + sG)
        .selectAll("path#" + sG + "bottomPath")
        .data([density])
        .join(
            enter => enter
                .append("path")
                .attr("id", sG + "bottomPath")
                .attr("fill", "#6E99A0")
                .attr("d", d3.line()
                    .curve(d3.curveBasis)
                    .x(function (d) { return effTScale(d[0]) + SVGConsts.REDUCED_PADDING; })
                    .y(function (d) { return Y_SCALE(range[1][1]) + densityScale(d[1]); })),
            update =>
                update.transition()
                    .duration(200)
                    .ease(d3.easeCubicOut)
                    .attr("d", d3.line()
                        .curve(d3.curveBasis)
                        .x(function (d) { return effTScale(d[0]) + SVGConsts.REDUCED_PADDING; })
                        .y(function (d) { return Y_SCALE(range[1][1]) + densityScale(d[1]); })),
            exit => exit.remove()
        );

    // Update or append topPath
    d3.select("#" + sG)
        .selectAll("path#" + sG + "topPath")
        .data([density])
        .join(
            enter => enter
                .append("path")
                .attr("id", sG + "topPath")
                .attr("fill", "#6E99A0")
                .attr("d", d3.line()
                    .curve(d3.curveBasis)
                    .x(function (d) { return effTScale(d[0]) + SVGConsts.REDUCED_PADDING; })
                    .y(function (d) { return Y_SCALE(range[1][1]) - densityScale(d[1]) + 1; })),
            update =>
                update.transition()
                    .duration(200)
                    .ease(d3.easeCubicOut)
                    .attr("d", d3.line()
                        .curve(d3.curveBasis)
                        .x(function (d) { return effTScale(d[0]) + SVGConsts.REDUCED_PADDING; })
                        .y(function (d) { return Y_SCALE(range[1][1]) - densityScale(d[1]) + 1; })),
            exit => exit.remove()
        );  // +1 to account for center pixel


};

function kernelDensityEstimator(kernel, X) {
    return function (V) {
        return X.map(function (x) {
            return [x, d3.mean(V, function (v) { return kernel(x - v); })];
        });
    };
}

function kernelEpanechnikov(k) {
    return function (v) {
        return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
    };
}