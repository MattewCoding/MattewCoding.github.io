isFlying = false;
flyingLeft = true;
speed = 10;

/**
 * Convert em to pixels
 * 
 * @param {int} emValue The em amount 
 * @param {*} element The element from whom we take its em value from (font size).
 * @returns The converted amount of em to pixels.
 */
function emToPx(emValue, element) {
    const fontSize = parseFloat(getComputedStyle(element).fontSize);
    return emValue * fontSize;
}

/**
 * Set up the animation by calculating its bounds, setting up its speed, and defining its vertical movement.
 */
function setupAnim()
{
    setTimeout(fly, 50);
    setInterval(vertMovement, 1000);
    setInterval(addAsteroid, 1000);

    const spaceship = document.getElementById("spaceship");

    function fly() {
        const windowWidth = window.innerWidth - emToPx(20, document.querySelector(".main-part"));

        //console.log(spaceship.style.marginLeft);
        let x = parseFloat(spaceship.style.marginLeft);
        if(x >= windowWidth)
        {
            flipSpaceship(true);
        }
        if(x <= 0)
        {
            flipSpaceship();
        }
        x += (speed != 0 && isFlying)? (flyingLeft? 5 : -5) : 0;
        spaceship.style.marginLeft = `${x}px`;

        setTimeout(fly, 250/speed); // in ms
    }

    function vertMovement() {
        if(speed != 0 && isFlying){
            let newPxValue = parseFloat(spaceship.style.marginTop) + Math.random()*10 - 5;
            newPxValue = Math.max(Math.min(newPxValue, 50), 0);
            spaceship.style.marginTop = `${newPxValue}px`;
        }
    }

    function addAsteroid()
    {
        const windowWidth = window.innerWidth - emToPx(20, document.querySelector(".main-part"));

        const spaceshipBlock = document.querySelector('#spaceshipBlock');
        const asteroid = document.createElement("img");
        asteroid.src = './media/asteroid.png';
        asteroid.alt = 'an asteroid';
        asteroid.title = 'ahh an asteroid!!!';

        asteroid.style.top = '-40px';
        asteroid.style.left = `${Math.random()*windowWidth}px`;
        asteroid.className = 'asteroid';
        asteroid.style.position = 'absolute';

        spaceshipBlock.appendChild(asteroid);

        setInterval(moveAsteroid, 10);

        function moveAsteroid()
        {
            let x = parseFloat(asteroid.style.left);
            x -= 0.5;
            asteroid.style.left = `${x}px`;

            let y = parseFloat(asteroid.style.top);
            y += 0.5;
            asteroid.style.top = `${y}px`;

            if(y >= 90)
            {
                asteroid.remove();
            }
        }
    }
}

/**
 * Hide the 'start' button and start the spaceship.
 */
function startAnim()
{
    document.getElementById('startButton').style.display = 'none';
    document.getElementById('stopButton').style.display = '';
    isFlying = true;
}

/**
 * Hide the 'stop' button and stop the spaceship.
 */
function stopAnim()
{
    document.getElementById('startButton').style.display = '';
    document.getElementById('stopButton').style.display = 'none';
    isFlying = false;
}

/**
 * Logic that hides or shows the 'fast' button depending on current speed, and also controls the speed variable.
 */
function faster()
{
    if(speed <= 0)
    {
        document.getElementById('slowButton').style.display = '';
    }
    if(speed < 100)
    {
        speed+=10;
        document.getElementById('currSpeed').innerHTML = `Current speed: ${speed} parsecs/second`;
    }
    if(speed >= 100)
    {
        document.getElementById('fastButton').style.display = 'none';
    }
}

/**
 * Logic that hides or shows the 'slow' button depending on current speed, and also controls the speed variable.
 */
function slower()
{
    if(speed >= 100)
    {
        document.getElementById('fastButton').style.display = '';
    }
    if(speed > 0)
    {
        speed-=10;
        document.getElementById('currSpeed').innerHTML = `Current speed: ${speed} parsecs/second`;
    }
    if(speed <= 0)
    {
        document.getElementById('slowButton').style.display = 'none';
    }
}

/**
 * Flip the spaceship image, and also indicate to start moving the spaceship to the left
 * 
 * @param {boolean} keepRight Used to force the spaceship to keep going to the left 
 */
function flipSpaceship(keepRight = false)
{
    const spaceship = document.getElementById("spaceship");

    if(!keepRight && spaceship.style.transform == "scaleX(-1)")
    {
        flyingLeft = true;
        spaceship.style.transform = "scaleX(1)";
    }
    else
    {
        flyingLeft = false;
        spaceship.style.transform = "scaleX(-1)";
    }
}