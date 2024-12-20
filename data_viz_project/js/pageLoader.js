/**
 * Populates a dropdown with options
 * @param {string} dropdownId The id name of the dropdown element
 * @param {string[]} list The list of things to add to the dropdown
 */
function fillDropdown(dropdownId, list) {
    const dropdown = d3.select("#" + dropdownId);
    for (const item of list) {
        dropdown.append("option")
            .text(item)
            .attr("value", item);
    }
}

/**
 * Simulates "typing" a string of text from left to right
 * @param {object} container The html element containing the text
 * @param {string} text The string of letters to type
 * @param {number} index The amount of letters to display
 */
function typeWriter(container, text, index) {
    //console.log(`${index} <? ${text.length}`)
    if (index < text.length) {
        container.text(text.slice(0, index + 1));
        setTimeout(() => typeWriter(container, text, index + 1), dura.typewriter_delay); // Adjust delay for speed
    }
}

/**
 * Fades in an information box
 * @param {String} boxId The box we want to add the text to
 * @param {String} textId The <div> for the text
 * @param {Boolean} selectedCountry Whether or not we're creating the country infobox.
 * @param {Boolean} updateCountryTitle Whether or not we're updating the title of the info box. True by default.
 */
function showBox(boxId, textId, selectedCountry, updateCountryTitle=true) {
    const box = d3.select(boxId);
    const boxContent = d3.select(textId);

    var countryChosen = "";
    if (selectedCountry) {
        countryChosen = d3.select("#dropdownCountry").select("option:checked").text();
        loadLgbtData();
    } else {
        countryChosen = boxContent.text();
    }

    // Update box content based on selection
    if (updateCountryTitle) {
        typeWriter(boxContent, countryChosen, 0);
        box.style('display', '');
        box.transition()
            .duration(dura.country_info_fade_in_duration)
            .ease(d3.easePolyOut)
            .style("width", "100%");
    }
}

function switchSelectorEmpty() {
    switchSelector(d3.select("#dropdownCountry").select("option:checked").text());
}

/**
 * Switches the currently selected country to the newly selected country.
 * Also updates the info box its right.
 * @param {String} ctName The name of the country selected
 */
function switchSelector(ctName) {
    if (ctx.OLD_SEL == ctName) return;

    document.getElementById("dropdownCountry").value = ctName;
    
    //console.log(ctx.OLD_SEL, ctName.replace(" ", ""));
    d3.select("#" + ctx.OLD_SEL.replace(" ", "")).attr("class", "");
    d3.select("#" + ctName.replace(" ", "")).attr("class", "countryAreaSel");

    ctx.OLD_SEL = ctName;

    showBox("#countrySpecificInformation", "#infoBoxTitle", true);
}

/**
 * The dropdown-specific way to update the infobox.
 */
function updateWhoBelongs() {
    ctx.SUBSET_SELECTED = d3.select("#dropdownLGBT").select("option:checked").text();
    showBox("#countrySpecificInformation", "#infoBoxTitle", true, false);
}

function toggleCSIHeight() {
}

/**
 * Main page loader that loads the main elements of the page
 */
function load_page_info() {
    console.log("Using D3 v" + d3.version);

    // Populate dropdowns
    fillDropdown("dropdownCountry", countries);
    fillDropdown("dropdownLGBT", subset);

    // Extend lgbt selector to avoid scroll bar
    const dropdown = d3.select("#dropdownLGBT");
    dropdown.attr("size", subset.length);

    // Hide box to allow fade in
    d3.select("#countrySpecificInformation").style('display', 'none');
    d3.select("#countrySpecificInformation").style('width', '0em');
    showBox("#countrySpecificInformation", "#infoBoxTitle", true);

    /*d3.select("#showMore").style('display', 'none');
    d3.select("#showMore").style('width', '0em');
    showBox("#showMore", "#showMoreText", false);*/
    loadMap();
    createVizElems();
}