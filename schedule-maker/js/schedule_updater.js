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

function formatIsoDate(date) {
    return date.toISOString().slice(0, 10);
}

function getRecurringOverlapDates(slotA, slotB) {
    if (slotA.day.toLowerCase() !== slotB.day.toLowerCase() || !timesOverlap(slotA, slotB)) {
        return [];
    }

    const overlapStart = new Date(Math.max(
        parseDate(slotA.startDate).getTime(),
        parseDate(slotB.startDate).getTime()
    ));
    const overlapEnd = new Date(Math.min(
        parseDate(slotA.endDate).getTime(),
        parseDate(slotB.endDate).getTime()
    ));

    if (overlapStart > overlapEnd) return [];

    const targetDay = DAY_TO_NUMBER[slotA.day.toLowerCase()];
    const daysUntilOccurrence = (targetDay - overlapStart.getUTCDay() + 7) % 7;
    const firstOccurrence = new Date(overlapStart);
    firstOccurrence.setUTCDate(firstOccurrence.getUTCDate() + daysUntilOccurrence);
    const dates = [];
    for (const occurrence = new Date(firstOccurrence); occurrence <= overlapEnd; occurrence.setUTCDate(occurrence.getUTCDate() + 7)) {
        dates.push(formatIsoDate(occurrence));
    }
    return dates;
}

function getRecurringAndOneOffOverlapDates(recurring, oneOff) {
    const overlaps = dateIsWithin(oneOff.date, recurring.startDate, recurring.endDate)
        && parseDate(oneOff.date).getUTCDay() === DAY_TO_NUMBER[recurring.day.toLowerCase()]
        && timesOverlap(recurring, oneOff);
    return overlaps ? [oneOff.date] : [];
}

function getOneOffOverlapDates(slotA, slotB) {
    return slotA.date === slotB.date && timesOverlap(slotA, slotB) ? [slotA.date] : [];
}

function addSlotConflict(slotConflicts, courseIndex, slotKey, dates) {
    if (!dates.length) return;
    if (!slotConflicts[courseIndex].has(slotKey)) {
        slotConflicts[courseIndex].set(slotKey, new Set());
    }
    dates.forEach(date => slotConflicts[courseIndex].get(slotKey).add(date));
}

function findOverlaps(selectedIndexes) {
    const overlaps = Object.fromEntries(selectedIndexes.map(index => [index, new Set()]));
    const slotConflicts = Object.fromEntries(selectedIndexes.map(index => [index, new Map()]));

    for (let i = 0; i < selectedIndexes.length; i++) {
        for (let j = i + 1; j < selectedIndexes.length; j++) {
            const indexA = selectedIndexes[i];
            const indexB = selectedIndexes[j];
            const courseA = courses[indexA];
            const courseB = courses[indexB];
            let pairOverlaps = false;

            const recordConflict = (slotKeyA, slotKeyB, dates) => {
                if (!dates.length) return;
                pairOverlaps = true;
                addSlotConflict(slotConflicts, indexA, slotKeyA, dates);
                addSlotConflict(slotConflicts, indexB, slotKeyB, dates);
            };

            courseA.schedule.recurring.forEach((slotA, recurringIndexA) => {
                courseB.schedule.recurring.forEach((slotB, recurringIndexB) => {
                    recordConflict(
                        `recurring-${recurringIndexA}`,
                        `recurring-${recurringIndexB}`,
                        getRecurringOverlapDates(slotA, slotB)
                    );
                });
                courseB.schedule.oneOff.forEach((slotB, oneOffIndexB) => {
                    recordConflict(
                        `recurring-${recurringIndexA}`,
                        `oneOff-${oneOffIndexB}`,
                        getRecurringAndOneOffOverlapDates(slotA, slotB)
                    );
                });
            });

            courseA.schedule.oneOff.forEach((slotA, oneOffIndexA) => {
                courseB.schedule.recurring.forEach((slotB, recurringIndexB) => {
                    recordConflict(
                        `oneOff-${oneOffIndexA}`,
                        `recurring-${recurringIndexB}`,
                        getRecurringAndOneOffOverlapDates(slotB, slotA)
                    );
                });
                courseB.schedule.oneOff.forEach((slotB, oneOffIndexB) => {
                    recordConflict(
                        `oneOff-${oneOffIndexA}`,
                        `oneOff-${oneOffIndexB}`,
                        getOneOffOverlapDates(slotA, slotB)
                    );
                });
            });

            if (pairOverlaps) {
                overlaps[indexA].add(indexB);
                overlaps[indexB].add(indexA);
            }
        }
    }
    return { overlaps, slotConflicts };
}

function getSelectedCourseIndexes() {
    return courses
        .map((course, index) => index)
        .filter(index => document.getElementById(`checkbox${index}`).checked);
}

function calculateTotalEcts(selectedIndexes) {
    return selectedIndexes.reduce((total, index) => total + Number(courses[index].ects), 0);
}

function goToCourse(courseIndex) {
    const courseRow = document.getElementById(`course${courseIndex}`);
    if (!courseRow) return;

    courseRow.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    courseRow.classList.remove("course-jump-highlight");
    void courseRow.offsetWidth;
    courseRow.classList.add("course-jump-highlight");
    window.setTimeout(() => courseRow.classList.remove("course-jump-highlight"), 1800);
}

function renderOverlapLinks(overlapCell, overlappingIndexes) {
    overlapCell.replaceChildren();
    if (!overlappingIndexes.length) {
        overlapCell.textContent = "—";
        return;
    }

    overlappingIndexes.forEach((otherIndex, position) => {
        const linkButton = document.createElement("button");
        linkButton.type = "button";
        linkButton.className = "overlap-link";
        const comma = position < overlappingIndexes.length - 1 ? "," : "";
        linkButton.textContent = `${getCourseName(courses[otherIndex])}${comma}`;
        linkButton.addEventListener("click", () => goToCourse(otherIndex));
        overlapCell.appendChild(linkButton);
    });
}

function renderScheduleConflicts(courseIndex, slotConflictMap) {
    const scheduleCell = document.querySelector(`#course${courseIndex} .schedule-cell`);
    scheduleCell.querySelectorAll(".schedule-conflict-dates").forEach(element => element.remove());

    if (!slotConflictMap) return;
    slotConflictMap.forEach((dateSet, slotKey) => {
        const scheduleSlot = [...scheduleCell.querySelectorAll(".schedule-slot")]
            .find(slot => slot.dataset.slotKey === slotKey);
        if (!scheduleSlot) return;

        const conflictDates = document.createElement("span");
        const dates = [...dateSet].sort().map(formatDate);
        conflictDates.className = "schedule-conflict-dates";
        conflictDates.textContent = `${t("conflictsOn")}: ${dates.join(", ")}`;
        scheduleSlot.appendChild(conflictDates);
    });
}

function updateTT() {
    const selectedIndexes = getSelectedCourseIndexes();
    const totalEcts = calculateTotalEcts(selectedIndexes);
    const ectCount = document.getElementById("ectCount");
    const { overlaps, slotConflicts } = findOverlaps(selectedIndexes);

    ectCount.textContent = `ECTS: ${totalEcts} / 60`;
    ectCount.classList.toggle("requirement-met", totalEcts >= 60);

    courses.forEach((course, index) => {
        const overlappingIndexes = [...(overlaps[index] || [])];
        document.getElementById(`course${index}`).classList.remove("conflict");
        renderOverlapLinks(document.getElementById(`overlap${index}`), overlappingIndexes);
        renderScheduleConflicts(index, slotConflicts[index]);
    });
}
