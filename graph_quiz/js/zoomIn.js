const container = document.getElementById('container');
const svgElement = document.getElementById('graphMap');
const zoomInButton = document.getElementById('zoom-in');
const zoomOutButton = document.getElementById('zoom-out');
const centerButton = document.getElementById('center');

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
    if(scale <= 1) scale = 1;

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

// Scroll wheel
container.addEventListener('wheel', (event) => {
    const { x, y } = getCenter();
    
    if (event.deltaY < 0) {
        zoom(1.25, x, y);
    } else {
        zoom(0.8, x, y);
    }
})

// Pan handlers
container.addEventListener('mousedown', (e) => {
    // Don't allow dragging if clicking inside the input
    if (e.target.closest('#svg-textbox')) return;

    isDragging = true;
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;
    container.style.cursor = 'grabbing';
});

container.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    translateX = e.clientX - startX;
    translateY = e.clientY - startY;
    updateTransform();
});

container.addEventListener('mouseup', () => {
    isDragging = false;
    container.style.cursor = 'grab';
});

container.addEventListener('mouseleave', () => {
    isDragging = false;
    container.style.cursor = 'grab';
});