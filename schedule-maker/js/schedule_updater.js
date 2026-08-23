const DAY_TO_NUMBER = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
};

function convStrToMinutes(timeString) {
    const [hours, minutes] = timeString.split(":").map(Number);
    return (hours * 60) + minutes;
}

function timesOverlap(slotA, slotB) {
    return convStrToMinutes(slotA.startTime) < convStrToMinutes(slotB.endTime)
        && convStrToMinutes(slotB.startTime) < convStrToMinutes(slotA.endTime);
}

function parseDate(dateString) {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day));
}

function dateIsWithin(date, startDate, endDate) {
    const timestamp = parseDate(date).getTime();
    return timestamp >= parseDate(startDate).getTime()
        && timestamp <= parseDate(endDate).getTime();
}

function recurringSlotsOverlap(slotA, slotB) {
    if (slotA.day.toLowerCase() !== slotB.day.toLowerCase() || !timesOverlap(slotA, slotB)) {
        return false;
    }

    const overlapStart = new Date(Math.max(
        parseDate(slotA.startDate).getTime(),
        parseDate(slotB.startDate).getTime()
    ));
    const overlapEnd = new Date(Math.min(
        parseDate(slotA.endDate).getTime(),
        parseDate(slotB.endDate).getTime()
    ));

    if (overlapStart > overlapEnd) return false;

    const targetDay = DAY_TO_NUMBER[slotA.day.toLowerCase()];
    const daysUntilOccurrence = (targetDay - overlapStart.getUTCDay() + 7) % 7;
    const firstOccurrence = new Date(overlapStart);
    firstOccurrence.setUTCDate(firstOccurrence.getUTCDate() + daysUntilOccurrence);
    return firstOccurrence <= overlapEnd;
}

function recurringAndOneOffOverlap(recurring, oneOff) {
    return dateIsWithin(oneOff.date, recurring.startDate, recurring.endDate)
        && parseDate(oneOff.date).getUTCDay() === DAY_TO_NUMBER[recurring.day.toLowerCase()]
        && timesOverlap(recurring, oneOff);
}

function oneOffSlotsOverlap(slotA, slotB) {
    return slotA.date === slotB.date && timesOverlap(slotA, slotB);
}

function coursesOverlap(courseA, courseB) {
    const recurringA = courseA.schedule.recurring;
    const recurringB = courseB.schedule.recurring;
    const oneOffA = courseA.schedule.oneOff;
    const oneOffB = courseB.schedule.oneOff;

    return recurringA.some(slotA => recurringB.some(slotB => recurringSlotsOverlap(slotA, slotB)))
        || recurringA.some(slotA => oneOffB.some(slotB => recurringAndOneOffOverlap(slotA, slotB)))
        || recurringB.some(slotB => oneOffA.some(slotA => recurringAndOneOffOverlap(slotB, slotA)))
        || oneOffA.some(slotA => oneOffB.some(slotB => oneOffSlotsOverlap(slotA, slotB)));
}

function findOverlaps(selectedIndexes) {
    const overlaps = Object.fromEntries(selectedIndexes.map(index => [index, []]));

    for (let i = 0; i < selectedIndexes.length; i++) {
        for (let j = i + 1; j < selectedIndexes.length; j++) {
            const indexA = selectedIndexes[i];
            const indexB = selectedIndexes[j];
            if (coursesOverlap(courses[indexA], courses[indexB])) {
                overlaps[indexA].push(indexB);
                overlaps[indexB].push(indexA);
            }
        }
    }
    return overlaps;
}

function getSelectedCourseIndexes() {
    return courses
        .map((course, index) => index)
        .filter(index => document.getElementById(`checkbox${index}`).checked);
}

function calculateTotalEcts(selectedIndexes) {
    return selectedIndexes.reduce((total, index) => total + Number(courses[index].ects), 0);
}

function updateTT() {
    const selectedIndexes = getSelectedCourseIndexes();
    const totalEcts = calculateTotalEcts(selectedIndexes);
    const ectCount = document.getElementById("ectCount");
    const overlaps = findOverlaps(selectedIndexes);

    ectCount.textContent = `ECTS: ${totalEcts} / 60`;
    ectCount.classList.toggle("requirement-met", totalEcts >= 60);

    courses.forEach((course, index) => {
        const overlappingIndexes = overlaps[index] || [];
        document.getElementById(`course${index}`).classList.toggle("conflict", overlappingIndexes.length > 0);
        document.getElementById(`overlap${index}`).textContent = overlappingIndexes.length
            ? overlappingIndexes.map(otherIndex => courses[otherIndex].name).join(", ")
            : "—";
    });
}
