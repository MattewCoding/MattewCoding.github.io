let frenchVersion = false;

let courses = [];

const STORAGE_KEYS = {
    theme: "scheduleMaker.theme",
    selectedCourses: "scheduleMaker.selectedCourses",
};

function readStoredValue(key) {
    try {
        return localStorage.getItem(key);
    } catch (error) {
        console.warn("Local storage is unavailable.", error);
        return null;
    }
}

function writeStoredValue(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (error) {
        console.warn("Local storage is unavailable.", error);
    }
}

function getCourseStorageId(course) {
    return course.oldCourseId || course.newCourseId || course.name;
}

function getStoredCourseSelections() {
    const storedSelections = readStoredValue(STORAGE_KEYS.selectedCourses);
    if (!storedSelections) return [];

    try {
        const parsedSelections = JSON.parse(storedSelections);
        return Array.isArray(parsedSelections) ? parsedSelections : [];
    } catch (error) {
        console.warn("Stored course selections could not be read.", error);
        return [];
    }
}

function saveCourseSelections() {
    const selectedCourseIds = courses
        .filter((course, index) => document.getElementById(`checkbox${index}`).checked)
        .map(getCourseStorageId);

    writeStoredValue(STORAGE_KEYS.selectedCourses, JSON.stringify(selectedCourseIds));
}

function handleCourseSelectionChange() {
    saveCourseSelections();
    updateTT();
}

async function loadCourses() {
    const response = await fetch("./data/courses.json");
    if (!response.ok) {
        throw new Error(`Unable to load courses (${response.status})`);
    }
    courses = await response.json();
}

function formatDate(dateString) {
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
}

function formatSchedule(course) {
    const recurring = course.schedule.recurring.map(slot =>
        `<span class="schedule-slot"><strong>Weekly:</strong> ${slot.day}, ${slot.startTime}–${slot.endTime}<br>` +
        `<small>${formatDate(slot.startDate)}–${formatDate(slot.endDate)}</small></span>`
    );
    const oneOff = course.schedule.oneOff.map(slot =>
        `<span class="schedule-slot"><strong>One-off:</strong> ${formatDate(slot.date)}, ${slot.startTime}–${slot.endTime}</span>`
    );
    return [...recurring, ...oneOff].join("");
}

function toggleCourseDetails(index) {
    const detailsRow = document.getElementById(`details${index}`);
    const button = document.getElementById(`detailsButton${index}`);
    const willOpen = !detailsRow.classList.contains("is-open");

    detailsRow.classList.toggle("is-open", willOpen);
    detailsRow.setAttribute("aria-hidden", String(!willOpen));
    button.setAttribute("aria-expanded", String(willOpen));
    button.textContent = willOpen ? "Hide" : "View";
}

function createTable() {
    const tableBody = document.getElementById("scheduleBody");
    const storedSelections = new Set(getStoredCourseSelections());

    courses.forEach((course, index) => {
        const courseRow = document.createElement("tr");
        courseRow.id = `course${index}`;
        courseRow.className = "course-row";
        courseRow.dataset.courseIndex = index;
        courseRow.dataset.ects = course.ects;
        courseRow.dataset.name = course.name.toLowerCase();
        courseRow.dataset.schedule = getCourseSortTimestamp(course);
        courseRow.innerHTML = `
            <td><input type="checkbox" id="checkbox${index}" onchange="handleCourseSelectionChange()"
                aria-label="Select ${course.name}"></td>
            <td id="overlap${index}" class="overlap-cell">—</td>
            <td>${course.ects}</td>
            <td class="course-name">${course.name}</td>
            <td class="schedule-cell">${formatSchedule(course)}</td>
            <td><button type="button" class="details-toggle" id="detailsButton${index}"
                aria-expanded="false" aria-controls="details${index}"
                onclick="toggleCourseDetails(${index})">View</button></td>`;

        const detailsRow = document.createElement("tr");
        detailsRow.id = `details${index}`;
        detailsRow.className = "details-row";
        detailsRow.dataset.detailsFor = index;
        detailsRow.setAttribute("aria-hidden", "true");
        detailsRow.innerHTML = `
            <td colspan="6"><div class="details-panel">
                <div><strong>Course ID</strong><span>${course.newCourseId}</span></div>
                <div><strong>Description</strong><span>${course.description}</span></div>
                <a href="${course.url}" target="_blank" rel="noopener noreferrer">Course website</a>
            </div></td>`;

        courseRow.querySelector("input").checked = storedSelections.has(getCourseStorageId(course));
        tableBody.append(courseRow, detailsRow);
    });
}

function getCourseSortTimestamp(course) {
    const recurring = course.schedule.recurring.map(slot => `${slot.startDate}T${slot.startTime}`);
    const oneOff = course.schedule.oneOff.map(slot => `${slot.date}T${slot.startTime}`);
    return [...recurring, ...oneOff].sort()[0] || "";
}

function translateToFrench() {
    document.getElementById("translator").textContent = frenchVersion
        ? "Voir la version française"
        : "See the English version";
    frenchVersion = !frenchVersion;
}

function addDarkModeListener() {
    const toggleBtn = document.getElementById("darkModeButton");
    const lightStylesheet = document.getElementById("lightStylesheet");
    const darkStylesheet = document.getElementById("darkStylesheet");
    let darkModeEnabled = readStoredValue(STORAGE_KEYS.theme) !== "light";

    function applyTheme() {
        darkStylesheet.disabled = !darkModeEnabled;
        lightStylesheet.disabled = darkModeEnabled;
        toggleBtn.textContent = darkModeEnabled ? "Light Mode" : "Dark Mode";
    }

    applyTheme();

    toggleBtn.addEventListener("click", () => {
        darkModeEnabled = !darkModeEnabled;
        applyTheme();
        writeStoredValue(STORAGE_KEYS.theme, darkModeEnabled ? "dark" : "light");
    });
}

async function loadPage() {
    addDarkModeListener();
    try {
        await loadCourses();
        createTable();
        updateTT();
    } catch (error) {
        document.getElementById("ectCount").textContent = "Unable to load course data.";
        console.error(error);
    }
}
