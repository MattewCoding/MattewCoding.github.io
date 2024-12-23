let addedCourses = {
    "monday": {},
    "tuesday": {},
    "wednesday": {},
    "thursday": {},
    "friday": {},
    "saturday": {},
    "sunday": {},
};

function convStrToMinutes(timeString) {
    const timeStringSplit = timeString.split(":").map(Number);
    return 60 * timeStringSplit[0] + timeStringSplit[1];
}

function rangesOverlap(rangeA, rangeB) {
    //console.log(`${rangeA[1]} > ${rangeB[0]} && ${rangeA[0]} < ${rangeB[1]}`);
    return rangeA[1] >= rangeB[0] && rangeA[0] <= rangeB[1];
}

function findOverlaps(data) {
    // Initialize a dictionary to store the overlaps for each id
    const overlaps = {};

    // Loop over each pair of entries in the data to find overlaps
    for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data.length; j++) {
            if (j == i) continue;

            const entryA = data[i];
            const entryB = data[j];

            const currentYear = new Date().getFullYear();
            const startDateA = new Date(`${currentYear}-${entryA.startWeek[1]}-${entryA.startWeek[0]}`);
            const endDateA = new Date(`${currentYear}-${entryA.endWeek[1]}-${entryA.endWeek[0]}`);
            const startDateB = new Date(`${currentYear}-${entryB.startWeek[1]}-${entryB.startWeek[0]}`);
            const endDateB = new Date(`${currentYear}-${entryB.endWeek[1]}-${entryB.endWeek[0]}`);

            //console.log(entryA);
            // Check if entryA and entryB overlap
            //console.log(`${entryA.endTime} > ${entryB.startTime} && ${entryA.startTime} < ${entryB.endTime}`);
            if (
                rangesOverlap([startDateA, endDateA], [startDateB, endDateB])
                && rangesOverlap([entryA.startTime, entryA.endTime], [entryB.startTime, entryB.endTime])
            ) {
                // Ensure entryA's overlaps are stored
                if (!overlaps[entryA.id]) {
                    overlaps[entryA.id] = [];//[entryA.id];
                }
                overlaps[entryA.id].push(entryB.id);

                // Ensure entryB's overlaps are stored
                if (!overlaps[entryB.id]) {
                    overlaps[entryB.id] = [];
                }
            }
        }
    }
    return overlaps;
}

function updateTT(index) {
    //const checkboxId = "checkbox" + index;
    const content = courses[index];
    const courseDay = content[colNameToIndex["day"]].toLowerCase();
    const courseName = content[colNameToIndex["newCourse"]].toLowerCase();

    var previousEct = Number(d3.select("#ectCount").text().split(": ")[1]);

    let accd = addedCourses[courseDay];
    if (courseName in accd) {
        previousEct -= Number(content[[colNameToIndex["ect"]]]);
        let color = "red";
        if (previousEct >= 60) {
            color = "green";
        }
        d3.select("#ectCount")
            .style("color", color)
            .text(`Current ECT amount: ${previousEct}`);

        delete accd[courseName];
    } else {
        previousEct += Number(content[[colNameToIndex["ect"]]]);
        let color = "red";
        if (previousEct >= 60) {
            color = "green";
        }
        d3.select("#ectCount")
            .style("color", color)
            .text(`Current ECT amount: ${previousEct}`);

        const courseWeeks = content[colNameToIndex["weeks"]].toLowerCase().split(" - ");
        const startWeek = courseWeeks[0].split("/").map(Number);
        const endWeek = courseWeeks[1].split("/").map(Number);

        const courseHours = content[colNameToIndex["hours"]].toLowerCase().split(" - ");
        const startTime = convStrToMinutes(courseHours[0]);
        const endTime = convStrToMinutes(courseHours[1]);



        addedCourses[courseDay][courseName] = {
            "id": index,
            "startWeek": startWeek,
            "endWeek": endWeek,
            "startTime": startTime,
            "endTime": endTime,
        };
    }

    //console.log(findOverlaps(Object.values(addedCourses[courseDay])));
    const newOverlaps = findOverlaps(Object.values(addedCourses[courseDay]));

    //console.log(dayToId[courseDay]);
    dayToId[courseDay].forEach(id => {
        //console.log(id);
        d3.select("#course" + id).attr("class", "");
        d3.select("#overlap" + id).text("");
    });

    for (id in newOverlaps) {
        d3.select("#course" + id).attr("class", "conflict");
        d3.select("#overlap" + id).text(newOverlaps[id]);
    }
}