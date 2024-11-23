function addDarkModeListener() {
    // Get references to the button, light, and dark stylesheets
    const toggleBtn = document.getElementById('darkModeButton');
    const lightStylesheet = document.getElementById('lightStylesheet');
    const darkStylesheet = document.getElementById('darkStylesheet');

    // Check if dark mode is saved in localStorage (for persistence across page reloads)
    if (localStorage.getItem('darkMode') === 'enabled') {
        darkStylesheet.removeAttribute('disabled');
        lightStylesheet.setAttribute('disabled', 'true');
        toggleBtn.textContent = 'Switch to Light Mode';
    }

    // Toggle dark mode when button is clicked
    toggleBtn.addEventListener('click', () => {
        if (darkStylesheet.disabled) {
            // Enable dark mode
            darkStylesheet.removeAttribute('disabled');
            lightStylesheet.setAttribute('disabled', 'true');
            toggleBtn.textContent = 'Light Mode';
            localStorage.setItem('darkMode', 'enabled');
        } else {
            // Enable light mode
            darkStylesheet.setAttribute('disabled', 'true');
            lightStylesheet.removeAttribute('disabled');
            toggleBtn.textContent = 'Dark Mode';
            localStorage.setItem('darkMode', 'disabled');
        }
    });

}
