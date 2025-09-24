
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

            let xContent = x.textContent.trim().toLowerCase();
            let yContent = y.textContent.trim().toLowerCase();

            // Attempt to parse as number
            let xNum = parseFloat(xContent);
            let yNum = parseFloat(yContent);
            let isNumeric = !isNaN(xNum) && !isNaN(yNum);

            if (dir === "asc") {
                if (isNumeric ? xNum > yNum : xContent > yContent) {
                    shouldSwitch = true;
                    break;
                }
            } else if (dir === "desc") {
                if (isNumeric ? xNum < yNum : xContent < yContent) {
                    shouldSwitch = true;
                    break;
                }
            }
        }

        if (shouldSwitch) {
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;
            switchcount++;
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