let currentLanguage = "en";

let courses = [];

// Add or edit interface copy here. HTML elements use the matching data-i18n key.
const TRANSLATIONS = {
    en: {
        translator: "Voir la version française", scheduleControls: "Schedule controls",
        darkMode: "Dark Mode", lightMode: "Light Mode", resetSort: "Reset sort",
        clearSelection: "Clear selection", saveSelection: "Save selection",
        savedSelections: "Saved selections", disclaimer: "The dates haven't been updated yet!",
        introduction: "Hello, welcome to the schedule maker! This is a tool to simplify your schedule creation. Click the checkboxes to add a course to your schedule. The page will tell you if there are any overlaps by highlighting conflicting courses in red. As a reminder, you need at least 60 ECTS credits to pass the school year. You must also pass all of the courses that you take.",
        officialNotice: "Note that this only checks whether courses overlap. It is not a replacement for officially requesting your classes on the appropriate website.",
        sourcePrefix: "For full transparency, this page's source code is publicly available at ",
        sourceLink: "this link", sourceSuffix: ". Additionally, this page does not use cookies to store any data.",
        select: "Select", overlapsWith: "Overlaps With", courseName: "Name of Course",
        schedule: "Schedule", moreInformation: "More Information", noSaves: "No saves yet",
        noMatchingCourses: "No matching courses remain", deleteSave: "Delete {name}",
        clearTitle: "Clear selection?", clearMessage: "This will deselect every course. Your named saves will not be affected.",
        nothingToSaveTitle: "Nothing to save", nothingToSaveMessage: "Select at least one course before saving a selection.",
        acknowledge: "OK", saveTitle: "Save selection",
        saveMessage: "Give this group of courses a name so you can restore it later.",
        save: "Save", selectionName: "Selection name", cancel: "Cancel",
        replaceTitle: "Replace saved selection?",
        replaceMessage: "A selection named \"{name}\" already exists. Its courses will be replaced.",
        replace: "Replace", deleteTitle: "Delete saved selection?",
        deleteMessage: "\"{name}\" will be permanently removed from this browser.", delete: "Delete",
        weekly: "Weekly", oneOff: "One-off", view: "View", hide: "Hide",
        courseWebsite: "Course website", noCourseWebsite: "No course website",
        courseId: "Course ID", description: "Description", selectCourse: "Select {name}",
        loadError: "Unable to load course data.",
        days: { monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday", thursday: "Thursday", friday: "Friday", saturday: "Saturday", sunday: "Sunday" },
    },
    fr: {
        translator: "See the English version", scheduleControls: "Commandes de l'emploi du temps",
        darkMode: "Mode sombre", lightMode: "Mode clair", resetSort: "Réinitialiser le tri",
        clearSelection: "Effacer la sélection", saveSelection: "Enregistrer la sélection",
        savedSelections: "Sélections enregistrées", disclaimer: "Les dates n'ont pas encore été mises à jour !",
        introduction: "Bonjour et bienvenue dans ce créateur d'emploi du temps ! Cet outil simplifie la création de ton emploi du temps. Cochez les cases pour ajouter un cours. Les conflits sont signalés en rouge. Pour rappel, tu dois avoir au moins 60 crédits ECTS pour valider l'année, et tu dois aussi réussir tous les cours que tu ve suivre.",
        officialNotice: "Cet outil sert uniquement à vérifier que les cours ne se chevauchent pas. Il ne remplace pas l'inscription officielle aux cours sur le site prévu à cet effet.",
        sourcePrefix: "En toute transparence, le code source de cette page est disponible publiquement via ",
        sourceLink: "ce lien", sourceSuffix: ". De plus, cette page n'utilise aucun cookie pour stocker des données.",
        select: "Sélectionner", overlapsWith: "Chevauchement avec", courseName: "Nom du cours",
        schedule: "Horaire", moreInformation: "Plus d'informations", noSaves: "Aucune sélection enregistrée",
        noMatchingCourses: "Aucun cours correspondant", deleteSave: "Supprimer {name}",
        clearTitle: "Effacer la sélection ?", clearMessage: "Tous les cours seront désélectionnés. Vos sélections enregistrées ne seront pas modifiées.",
        nothingToSaveTitle: "Aucun cours à enregistrer", nothingToSaveMessage: "Sélectionnez au moins un cours avant d'enregistrer une sélection.",
        acknowledge: "D'accord", saveTitle: "Enregistrer la sélection",
        saveMessage: "Donnez un nom à ce groupe de cours afin de pouvoir le restaurer plus tard.",
        save: "Enregistrer", selectionName: "Nom de la sélection", cancel: "Annuler",
        replaceTitle: "Remplacer la sélection enregistrée ?",
        replaceMessage: "Une sélection nommée \"{name}\" existe déjà. Ses cours seront remplacés.",
        replace: "Remplacer", deleteTitle: "Supprimer la sélection enregistrée ?",
        deleteMessage: "\"{name}\" sera définitivement supprimée de ce navigateur.", delete: "Supprimer",
        weekly: "Chaque semaine", oneOff: "Séance unique", view: "Voir", hide: "Masquer",
        courseWebsite: "Site du cours", noCourseWebsite: "Aucun site pour ce cours",
        courseId: "Identifiant du cours", description: "Description (probablement en anglais)", selectCourse: "Sélectionner {name}",
        loadError: "Impossible de charger les données des cours.",
        days: { monday: "Lundi", tuesday: "Mardi", wednesday: "Mercredi", thursday: "Jeudi", friday: "Vendredi", saturday: "Samedi", sunday: "Dimanche" },
    },
};

const STORAGE_KEYS = {
    theme: "scheduleMaker.theme",
    language: "scheduleMaker.language",
    selectedCourses: "scheduleMaker.selectedCourses",
    savedSelections: "scheduleMaker.savedSelections",
};

function t(key, variables = {}) {
    const value = TRANSLATIONS[currentLanguage][key] ?? TRANSLATIONS.en[key] ?? key;
    if (typeof value !== "string") return value;
    return Object.entries(variables).reduce(
        (text, [name, replacement]) => text.replaceAll(`{${name}}`, replacement),
        value
    );
}

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

function getLocalizedCourseField(course, field) {
    if (currentLanguage === "fr") return course[`${field}Fr`] || course[field];
    return course[field];
}

function getCourseName(course) {
    return getLocalizedCourseField(course, "name");
}

function getCourseDescription(course) {
    return getLocalizedCourseField(course, "description");
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
        title: t("clearTitle"),
        message: t("clearMessage"),
        confirmLabel: t("clearSelection"),
        cancelLabel: t("cancel"),
        danger: true,
    });
    if (!confirmed) return;
    applyCourseSelection([]);
}

