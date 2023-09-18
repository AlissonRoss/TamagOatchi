alert("AnimateOatchi included");
const canvas = document.getElementById("scene");
const ctx = canvas.getContext("2d");
const imageOatchi = new Image();
imageOatchi.src = "./oatchi.png";

let x = 10;
let oatchiDirection = 1;

function draw() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.drawImage(imageOatchi, x, 200, 400, 400);
}

function walkAnimation() {
    console.log("x position in walking animation is: " + x);

    if (x >= window.innerWidth - 400) {
        oatchiDirection = -1;
    } else if (x <= 0) {
        oatchiDirection = 1;
    }

    x += 10 * oatchiDirection;
}

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const intervalId = setInterval(walkAnimation, 50);
console.log("setInterval was called");

function animate() {
    draw();
    requestAnimationFrame(animate);
}

animate();

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    draw();
});

window.addEventListener("load", () => {
    draw();
});

window.addEventListener("beforeunload", () => {
    clearInterval(intervalId);
});
