
let currentSortColumn = -1;
let currentSortDirection = 'asc';

// Yeah there are smarter ways to do this
// But this is easier
const sortByDay = {
    "monday": 0,
    "tuesday": 1,
    "wednesday": 2,
    "thursday": 3,
    "friday": 4,
    "saturday": 5,
    "sunday": 6,
    "every day": 7,
}

// Function to sort the table by the column index
function sortTable(n) {
    var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
    table = document.querySelector("table");
    switching = true;

    dir = currentSortDirection; // Use the current sorting direction
    // Toggle sorting direction
    if (currentSortColumn === n) {
        dir = (currentSortDirection === 'asc') ? 'desc' : 'asc';
    } else {
        dir = 'asc';
    }
    currentSortDirection = dir;
    currentSortColumn = n;
    removeArrows(); // Remove existing arrows before adding new ones
    addArrow(n, dir); // Add new arrow for the sorted column

    while (switching) {
        switching = false;
        rows = table.rows;
        for (i = 1; i < (rows.length - 1); i++) {
            shouldSwitch = false;
            x = rows[i].cells[n];
            y = rows[i + 1].cells[n];

            let xContent = x.innerHTML.toLowerCase();
            let yContent = y.innerHTML.toLowerCase();

            let sameWeek = false;
            if (n == (colNameToIndex["weeks"] + 2)) {
                const xWeeks = xContent.split(" - ");
                const yWeeks = yContent.split(" - ");
                let xStart = xWeeks[0].split("/").map(Number);
                let yStart = yWeeks[0].split("/").map(Number);

                xContent = xStart[1]; // format is dd/mm
                yContent = yStart[1];
                if (xContent == yContent) {
                    xContent = xStart[0];
                    yContent = yStart[0];

                    if (xContent == yContent) {
                        let xEnd = xWeeks[1].split("/").map(Number);
                        let yEnd = yWeeks[1].split("/").map(Number);
                        xContent = xEnd[1];
                        yContent = yEnd[1];

                        if (xContent == yContent) {
                            xContent = xEnd[0];
                            yContent = yEnd[0];
                        }
                    }
                }
                sameWeek = xContent == yContent;
            }

            // Comparing days not alphabetically but choronologically
            let sameDay = false;
            if (sameWeek || n == (colNameToIndex["day"] + 2)) {
                if (sameWeek) {
                    xContent = rows[i].cells[n + 1].innerHTML.toLowerCase();
                    yContent = rows[i + 1].cells[n + 1].innerHTML.toLowerCase();
                }
                xContent = sortByDay[xContent];
                yContent = sortByDay[yContent];

                sameDay = xContent == yContent;
            }

            // Compare if same hour
            if (sameDay || n == (colNameToIndex["hours"] + 2)) {
                if (sameWeek) {
                    xContent = rows[i].cells[n + 2].innerHTML;
                    yContent = rows[i + 1].cells[n + 2].innerHTML;
                } else {
                    if (sameDay) {
                        xContent = rows[i].cells[n + 1].innerHTML;
                        yContent = rows[i + 1].cells[n + 1].innerHTML;
                    }
                }
                const xHours = xContent.split(" - ");
                const yHours = yContent.split(" - ");
                let xStart = xHours[0].split(":");
                let yStart = yHours[0].split(":");

                // Comparing hours and minutes together
                xContent = 60 * Number(xStart[0]) + Number(xStart[1]);
                yContent = 60 * Number(yStart[0]) + Number(yStart[1]);

                // Same start, check end
                if (xContent == yContent) {
                    // Variables are named wrong they should be xEnd and yEnd
                    xStart = xHours[1].split(":");
                    yStart = yHours[1].split(":");
                    xContent = 60 * Number(xStart[0]) + Number(xStart[1]);
                    yContent = 60 * Number(yStart[0]) + Number(yStart[1]);
                }
            }

            //console.log(xContent, " ", yContent);

            if (dir === "asc") {
                if (xContent > yContent) {
                    shouldSwitch = true;
                    break;
                }
            } else if (dir === "desc") {
                if (xContent < yContent) {
                    shouldSwitch = true;
                    break;
                }
            }
        }
        if (shouldSwitch) {
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;
            switchcount++;
        } else {
            if (switchcount === 0 && dir === "asc") {
                dir = "desc";
                switching = true;
            }
        }
    }
}

function removeArrows() {
    const arrows = document.querySelectorAll('.sort-arrow');
    arrows.forEach(arrow => arrow.remove());
}

function addArrow(columnIndex, direction) {
    const th = document.querySelectorAll('th')[columnIndex];
    const arrow = document.createElement('span');
    arrow.classList.add('sort-arrow');
    arrow.innerHTML = direction === 'asc' ? '▲' : '▼';
    th.appendChild(arrow);
}