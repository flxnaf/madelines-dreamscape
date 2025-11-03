// =============================================================================
// XO PUZZLE WITH NEUTRAL WALKABLE TILES
// =============================================================================

const TILE_SIZE = 70;
const ROWS = 7;
const COLS = 9;

let grid = [];
let player = { r: 4, c: 0 }; // Row 5 (index 4), Col 1 (index 0)
let puzzleComplete = false;

function setup() {
  createCanvas(COLS * TILE_SIZE, ROWS * TILE_SIZE);
  initPuzzle();
}

function draw() {
  background(25);
  drawGrid();

  if (!puzzleComplete && checkSolved()) {
    puzzleComplete = true;
    console.log("Puzzle solved!");
  }
}

// -----------------------------------------------------------------------------
// INIT PUZZLE
// -----------------------------------------------------------------------------
function initPuzzle() {
  // Legend:
  // X = toggleable tile (changes X↔O)
  // N = neutral walkable tile (does nothing)
  // # = rock wall
  //   = empty space

  const layout = [
    "NX#######",
    "#NXXN####",
    "#NNXN####",
    "#NXXNNN##",
    "NNN###X##",
    "NN####X##",
    "NX#######"
  ];

  grid = [];
  for (let r = 0; r < ROWS; r++) {
    let row = [];
    for (let c = 0; c < COLS; c++) {
      const ch = layout[r][c] || "#";

      if (ch === "X") row.push({ type: "tile", symbol: "X" });
      else if (ch === "N") row.push({ type: "neutral" });
      else if (ch === "#") row.push({ type: "wall" });
      else row.push({ type: "empty" });
    }
    grid.push(row);
  }

  player = { r: 4, c: 0 }; // Start position
}

// -----------------------------------------------------------------------------
// DRAWING
// -----------------------------------------------------------------------------
function drawGrid() {
  textAlign(CENTER, CENTER);
  textSize(26);

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = grid[r][c];
      const x = c * TILE_SIZE;
      const y = r * TILE_SIZE;

      if (cell.type === "wall") {
        fill(80, 80, 100);
        rect(x, y, TILE_SIZE, TILE_SIZE);
      } else if (cell.type === "tile") {
        fill(r === player.r && c === player.c ? 90 : 60);
        stroke(255);
        rect(x, y, TILE_SIZE, TILE_SIZE);
        fill(255);
        text(cell.symbol, x + TILE_SIZE / 2, y + TILE_SIZE / 2);
      } else if (cell.type === "neutral") {
        fill(r === player.r && c === player.c ? 100 : 70, 70, 90);
        stroke(255, 100);
        rect(x, y, TILE_SIZE, TILE_SIZE);
      } else {
        fill(25);
        rect(x, y, TILE_SIZE, TILE_SIZE);
      }
    }
  }
}

// -----------------------------------------------------------------------------
// INPUT
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

  if (!isWalkable(newR, newC)) return;

  player.r = newR;
  player.c = newC;

  const cell = grid[newR][newC];
  if (cell.type === "tile") toggleTile(newR, newC);
}

function isWalkable(r, c) {
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return false;
  return grid[r][c].type === "tile" || grid[r][c].type === "neutral";
}

// -----------------------------------------------------------------------------
// LOGIC
// -----------------------------------------------------------------------------
function toggleTile(r, c) {
  const cell = grid[r][c];
  if (cell.type === "tile") {
    cell.symbol = cell.symbol === "X" ? "O" : "X";
  }
}

function checkSolved() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = grid[r][c];
      if (cell.type === "tile" && cell.symbol !== "O") return false;
    }
  }
  return true;
}
