const scene = new Scene();
let timeDisplay = null;
let tickIntervalId = 0;

function sceneTick() {
    scene.updateScene();
    //displays time
    timeDisplay.textContent = `Time: ${(new Date()).toLocaleTimeString()}`;
}

window.addEventListener("load", () => {
    // Called once *all* resources are loaded including images and stylesheets.
    // This also begins its own internal timer event for updating the scene state.
    scene.onload();

    timeDisplay = document.getElementById("time");
    timeDisplay.textContent = `Time: ${(new Date()).toLocaleTimeString()}`;

    // Speed up for quicker stat decay
    setInterval(sceneTick, 1000);
});

window.addEventListener("beforeunload", () => {
    if (tickIntervalId != 0){
        clearInterval(tickIntervalId);
        tickIntervalId = 0;
    }
    scene.onunload();
});
