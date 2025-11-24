const player = document.getElementById("player");
const world = document.getElementById("world");

let style = window.getComputedStyle(player);
let topPos = parseInt(style.top);
let leftPos = parseInt(style.left);

const speed = 2;

// === Sprites ASCII por direção ===
const walkFrames = {
  up: [
`O
/|\\
/ \\`,
`O
/|\\
/ >`,
`O
/|\\
< \\`
  ],
  down: [
`O
/|\\
/ \\`,
`O
/|\\
/ >`,
`O
/|\\
< \\`
  ],
  left: [
`O
/|\\
/ \\`,
`O
/|\\
< \\`,
`O
/|\\
/ \\`,
`O
/|\\
/<`
  ],
  right: [
`O
/|\\
/ \\`,
`O
/|\\
/ >`,
`O
/|\\
/ \\`,
`O
/|\\
 >\\`
]};


let currentFrame = 0;
let currentDirection = "down"; // direção inicial

const keys = {};
document.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

// === Controle de tempo da animação ===
let lastStepTime = 0;
const stepInterval = 200; // tempo mínimo entre frames (ms)

function stepAnimation(direction, now) {
  const frames = walkFrames[direction];
  // só troca frame se passou stepInterval ms
  if (now - lastStepTime >= stepInterval) {
    currentFrame = (currentFrame + 1) % frames.length;
    player.innerText = frames[currentFrame];
    lastStepTime = now;
  }
  currentDirection = direction;
}

// Loop de movimento
function movePlayer(timestamp) {
  let moved = false;

  if (keys["w"]) { 
    topPos = Math.max(0, topPos - speed);
    stepAnimation("up", timestamp);
    moved = true;
  } 
  else if (keys["s"]) {
    topPos = Math.min(world.clientHeight - player.offsetHeight, topPos + speed);
    stepAnimation("down", timestamp);
    moved = true;
  } 
  else if (keys["a"]) {
    leftPos = Math.max(0, leftPos - speed);
    stepAnimation("left", timestamp);
    moved = true;
  } 
  else if (keys["d"]) {
    leftPos = Math.min(world.clientWidth - player.offsetWidth, leftPos + speed);
    stepAnimation("right", timestamp);
    moved = true;
  }

  // atualiza posição
  player.style.top = topPos + "px";
  player.style.left = leftPos + "px";

  // se não está se movendo, mantém frame inicial da direção
  if (!moved) {
    player.innerText = walkFrames[currentDirection][0];
    currentFrame = 0;
  }

  requestAnimationFrame(movePlayer);
}

requestAnimationFrame(movePlayer); // start loop