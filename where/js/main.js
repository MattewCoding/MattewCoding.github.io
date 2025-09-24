
const courses = [
    ["CSC_4IG02_TP", "Interactive Application Development: Desktop, Mobile, and Web", "", ""],
    ["CSC_4IG05_TP", "Human-Computer Interaction", "", ""],
    ["CSC_4IG07_TP", "Visualization", "", ""],
    ["TSP-CSC5061", "Multiplayer Online Games Development", "", ""],
    ["CSC_52085_EP", "Real-time AI in video games: decisive & collaborative actions", "", ""],
    ["HCI-922", "Gestural and Mobile Interaction", "", ""],
    ["CSC_5ID08_TP", "Advanced Programming of Interactive Systems", "", ""],
    ["CSC_5ID02_PS", "Fundamentals of HCI", "", ""],
    ["CSC_5ID07_PS", "Evaluation of Interactive Systems", "", ""],
    ["CSC_5ID13_PS", "Groupware and Collaborative Interaction", "", ""],
    ["CSC_4IG01_TP", "Interactive 3D Application Development", "", ""],
    ["CSC_4IG03_TP", "Fundamentals of Computer Graphics", "", ""],
    ["CSC_5IM23_SU", "Advanced Computer Graphics", "", ""],
    ["CSC_51085_EP", "Computer Animation", "", ""],
    ["CSC_51073_EP", "Image Analysis & Computer Vision", "", ""],
    ["CSC_51074_EP", "Digital representation and analysis of shapes", "", ""],
    ["CSC_52084_EP", "Image Synthesis", "", ""],
    ["CSC_52062_EP", "Computational Geometry", "", ""],
    ["CSC_53433_EP", "Smart models for 3D creation and animation", "", ""],
    ["HSS_0EL41_TP", "Making Physical Representation of Data", "", ""],
    ["HSS_0EL42_TP", "Quantitative analysis of User Experience Data", "", ""],
    ["IME_6IE02_TP", "UX Design Sprint", "", ""],
    ["HSS_5DE13_TP", "Workshop Research Design + Cognition", "", ""],
    ["HSS_???_TP", "Workshop Visualization of the futures", "", ""],
    ["HSS_5DE15_TP", "Research Seminar", "", ""],
    ["TP-MIN301", "Critical UX", "", ""],
    ["TP-MIN302", "Data Storytelling for non coders", "", ""],
    ["CSC_4IG02_TP", "Human-Computer Interaction for Mixed Reality", "", ""],
    ["CSC_5ID06_PS", "Advanced Immersive Interactions", "", ""],
    ["CSC_4ID14_PS", "Mixed Reality and Tangible Interaction", "", ""],
    ["CSC_5ID12_PS", "Virtual Humans and Social Interactions", "", ""],
    ["CSC_5IA05_TA", "Learning for Robotics", "", ""],
    ["CSC_51054_EP", "Machine and Deep Learning", "", ""],
    ["X-INF581A", "Advanced Deep Learning", "", ""],
    ["CSC_52081_EP", "Reinforcement Learning and Autonomous Agents", "", ""],
    ["CSC_0EL11_TP-P1", "Programming paradigms: theory and practice)", "", ""],
    ["CSC_0EL11_TP-P2", "Programming paradigms: theory and practice", "", ""],
    ["CSC_0EL11_TP-EN", "Programming paradigms: theory and practice", "", ""],
    ["CSC_0EL10_TP-VF", "Développement Web", "", ""],
    ["CSC_0EL10_TP-EN", "Web Development", "", ""],
    ["TP-MN912", "Audio-Visual Transport", "", ""],
    ["CSC_4IG08_TP", "HCI/Graphics Project Seminar-M1", "", ""],
    ["PRJ_4ID22_TP", "Guided/Research Project-M1/M2", "", ""],
    ["PRJ_4ID23_TP", "Guided/Research Project-M1", "", ""],
    ["PRJ_4ID24_TP", "Guided/Research Project-M1", "", ""],
]

const urls = [
    "https://perso.telecom-paristech.fr/elc/igr201/",
    "https://perso.telecom-paristech.fr/elc/igr203/index.html",
];

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

        course.forEach(info => {
            courseLine.append("td").text(info);
        });

        courseLine.append("td").append("a")
            .attr("href", urls[i])
            .text("Official time table")
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