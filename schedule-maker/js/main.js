let frenchVersion = false;

const courses = [
    {
        ects: 2.5,
        oldCourseId: "TP-IGR201",
        newCourseId: "placeholder",
        name: "Interactive 2D/Mobile/Web Application Development",
        description: "Placeholder description for this course.",
        url: "https://perso.telecom-paristech.fr/elc/igr201/",
        schedule: {
            recurring: [{
                startDate: "2026-09-16",
                endDate: "2026-11-14",
                day: "Monday",
                startTime: "08:30",
                endTime: "11:45",
            }],
            oneOff: [],
        },
    },
    {
        ects: 5,
        oldCourseId: "TP-IGR203",
        newCourseId: "placeholder",
        name: "Human-Computer Interaction",
        description: "Placeholder description for this course.",
        url: "https://perso.telecom-paristech.fr/elc/igr203/index.html",
        schedule: {
            recurring: [{
                startDate: "2027-02-17",
                endDate: "2027-04-14",
                day: "Monday",
                startTime: "13:30",
                endTime: "16:45",
            }],
            oneOff: [],
        },
    },
    {
        ects: 5,
        oldCourseId: "DEMO-OLD-101",
        newCourseId: "DEMO-101",
        name: "Example Course with Multiple Meeting Types",
        description: "A fake course demonstrating two recurring weekly slots and one irregular, one-off class.",
        url: "https://example.com/",
        schedule: {
            recurring: [
                {
                    startDate: "2026-09-21",
                    endDate: "2026-10-30",
                    day: "Monday",
                    startTime: "10:00",
                    endTime: "12:00",
                },
                {
                    startDate: "2026-09-21",
                    endDate: "2026-10-30",
                    day: "Thursday",
                    startTime: "14:00",
                    endTime: "15:30",
                },
            ],
            oneOff: [
                {
                    date: "2026-10-02",
                    startTime: "09:00",
                    endTime: "11:00",
                },
            ],
        },
    },
];

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

    courses.forEach((course, index) => {
        const courseRow = document.createElement("tr");
        courseRow.id = `course${index}`;
        courseRow.className = "course-row";
        courseRow.dataset.courseIndex = index;
        courseRow.dataset.ects = course.ects;
        courseRow.dataset.name = course.name.toLowerCase();
        courseRow.dataset.schedule = getCourseSortTimestamp(course);
        courseRow.innerHTML = `
            <td><input type="checkbox" id="checkbox${index}" onchange="updateTT()"
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
    let darkModeEnabled = false;

    toggleBtn.addEventListener("click", () => {
        darkModeEnabled = !darkModeEnabled;
        darkStylesheet.disabled = !darkModeEnabled;
        lightStylesheet.disabled = darkModeEnabled;
        toggleBtn.textContent = darkModeEnabled ? "Light Mode" : "Dark Mode";
    });
}

function loadPage() {
    addDarkModeListener();
    createTable();
    updateTT();
}
