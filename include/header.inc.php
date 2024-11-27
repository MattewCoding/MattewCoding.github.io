<?php
function loadHeader($title, $selected){
    return "
<!DOCTYPE html>
<html lang='en'>

<head>
    <meta charset='utf-8'>
    <link rel='icon' type='image/x-icon' href='./media/favicon.png' />
    <title>$title</title>
    <script type='text/javascript' src='js/main.js'></script>
    
    <link id='lightStylesheet' rel='stylesheet' href='css/style.css' />
    <link id='darkStylesheet' rel='stylesheet' href='css/styleNight.css' disabled/>
</head>

<body onload='addDarkModeListener()'>
    <header>
        <a href='./index.html'>
            <img id='nav-image' src='./media/logo.png' alt='Site logo' title='Reload page' />
        </a>
        <nav id='header-nav'>
            <ul class='header-nav-ul'>
                <!--<li class='header-nav-li'". ($selected == 0? "id='current-page'" : "") . "> <a href='./index.html'>Home`</a></li>-->
                <li class='header-nav-li'". ($selected == 1? "id='current-page'" : "") . "> <a href='./week-one-labs.html'>Week 1 Labs</a></li>
                <li class='header-nav-li'". ($selected == 2? "id='current-page'" : "") . "> <a href='./week-one-report.html'>Week 1 Lecture</a></li>
                <li class='header-nav-li'". ($selected == 3? "id='current-page'" : "") . "> <a href='./week-two-labs.html'>Week 2 Labs</a></li>
                <li class='header-nav-li'". ($selected == 4? "id='current-page'" : "") . "> <a href='./week-two-report.html'>Week 2 Lecture</a></li>
            </ul>
        </nav>
        <nav id='header-options'>
            <ul class='header-nav-ul'>
                <li class='header-nav-li' id='darkModeButton'>Dark Mode</li>
            </ul>
        </nav>
    </header>
    ";
}
?>