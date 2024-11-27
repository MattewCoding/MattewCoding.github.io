function loadHeader(selected) {
    const headerContent = `
            <a href='./index.html'>
                <img id='nav-image' src='./media/logo.png' alt='Site logo' title='Reload page' />
            </a>
            <nav id='header-nav'>
                <ul class='header-nav-ul'>
                    <li class='header-nav-li'${selected === 1 ? " id='current-page'" : ""}> <a href='./week-one-labs.html'>Week 1 Labs</a></li>
                    <li class='header-nav-li'${selected === 2 ? " id='current-page'" : ""}> <a href='./week-one-report.html'>Week 1 Lecture</a></li>
                    <li class='header-nav-li'${selected === 3 ? " id='current-page'" : ""}> <a href='./week-two-labs.html'>Week 2 Labs</a></li>
                    <li class='header-nav-li'${selected === 4 ? " id='current-page'" : ""}> <a href='./week-two-report.html'>Week 2 Lecture</a></li>
                </ul>
            </nav>
            <nav id='header-options'>
                <ul class='header-nav-ul'>
                    <li class='header-nav-li' id='darkModeButton'>Dark Mode</li>
                </ul>
            </nav>
    `;
    document.getElementsByTagName('header')[0].innerHTML = headerContent;
}


function addDarkModeListener() {
    // Get references to the button, light, and dark stylesheets
    const toggleBtn = document.getElementById('darkModeButton');
    const lightStylesheet = document.getElementById('lightStylesheet');
    const darkStylesheet = document.getElementById('darkStylesheet');

    // Check if dark mode is saved in localStorage (for persistence across page reloads)
    if (localStorage.getItem('darkMode') === 'enabled') {
        darkStylesheet.removeAttribute('disabled');
        lightStylesheet.setAttribute('disabled', 'true');
        toggleBtn.textContent = 'Light Mode';
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

function loadPage(selected)
{
    loadHeader(selected);
    addDarkModeListener();
}