async function saveNamedSelection() {
    const selectedCourseIds = getSelectedCourseIds();
    if (!selectedCourseIds.length) {
        await showSiteDialog({
            title: t("nothingToSaveTitle"),
            message: t("nothingToSaveMessage"),
            confirmLabel: t("acknowledge"),
            cancelLabel: null,
        });
        return;
    }

    const saveName = await showSiteDialog({
        title: t("saveTitle"),
        message: t("saveMessage"),
        confirmLabel: t("save"),
        cancelLabel: t("cancel"),
        inputLabel: t("selectionName"),
    });
    if (!saveName) return;

    const saves = getSavedSelections();
    if (Object.hasOwn(saves, saveName)) {
        const replaceConfirmed = await showSiteDialog({
            title: t("replaceTitle"),
            message: t("replaceMessage", { name: saveName }),
            confirmLabel: t("replace"),
            cancelLabel: t("cancel"),
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
        title: t("deleteTitle"),
        message: t("deleteMessage", { name: saveName }),
        confirmLabel: t("delete"),
        cancelLabel: t("cancel"),
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
        emptyItem.textContent = t("noSaves");
        list.appendChild(emptyItem);
        return;
    }

    const courseNameById = new Map(courses.map(course => [getCourseStorageId(course), getCourseName(course)]));
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
        loadButton.title = savedNames.join(", ") || t("noMatchingCourses");
        loadButton.addEventListener("click", () => loadNamedSelection(saveName));

        deleteButton.type = "button";
        deleteButton.className = "delete-save";
        deleteButton.textContent = "×";
        deleteButton.setAttribute("aria-label", t("deleteSave", { name: saveName }));
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
        `<span class="schedule-slot"><strong>${t("weekly")}:</strong> ${t("days")[slot.day.toLowerCase()] || slot.day}, ${slot.startTime}–${slot.endTime}<br>` +
        `<small>${formatDate(slot.startDate)}–${formatDate(slot.endDate)}</small></span>`
    );
    const oneOff = course.schedule.oneOff.map(slot =>
        `<span class="schedule-slot"><strong>${t("oneOff")}:</strong> ${formatDate(slot.date)}, ${slot.startTime}–${slot.endTime}</span>`
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
    button.textContent = willOpen ? t("hide") : t("view");
}

function createTable() {
    const tableBody = document.getElementById("scheduleBody");
    const storedSelections = new Set(getStoredCourseSelections());

    courses.forEach((course, index) => {
        const courseName = getCourseName(course);
        const courseDescription = getCourseDescription(course);
        const courseWebsite = course.url === "no url lol"
            ? `<span>${t("noCourseWebsite")}</span>`
            : `<a href="${course.url}" target="_blank" rel="noopener noreferrer">${t("courseWebsite")}</a>`;
        const courseRow = document.createElement("tr");
        courseRow.id = `course${index}`;
        courseRow.className = "course-row";
        courseRow.dataset.courseIndex = index;
        courseRow.dataset.ects = course.ects;
        courseRow.dataset.name = courseName.toLowerCase();
        courseRow.dataset.schedule = getCourseSortTimestamp(course);
        courseRow.innerHTML = `
            <td class="select-cell"><label for="checkbox${index}" title="${t("selectCourse", { name: courseName })}">
                <input type="checkbox" id="checkbox${index}" onchange="handleCourseSelectionChange()"
                    aria-label="${t("selectCourse", { name: courseName })}">
            </label></td>
            <td id="overlap${index}" class="overlap-cell">—</td>
            <td>${course.ects}</td>
            <td class="course-name">${courseName}</td>
            <td class="schedule-cell">${formatSchedule(course)}</td>
            <td class="info-cell"><button type="button" class="details-toggle" id="detailsButton${index}"
                aria-expanded="false" aria-controls="details${index}"
                onclick="toggleCourseDetails(${index})">${t("view")}</button></td>`;

        const detailsRow = document.createElement("tr");
        detailsRow.id = `details${index}`;
        detailsRow.className = "details-row";
        detailsRow.dataset.detailsFor = index;
        detailsRow.setAttribute("aria-hidden", "true");
        detailsRow.innerHTML = `
            <td colspan="6"><div class="details-panel">
                <div><strong>${t("courseId")}</strong><span>${course.newCourseId}</span></div>
                <div><strong>${t("description")}</strong><span>${courseDescription}</span></div>
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
    currentLanguage = currentLanguage === "en" ? "fr" : "en";
    writeStoredValue(STORAGE_KEYS.language, currentLanguage);
    applyLanguage();
}

function applyLanguage() {
    document.documentElement.lang = currentLanguage;
    document.querySelectorAll("[data-i18n]").forEach(element => {
        element.textContent = t(element.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-aria-label]").forEach(element => {
        element.setAttribute("aria-label", t(element.dataset.i18nAriaLabel));
    });
    document.getElementById("translator").textContent = t("translator");
    updateThemeButtonLabel();

    if (courses.length) {
        const selectedIds = getSelectedCourseIds();
        document.getElementById("scheduleBody").replaceChildren();
        createTable();
        resetTableSort();
        applyCourseSelection(selectedIds);
        renderSavedSelections();
    }
}

function updateThemeButtonLabel() {
    const toggleBtn = document.getElementById("darkModeButton");
    if (!toggleBtn) return;
    toggleBtn.textContent = t(toggleBtn.dataset.darkModeEnabled === "true" ? "lightMode" : "darkMode");
}

function addDarkModeListener() {
    const toggleBtn = document.getElementById("darkModeButton");
    const lightStylesheet = document.getElementById("lightStylesheet");
    const darkStylesheet = document.getElementById("darkStylesheet");
    let darkModeEnabled = readStoredValue(STORAGE_KEYS.theme) !== "light";

    function applyTheme() {
        darkStylesheet.disabled = !darkModeEnabled;
        lightStylesheet.disabled = darkModeEnabled;
        toggleBtn.dataset.darkModeEnabled = String(darkModeEnabled);
        updateThemeButtonLabel();
    }

    applyTheme();

    toggleBtn.addEventListener("click", () => {
        darkModeEnabled = !darkModeEnabled;
        applyTheme();
        writeStoredValue(STORAGE_KEYS.theme, darkModeEnabled ? "dark" : "light");
    });
}

async function loadPage() {
    currentLanguage = readStoredValue(STORAGE_KEYS.language) === "fr" ? "fr" : "en";
    applyLanguage();
    addDarkModeListener();
    try {
        await loadCourses();
        createTable();
        renderSavedSelections();
        updateTT();
    } catch (error) {
        document.getElementById("ectCount").textContent = t("loadError");
        console.error(error);
    }
}
