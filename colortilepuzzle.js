// =============================================================================
// MULTICOLOR TILE PUZZLE (Yellow, Pink, Red, Blue + Goal)
// =============================================================================

const TILE_SIZE = 70;
const ROWS = 9;
const COLS = 13;

let grid = [];
let player = { r: 3, c: 1, prevR: 3, prevC: 1 };
let message = "";
let puzzleComplete = false;

function setup() {
  createCanvas(COLS * TILE_SIZE, ROWS * TILE_SIZE);
  initPuzzle();
}

function draw() {
  background(25);
  drawGrid();

  fill(255);
  textAlign(CENTER, CENTER);
  textSize(16);
  text(message, width / 2, height - 30);
}

// -----------------------------------------------------------------------------
// INIT PUZZLE
// -----------------------------------------------------------------------------
function initPuzzle() {
  // Legend:
  // P = Pink (safe)
  // R = Red (wall)
  // Y = Yellow (bounces back)
  // B = Blue (safe unless adjacent to yellow)
  // G = Goal tile (win)
  const layout = [
    "RRRRRRRRRRRRR",
    "RPYBYBYYBBYYR",
    "RYYPYPYPPPPBR",
    "RPPBYPPYPYPPR",
    "RYPYPPPYPYPYR",
    "RYPPPYPPPBBPR",
    "RBYYPPBYBYPYR",
    "RYBPYPPPBYPPR",
    "RRRRRRRRRRRPG"
  ];

  grid = [];
  for (let r = 0; r < ROWS; r++) {
    let row = [];
    for (let c = 0; c < COLS; c++) {
      const ch = layout[r][c] || "R";
      row.push({ type: ch });
    }
    grid.push(row);
  }

  player = { r: 3, c: 1, prevR: 3, prevC: 1 };
  message = "Reach the green tile!";
  puzzleComplete = false;
}

// -----------------------------------------------------------------------------
// DRAWING
// -----------------------------------------------------------------------------
function drawGrid() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = grid[r][c];
      const x = c * TILE_SIZE;
      const y = r * TILE_SIZE;

      // Color tiles
      noStroke();
      if (cell.type === "R") fill(180, 50, 50);       // Red - wall
      else if (cell.type === "Y") fill(255, 220, 60); // Yellow - bounce
      else if (cell.type === "B") fill(60, 100, 200); // Blue
      else if (cell.type === "G") fill(80, 255, 140); // Green - goal
      else fill(255, 170, 200);                       // Pink - safe

      rect(x, y, TILE_SIZE, TILE_SIZE);

      // Player
      if (r === player.r && c === player.c) {
        fill(255);
        ellipse(x + TILE_SIZE / 2, y + TILE_SIZE / 2, TILE_SIZE * 0.5);
      }
    }
  }
}

// -----------------------------------------------------------------------------
// INPUT & MOVEMENT
// -----------------------------------------------------------------------------
function keyPressed() {
  if (puzzleComplete) return;

  let dr = 0, dc = 0;
  if (key === "w" || key === "W") dr = -1;
  if (key === "s" || key === "S") dr = 1;
  if (key === "a" || key === "A") dc = -1;
  if (key === "d" || key === "D") dc = 1;

  const newR = player.r + dr;
  const newC = player.c + dc;

  if (!inBounds(newR, newC)) return;

  const target = grid[newR][newC];

  // Red tile = wall
  if (target.type === "R") {
    message = "Can't go through red tiles!";
    return;
  }

  // Move player
  player.prevR = player.r;
  player.prevC = player.c;
  player.r = newR;
  player.c = newC;

  handleTileEffect(target);
}

function inBounds(r, c) {
  return r >= 0 && r < ROWS && c >= 0 && c < COLS;
}

// -----------------------------------------------------------------------------
// TILE EFFECTS
// -----------------------------------------------------------------------------
function handleTileEffect(tile) {
  message = "";

  // Yellow = bounce back
  if (tile.type === "Y") {
    message = "Bounced off yellow tile!";
    bounceBack();
    return;
  }

  // Blue = check adjacency
  if (tile.type === "B") {
    if (isAdjacentToYellow(player.r, player.c)) {
      message = "Blue tile zapped you!";
      bounceBack();
      return;
    } else {
      message = "Safe on blue tile.";
    }
  }

  // Pink = nothing
  if (tile.type === "P") {
    message = "Soft pink tile.";
  }

  // Goal tile = win
  if (tile.type === "G") {
    puzzleComplete = true;
    message = "Puzzle complete!";
  }
}

function bounceBack() {
  player.r = player.prevR;
  player.c = player.prevC;
}

function isAdjacentToYellow(r, c) {
  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1]
  ];
  for (let [dr, dc] of dirs) {
    const nr = r + dr, nc = c + dc;
    if (inBounds(nr, nc) && grid[nr][nc].type === "Y") return true;
  }
  return false;
}
