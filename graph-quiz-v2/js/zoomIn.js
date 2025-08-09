const gameContainer = document.getElementById('game');
const svgElement = document.getElementById('graphMap');
const zoomInButton = document.getElementById('zoom-in');
const zoomOutButton = document.getElementById('zoom-out');
const centerButton = document.getElementById('center');
const optionButton = document.getElementById('option-button');

let scale = 1;
let isDragging = false;
let startX, startY;
let translateX = 0, translateY = 0;

function updateTransform() {
    svgElement.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
}

// Prevent default image drag
const image = svgElement;
image.addEventListener('dragstart', (e) => e.preventDefault());

function zoom(factor, centerX, centerY) {
    const prevScale = scale;
    scale *= factor;
    if (scale <= 1) scale = 1;

    const scaleChange = scale / prevScale;

    // Adjust translation so that zoom centers on cursor
    translateX = centerX - (centerX - translateX) * scaleChange;
    translateY = centerY - (centerY - translateY) * scaleChange;

    updateTransform();
}

// Get cursor position relative to SVG
function getCursorPosition(event, svgElement) {
    // Get the SVG's bounding rectangle
    const bbox = svgElement.getBoundingClientRect();

    // Calculate the cursor position relative to the SVG
    const x = event.clientX;
    const y = event.clientY;

    return { x, y };
}

function getCenter() {
    return { x: 0, y: 0 };
}

// Zoom buttons with cursor-centered zoom
zoomInButton.addEventListener('click', (e) => {
    const { x, y } = getCenter();
    zoom(2, x, y);
});

zoomOutButton.addEventListener('click', (e) => {
    const { x, y } = getCenter();
    zoom(0.5, x, y);
});

centerButton.addEventListener('click', (e) => {
    translateX = 0;
    translateY = 0;
    updateTransform();
});

optionButton.addEventListener('click', (e) => {
    d3.select("#backgroundOptions").style("display", "");
    d3.select("#bodyOptions").style("display", "");
    d3.select("#backgroundOptions")
        .transition()
        .duration(750)
        .ease(d3.easeCubicOut)
        .style("opacity", 1);
    d3.select("#bodyOptions")
        .style("margin-top", "-4%")
        .transition()
        .duration(750)
        .ease(d3.easeCubicOut)
        .style("margin-top", "3%");
});

// Scroll wheel
gameContainer.addEventListener('wheel', (event) => {
    const { x, y } = getCenter();

    if (event.deltaY < 0) {
        zoom(1.25, x, y);
    } else {
        zoom(0.8, x, y);
    }
})

// Pan handlers
gameContainer.addEventListener('mousedown', (e) => {
    // Don't allow dragging if clicking inside the input
    if (e.target.closest('#svg-textbox')) return;

    isDragging = true;
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;
    gameContainer.style.cursor = 'grabbing';
});

gameContainer.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    translateX = e.clientX - startX;
    translateY = e.clientY - startY;
    updateTransform();
});

gameContainer.addEventListener('mouseup', () => {
    isDragging = false;
    gameContainer.style.cursor = 'grab';
});

gameContainer.addEventListener('mouseleave', () => {
    isDragging = false;
    gameContainer.style.cursor = 'grab';
});