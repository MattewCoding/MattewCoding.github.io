let currentSortColumn = -1;
let currentSortDirection = "asc";

const SORT_FIELD_BY_COLUMN = { 2: "ects", 3: "name", 4: "schedule" };

function sortTable(columnIndex) {
    const sortField = SORT_FIELD_BY_COLUMN[columnIndex];
    if (!sortField) return;

    const direction = currentSortColumn === columnIndex && currentSortDirection === "asc" ? "desc" : "asc";
    const body = document.getElementById("scheduleBody");
    const rows = [...body.querySelectorAll("tr.course-row")];

    rows.sort((rowA, rowB) => {
        const valueA = sortField === "ects" ? Number(rowA.dataset[sortField]) : rowA.dataset[sortField];
        const valueB = sortField === "ects" ? Number(rowB.dataset[sortField]) : rowB.dataset[sortField];
        const comparison = typeof valueA === "number" ? valueA - valueB : valueA.localeCompare(valueB);
        return direction === "asc" ? comparison : -comparison;
    });

    rows.forEach(row => {
        const detailsRow = document.querySelector(`[data-details-for="${row.dataset.courseIndex}"]`);
        body.append(row, detailsRow);
    });

    currentSortColumn = columnIndex;
    currentSortDirection = direction;
    removeArrows();
    addArrow(columnIndex, direction);
}

function resetTableSort() {
    const body = document.getElementById("scheduleBody");
    const rows = [...body.querySelectorAll("tr.course-row")];

    rows.sort((rowA, rowB) => Number(rowA.dataset.courseIndex) - Number(rowB.dataset.courseIndex));
    rows.forEach(row => {
        const detailsRow = document.querySelector(`[data-details-for="${row.dataset.courseIndex}"]`);
        body.append(row, detailsRow);
    });

    currentSortColumn = -1;
    currentSortDirection = "asc";
    removeArrows();
}

function removeArrows() {
    document.querySelectorAll(".sort-arrow").forEach(arrow => arrow.remove());
}

function addArrow(columnIndex, direction) {
    const header = document.querySelectorAll("th")[columnIndex];
    const arrow = document.createElement("span");
    arrow.className = "sort-arrow";
    arrow.textContent = direction === "asc" ? "▲" : "▼";
    header.appendChild(arrow);
}
