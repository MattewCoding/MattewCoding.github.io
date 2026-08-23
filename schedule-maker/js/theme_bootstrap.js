(() => {
    let darkModeEnabled = true;
    try {
        darkModeEnabled = localStorage.getItem("scheduleMaker.theme") !== "light";
    } catch (error) {
        console.warn("Local storage is unavailable.", error);
    }

    document.getElementById("lightStylesheet").disabled = darkModeEnabled;
    document.getElementById("darkStylesheet").disabled = !darkModeEnabled;
})();
