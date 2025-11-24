const player = document.getElementById("player");
const world = document.getElementById("world")

let style = window.getComputedStyle(player)
let topPos = parseInt(style.top)
let leftPos = parseInt(style.left)

const speed = 3;
let canMove = true;

const keys = {};
document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
});
document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

function movePlayer() {
    if (keys["w"]) topPos = Math.max(0, topPos - speed);
    if (keys["s"]) topPos = Math.min(world.clientHeight - player.offsetHeight, topPos + speed);
    if (keys["a"]) leftPos = Math.max(0, leftPos - speed);
    if (keys["d"]) leftPos = Math.min(world.clientWidth - player.offsetWidth, leftPos + speed);

    player.style.top = topPos + "px";
    player.style.left = leftPos + "px";

    requestAnimationFrame(movePlayer); // repete a cada frame
}

movePlayer(); // start loop
