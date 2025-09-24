let frenchVersion = false;

const colNameToIndex = {
    "ect": 0,
    "oldCourse": 1,
    "newCourse": 2,
    "courseName": 3,
    "weeks": 4,
    "day": 5,
    "hours": 6,
    "moreinfo": 7,
}
const courses = [
    ["2.5", "TP-IGR201", "placeholder", "Interactive 2D/Mobile/Web Application Development", "16/09 - 14/11", "Monday", "8:30 - 11:45"],
    ["5", "TP-IGR203", "placeholder", "Human-Computer Interaction", "17/02 - 14/04", "Monday", "13:30 - 16:45"],
];

const urls = [
    "https://perso.telecom-paristech.fr/elc/igr201/",
    "https://perso.telecom-paristech.fr/elc/igr203/index.html",
];

const dayToId = {
    "monday": [],
    "tuesday": [],
    "wednesday": [],
    "thursday": [],
    "friday": [],
    "saturday": [],
    "sunday": [],
};

function addDarkModeListener() {
    // Get references to the button, light, and dark stylesheets
    const toggleBtn = document.getElementById('darkModeButton');
    const lightStylesheet = document.getElementById('lightStylesheet');
    const darkStylesheet = document.getElementById('darkStylesheet');

    // A variable to track dark mode state
    let darkModeEnabled = false;

    // Initially check if dark mode should be enabled (this could be based on other factors, such as user settings or time of day)
    if (darkModeEnabled) {
        darkStylesheet.removeAttribute('disabled');
        lightStylesheet.setAttribute('disabled', 'true');
        toggleBtn.textContent = 'Light Mode';
    } else {
        darkStylesheet.setAttribute('disabled', 'true');
        lightStylesheet.removeAttribute('disabled');
        toggleBtn.textContent = 'Dark Mode';
    }

    // Toggle dark mode when button is clicked
    toggleBtn.addEventListener('click', () => {
        darkModeEnabled = !darkModeEnabled;

        if (darkModeEnabled) {
            // Enable dark mode
            darkStylesheet.removeAttribute('disabled');
            lightStylesheet.setAttribute('disabled', 'true');
            toggleBtn.textContent = 'Light Mode';
        } else {
            // Enable light mode
            darkStylesheet.setAttribute('disabled', 'true');
            lightStylesheet.removeAttribute('disabled');
            toggleBtn.textContent = 'Dark Mode';
        }
    });
}

function createTable() {
    const emptyTable = d3.select("#scheduleBody");

    courses.forEach((course, i) => {
        const courseLine = emptyTable.append("tr").attr("id", "course" + i);
        dayToId[course[colNameToIndex["day"]].toLowerCase()].push(i);

        // Checkbox
        courseLine.append("td").append("input")
            .attr("type", "checkbox")
            .attr("id", "checkbox" + i)
            .attr("onclick", `updateTT(${i})`);

        // Overlap
        courseLine.append("td")
            .attr("id", "overlap" + i)
            .text("");

        course.forEach(info => {
            courseLine.append("td").text(info);
        });

        courseLine.append("td").append("a")
            .attr("href", urls[i])
            .text("Website")
    });

    //console.log(dayToId);
}

function translateToFrench() {
    if (frenchVersion) {
        document.getElementById("translator").innerHTML = "Voir la version française";
    } else {
        document.getElementById("translator").innerHTML = "See the English version";
    }
    frenchVersion = !frenchVersion;
}

function loadPage() {
    addDarkModeListener();
    createTable();
}