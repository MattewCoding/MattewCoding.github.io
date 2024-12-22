let frenchVersion = false;

const colNameToIndex = {
    "ect": 0,
    "oldCourse": 1,
    "newCourse": 2,
    "courseName": 3,
    "day": 4,
    "hours": 5,
}
const courses = [
    ["5", "Item 1", "Data 1", "Data 3", "Monday", "8:00 - 11:45"],
    ["5", "Item 2", "Data 2", "Data 6", "Monday", "10:30 - 12:45"],
    ["5", "Item 3", "Data 3", "Data 2", "Tuesday", "9:00 - 13:00"],
    ["5", "Item 4", "Data 4", "Data 20", "Thursday", "9:00 - 13:00"],
    ["50", "Item 5", "Data 5", "Data 1", "Thursday", "10:00 - 14:00"],
    ["5", "Item 7", "Data 7", "Data 42", "Thursday", "11:30 - 12:00"],
    ["5", "Item 6", "Data 6", "Data 23", "Thursday", "13:30 - 15:00"],
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