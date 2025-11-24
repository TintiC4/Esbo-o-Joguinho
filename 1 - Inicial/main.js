// main.js
// Passo-a-passo: grade, mapas, colisão, troca de quadro (fade)

const worldEl = document.getElementById('world');
const mapEl = document.getElementById('map');
const you = document.getElementById('you');

/* ---------- CONFIG ---------- */
const TILE_COLS = 10;   // tiles por coluna (largura do quadro)
const TILE_ROWS = 8;    // tiles por linha (altura do quadro)
const STEP = 1;         // passos em tiles por movimento
const MOVE_DELAY = 180; // ms entre movimentos (estilo antigo)
const TRANSITION_MS = 260; // combinação com CSS .fade-out

/* ---------- MAPAS (grid de quadros) ----------
Representação:
0 = andável
1 = bloqueio
*/
const maps = [
  /* mapRow 0 */
  [
    // mapCol 0
    [
      [0,0,0,0,0,0,0,0,0,0],
      [0,1,0,0,0,0,0,0,1,0],
      [0,0,0,0,1,0,0,0,0,0],
      [0,0,0,0,0,0,1,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,1,0,0,0,1,0,0,0,0],
      [0,0,0,0,0,0,0,1,0,0],
      [0,0,0,0,0,0,0,0,0,0],
    ],
    // mapCol 1
    [
      [0,0,0,0,0,0,1,0,0,0],
      [0,0,0,1,0,0,0,0,1,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,1,0,0,0,0,0,1,0,0],
      [0,0,0,0,1,0,0,0,0,0],
      [0,0,1,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,1,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
    ]
  ],
  /* mapRow 1 */
  [
    // mapCol 0
    [
      [0,0,0,0,0,0,0,1,0,0],
      [0,0,1,0,0,0,0,0,0,0],
      [0,0,0,0,1,0,0,0,1,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,1,0,0,0,0,0,0,0,0],
      [0,0,0,1,0,0,1,0,0,0],
      [0,0,0,0,0,0,0,0,1,0],
      [0,0,0,0,0,0,0,0,0,0],
    ],
    // mapCol 1
    [
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,1,0,0,1,0,0,0],
      [0,0,0,0,0,0,0,0,1,0],
      [0,1,0,0,0,0,0,0,0,0],
      [0,0,0,0,1,0,0,0,0,0],
      [0,0,0,1,0,0,0,0,0,0],
      [0,0,0,0,0,0,1,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
    ]
  ]
];

/* mapa atual (indices em maps) */
let mapColIndex = 0;
let mapRowIndex = 0;

/* personagem: posição em tiles dentro do quadro atual */
let tileX = Math.floor(TILE_COLS / 2);
let tileY = Math.floor(TILE_ROWS / 2);

/* flags */
let moving = false;       // impede novos passos durante MOVE_DELAY
let transitioning = false; // impede movimento enquanto troca de quadro

/* calculado dinamicamente */
let tileSizePx = 32; // atualizado em resize/render

/* ---------- inicialização ---------- */
function init() {
  renderMap();
  updateTileSize();
  placeYou();

  // listener teclado (aperta -> tenta mover)
  window.addEventListener('keydown', (e) => {
    if (transitioning) return;
    if (moving) return; // respeito o delay de passos
    handleMoveKey(e.key);
  });

  // recalcula tamanho se a janela mudar
  window.addEventListener('resize', () => {
    updateTileSize();
    placeYou();
  });
}

function currentMapArray() {
  return maps[mapRowIndex][mapColIndex];
}

/* ---------- render do mapa (grade de DIVs) ---------- */
function renderMap() {
  const grid = currentMapArray();
  // define grid-template com JS usando TILE_COLS/TILE_ROWS e tileSize
  mapEl.innerHTML = ''; // limpa
  // create tiles container style (we'll set tile size later)
  mapEl.style.gridTemplateColumns = `repeat(${TILE_COLS}, 1fr)`;
  mapEl.style.gridTemplateRows = `repeat(${TILE_ROWS}, 1fr)`;

  for (let r = 0; r < TILE_ROWS; r++) {
    for (let c = 0; c < TILE_COLS; c++) {
      const val = grid[r][c];
      const t = document.createElement('div');
      t.classList.add('tile');
      if (val === 0) t.classList.add('grass');
      if (val === 1) t.classList.add('tree');
      // colocar emoji para árvore
      if (val === 1) t.textContent = '🌳';
      mapEl.appendChild(t);
    }
  }
}

/* ---------- quanta largura cada tile ocupa em px ---------- */
function updateTileSize() {
  // tile size se ajusta ao menor lado possível para caber a grade
  const w = worldEl.clientWidth;
  const h = worldEl.clientHeight;
  tileSizePx = Math.floor(Math.min(w / TILE_COLS, h / TILE_ROWS));
  // set CSS custom property para #you e para cada tile via width/height
  you.style.width = `${tileSizePx}px`;
  you.style.height = `${tileSizePx}px`;
  // também definir o tamanho visual de cada tile pela grid: definimos
  // o tamanho do container de tiles para que cada tile seja tileSizePx
  mapEl.style.width = `${tileSizePx * TILE_COLS}px`;
  mapEl.style.height = `${tileSizePx * TILE_ROWS}px`;
  // Para centralizar o mapa dentro do world (quando map menor que viewport)
  mapEl.style.left = `${(worldEl.clientWidth - tileSizePx * TILE_COLS)/2}px`;
  mapEl.style.top  = `${(worldEl.clientHeight - tileSizePx * TILE_ROWS)/2}px`;
}

/* coloca o personagem na posição tileX/tileY em px */
function placeYou() {
  const leftPx = (mapEl.offsetLeft || 0) + tileX * tileSizePx;
  const topPx  = (mapEl.offsetTop  || 0) + tileY * tileSizePx;
  you.style.left = `${leftPx}px`;
  you.style.top  = `${topPx}px`;
}

/* ---------- movimento com delay (estilo retro) ---------- */
function handleMoveKey(key) {
  const dir = keyToDir(key);
  if (!dir) return;

  // calcula novo tile desejado
  let nx = tileX + dir.dx * STEP;
  let ny = tileY + dir.dy * STEP;

  // se dentro do quadro, checar colisão
  if (nx >= 0 && nx < TILE_COLS && ny >= 0 && ny < TILE_ROWS) {
    if (isWalkable(nx, ny)) {
      doStep(nx, ny);
    } else {
      // opcional: som de bump ou animação
      // ignore movement into obstacle
    }
    return;
  }

  // se chegou na borda: vamos trocar de quadro
  // calcula o quadro destino e a posição do personagem nele
  const {targetMapCol, targetMapRow, newTileX, newTileY} =
    mapAndPositionAfterLeaving(nx, ny);

  // se mapa destino existe (limites dos maps), então transitar
  if (maps[targetMapRow] && maps[targetMapRow][targetMapCol]) {
    // inicia transição
    startMapTransition(targetMapCol, targetMapRow, newTileX, newTileY);
  } else {
    // se não existe mapa, bloqueia (ou criar novo mapa conforme preferir)
    // por agora: só ignora movimento
  }
}

/* converte tecla para direção */
function keyToDir(key) {
  switch(key) {
    case 'w': return {dx:0, dy:-1, name:'up'};
    case 's': return {dx:0, dy:1, name:'down'};
    case 'a': return {dx:-1, dy:0, name:'left'};
    case 'd': return {dx:1, dy:0, name:'right'};
    default: return null;
  }
}

/* verifica colisão no quadro atual */
function isWalkable(x, y) {
  const val = currentMapArray()[y][x];
  return val === 0; // só 0 é andável
}

/* aplica o passo e respeita MOVE_DELAY */
function doStep(nx, ny) {
  moving = true;
  tileX = nx;
  tileY = ny;
  placeYou();

  setTimeout(() => {
    moving = false;
  }, MOVE_DELAY);
}

/* calcula qual mapa/quadro e a nova posição tile quando sair das bordas */
function mapAndPositionAfterLeaving(nx, ny) {
  let targetMapCol = mapColIndex;
  let targetMapRow = mapRowIndex;
  let newTileX = nx;
  let newTileY = ny;

  if (nx < 0) {
    targetMapCol = mapColIndex - 1;
    newTileX = TILE_COLS - 1; // aparece na borda oposta
  } else if (nx >= TILE_COLS) {
    targetMapCol = mapColIndex + 1;
    newTileX = 0;
  }

  if (ny < 0) {
    targetMapRow = mapRowIndex - 1;
    newTileY = TILE_ROWS - 1;
  } else if (ny >= TILE_ROWS) {
    targetMapRow = mapRowIndex + 1;
    newTileY = 0;
  }

  return { targetMapCol, targetMapRow, newTileX, newTileY };
}

/* animação de transição (fade out -> trocar mapa -> fade in) */
function startMapTransition(targetCol, targetRow, newTileX, newTileY) {
  transitioning = true;
  // fade out
  worldEl.classList.add('fade-out');

  // após o tempo de transição, troca o mapa e reposiciona you
  setTimeout(() => {
    // atualiza índice do mapa
    mapColIndex = targetCol;
    mapRowIndex = targetRow;
    // atualiza tile pos no novo mapa
    tileX = newTileX;
    tileY = newTileY;
    // renderiza o novo mapa
    renderMap();
    updateTileSize();
    placeYou();

    // fade in
    worldEl.classList.remove('fade-out');

    // permitir movimento só depois do fade in completar
    setTimeout(() => {
      transitioning = false;
      // pequeno delay adicional para evitar sobreposição com MOVE_DELAY
      moving = false;
    }, TRANSITION_MS + 20);
  }, TRANSITION_MS);
}

/* ---------- start ---------- */
init();
