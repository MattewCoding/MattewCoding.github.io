let frenchVersion = false;

let courses = [];

const STORAGE_KEYS = {
    theme: "scheduleMaker.theme",
    selectedCourses: "scheduleMaker.selectedCourses",
    savedSelections: "scheduleMaker.savedSelections",
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

function getSavedSelections() {
    const storedSaves = readStoredValue(STORAGE_KEYS.savedSelections);
    if (!storedSaves) return {};

    try {
        const parsedSaves = JSON.parse(storedSaves);
        return parsedSaves && typeof parsedSaves === "object" && !Array.isArray(parsedSaves)
            ? parsedSaves
            : {};
    } catch (error) {
        console.warn("Saved selections could not be read.", error);
        return {};
    }
}

function getSelectedCourseIds() {
    return courses
        .filter((course, index) => document.getElementById(`checkbox${index}`).checked)
        .map(getCourseStorageId);
}

function saveCourseSelections() {
    writeStoredValue(STORAGE_KEYS.selectedCourses, JSON.stringify(getSelectedCourseIds()));
}

function handleCourseSelectionChange() {
    saveCourseSelections();
    updateTT();
}

function showSiteDialog({
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    danger = false,
    inputLabel = null,
}) {
    const dialog = document.getElementById("siteDialog");
    const form = document.getElementById("siteDialogForm");
    const inputGroup = document.getElementById("siteDialogInputGroup");
    const input = document.getElementById("siteDialogInput");
    const cancelButton = document.getElementById("siteDialogCancel");
    const confirmButton = document.getElementById("siteDialogConfirm");

    form.reset();
    document.getElementById("siteDialogTitle").textContent = title;
    document.getElementById("siteDialogMessage").textContent = message;
    document.getElementById("siteDialogInputLabel").textContent = inputLabel || "";
    inputGroup.hidden = !inputLabel;
    input.required = Boolean(inputLabel);
    cancelButton.hidden = !cancelLabel;
    cancelButton.textContent = cancelLabel || "";
    confirmButton.textContent = confirmLabel;
    confirmButton.classList.toggle("danger-action", danger);
    confirmButton.classList.toggle("primary-action", !danger);
    dialog.returnValue = "";

    return new Promise(resolve => {
        dialog.addEventListener("close", () => {
            if (dialog.returnValue !== "confirm") {
                resolve(null);
                return;
            }
            resolve(inputLabel ? input.value.trim() : true);
        }, { once: true });

        dialog.showModal();
        requestAnimationFrame(() => (inputLabel ? input : confirmButton).focus());
    });
}

function applyCourseSelection(courseIds) {
    const selectedIds = new Set(courseIds);
    courses.forEach((course, index) => {
        document.getElementById(`checkbox${index}`).checked = selectedIds.has(getCourseStorageId(course));
    });
    saveCourseSelections();
    updateTT();
}

async function clearCourseSelections() {
    const confirmed = await showSiteDialog({
        title: "Clear selection?",
        message: "This will deselect every course. Your named saves will not be affected.",
        confirmLabel: "Clear selection",
        danger: true,
    });
    if (!confirmed) return;
    applyCourseSelection([]);
}

async function saveNamedSelection() {
    const selectedCourseIds = getSelectedCourseIds();
    if (!selectedCourseIds.length) {
        await showSiteDialog({
            title: "Nothing to save bro",
            message: "You gotta select at least one course before saving a selection.",
            confirmLabel: "oh right lol",
            cancelLabel: null,
        });
        return;
    }

    const saveName = await showSiteDialog({
        title: "Save selection",
        message: "Give this group of courses a name so you can restore it later.",
        confirmLabel: "Save",
        inputLabel: "Selection name",
    });
    if (!saveName) return;

    const saves = getSavedSelections();
    if (Object.hasOwn(saves, saveName)) {
        const replaceConfirmed = await showSiteDialog({
            title: "Replace saved selection?",
            message: `A selection named "${saveName}" already exists. Its courses will be replaced.`,
            confirmLabel: "Replace",
            danger: true,
        });
        if (!replaceConfirmed) return;
    }

    saves[saveName] = selectedCourseIds;
    writeStoredValue(STORAGE_KEYS.savedSelections, JSON.stringify(saves));
    renderSavedSelections();
}

function loadNamedSelection(saveName) {
    const savedCourseIds = getSavedSelections()[saveName];
    if (Array.isArray(savedCourseIds)) applyCourseSelection(savedCourseIds);
}

async function deleteNamedSelection(saveName) {
    const confirmed = await showSiteDialog({
        title: "Delete saved selection?",
        message: `"${saveName}" will be permanently removed from this browser.`,
        confirmLabel: "Delete",
        danger: true,
    });
    if (!confirmed) return;
    const saves = getSavedSelections();
    delete saves[saveName];
    writeStoredValue(STORAGE_KEYS.savedSelections, JSON.stringify(saves));
    renderSavedSelections();
}

function renderSavedSelections() {
    const list = document.getElementById("savedSelectionsList");
    const saves = getSavedSelections();
    const saveNames = Object.keys(saves);
    list.replaceChildren();

    if (!saveNames.length) {
        const emptyItem = document.createElement("li");
        emptyItem.className = "empty-saves";
        emptyItem.textContent = "No saves yet";
        list.appendChild(emptyItem);
        return;
    }

    const courseNameById = new Map(courses.map(course => [getCourseStorageId(course), course.name]));
    saveNames.forEach(saveName => {
        const item = document.createElement("li");
        const loadButton = document.createElement("button");
        const deleteButton = document.createElement("button");
        const savedCourseIds = Array.isArray(saves[saveName]) ? saves[saveName] : [];
        const savedNames = savedCourseIds
            .map(courseId => courseNameById.get(courseId))
            .filter(Boolean);

        loadButton.type = "button";
        loadButton.className = "load-save";
        loadButton.textContent = saveName;
        loadButton.title = savedNames.join(", ") || "No matching courses remain";
        loadButton.addEventListener("click", () => loadNamedSelection(saveName));

        deleteButton.type = "button";
        deleteButton.className = "delete-save";
        deleteButton.textContent = "×";
        deleteButton.setAttribute("aria-label", `Delete ${saveName}`);
        deleteButton.addEventListener("click", () => deleteNamedSelection(saveName));

        item.append(loadButton, deleteButton);
        list.appendChild(item);
    });
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
        const courseWebsite = course.url === "no url lol"
            ? "<span>no url lol</span>"
            : `<a href="${course.url}" target="_blank" rel="noopener noreferrer">Course website</a>`;
        const courseRow = document.createElement("tr");
        courseRow.id = `course${index}`;
        courseRow.className = "course-row";
        courseRow.dataset.courseIndex = index;
        courseRow.dataset.ects = course.ects;
        courseRow.dataset.name = course.name.toLowerCase();
        courseRow.dataset.schedule = getCourseSortTimestamp(course);
        courseRow.innerHTML = `
            <td class="select-cell"><label for="checkbox${index}" title="Select ${course.name}">
                <input type="checkbox" id="checkbox${index}" onchange="handleCourseSelectionChange()"
                    aria-label="Select ${course.name}">
            </label></td>
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
                ${courseWebsite}
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
        renderSavedSelections();
        updateTT();
    } catch (error) {
        document.getElementById("ectCount").textContent = "Unable to load course data.";
        console.error(error);
    }
}
