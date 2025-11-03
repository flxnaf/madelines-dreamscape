// ============================================================================
// ECTOPAWS: Piano Puzzle (with Piano & Wall Collision)
// ============================================================================
let caveImg, pianoImg, catImg;
let player, piano, noteSounds;
let gameState = "explore";
let inputSeq = [];
let correctSeq = [
  "E3", "D3", "C3", "D3", "E3", "E3", "E3",
  "D3", "D3", "D3", "E3", "G3", "G3",
  "E3", "D3", "C3", "D3", "E3", "E3", "E3",
  "D3", "D3", "E3", "D3", "C3"
];
let message = "";
let messageTimer = 0;

const INTERACT_RADIUS = 100;

// ============================================================================
// Assets
// ============================================================================
function preload() {
  caveImg = loadImage("images/cave.png");
  pianoImg = loadImage("images/piano.png");
  catImg = loadImage("images/ectopaw.gif");

  noteSounds = {
    C3: loadSound("sounds/c3.mp3"),
    D3: loadSound("sounds/d3.mp3"),
    E3: loadSound("sounds/e3.mp3"),
    F3: loadSound("sounds/f3.mp3"),
    G3: loadSound("sounds/g3.mp3"),
    A4: loadSound("sounds/a4.mp3"),
    B4: loadSound("sounds/b4.mp3"),
    C4: loadSound("sounds/c4.mp3")
  };
}

function setup() {
  createCanvas(800, 500);
  textFont("Monaco");
  textAlign(CENTER, CENTER);

  player = {
    x: 400,
    y: 400,
    w: 50,
    h: 50,
    speed: 3.5,
    facingRight: true
  };

  piano = {
    x: width / 2 - 90,
    y: 80,
    w: 180,
    h: 180,

    hitboxX: width / 2 - 80,  
    hitboxY: 160,             
    hitboxW: 160,             
    hitboxH: 50                
  };
}

// ============================================================================
// DRAW LOOP
// ============================================================================
function draw() {
  background(0);
  image(caveImg, 0, 0, width, height);

  if (gameState === "explore") {
    updatePlayer();
    drawPlayer();
    image(pianoImg, piano.x, piano.y, piano.w, piano.h);
    checkProximity();
  }

  if (gameState === "piano") {
    drawPianoUI();
  }

  if (gameState === "win") {
    drawWinScreen();
  }

  drawMessage();
}

// ============================================================================
// PLAYER MOVEMENT + COLLISION
// ============================================================================
function updatePlayer() {
  let nextX = player.x;
  let nextY = player.y;

  // WASD controls
  if (keyIsDown(65)) { // A
    nextX -= player.speed;
    player.facingRight = false;
  }
  if (keyIsDown(68)) { // D
    nextX += player.speed;
    player.facingRight = true;
  }
  if (keyIsDown(87)) { // W
    nextY -= player.speed;
  }
  if (keyIsDown(83)) { // S
    nextY += player.speed;
  }

  // World boundaries
  nextX = constrain(nextX, player.w / 2, width - player.w / 2);
  nextY = constrain(nextY, player.h / 2, height - player.h / 2);

  // --- Collision detection with piano ---
  if (!isColliding(nextX, nextY, piano)) {
    player.x = nextX;
    player.y = nextY;
  }

  // --- Collision with upper wall (so you can't go above the piano area) ---
// --- Collision with upper wall (aligned with piano hitbox) ---
    const wallY = piano.hitboxY; // top edge of the piano's collision area
    if (player.y - player.h / 2 < wallY) {
    player.y = wallY + player.h / 2;
    }
}

// Simple AABB (axis-aligned bounding box) collision
function isColliding(x, y, obj) {
  // Use hitbox values if provided, otherwise fall back to visual size
  const objLeft = obj.hitboxX ?? obj.x;
  const objTop = obj.hitboxY ?? obj.y;
  const objRight = objLeft + (obj.hitboxW ?? obj.w);
  const objBottom = objTop + (obj.hitboxH ?? obj.h);

  const left = x - player.w / 2;
  const right = x + player.w / 2;
  const top = y - player.h / 2;
  const bottom = y + player.h / 2;

  const horizontal = right > objLeft && left < objRight;
  const vertical = bottom > objTop && top < objBottom;

  return horizontal && vertical;
}


function drawPlayer() {
  push();
  imageMode(CENTER);
  translate(player.x, player.y);
  if (!player.facingRight) scale(-1, 1);
  image(catImg, 0, 0, player.w * 1.6, player.h * 1.6);
  pop();
}

// ============================================================================
// INTERACTION
// ============================================================================
function checkProximity() {
  const d = dist(player.x, player.y, piano.x + piano.w / 2, piano.y + piano.h / 2);
  if (d < INTERACT_RADIUS) {
    fill(255);
    textSize(14);
    text("Press F to play piano", width / 2, 40);
  }
}

function keyPressed() {
  if (gameState === "explore" && (key === "f" || key === "F")) {
    const d = dist(player.x, player.y, piano.x + piano.w / 2, piano.y + piano.h / 2);
    if (d < INTERACT_RADIUS) {
      gameState = "piano";
      inputSeq = [];
    }
  }

  if (gameState === "piano") {
    const keyMap = {
      A: "C3",
      S: "D3",
      D: "E3",
      F: "F3",
      G: "G3",
      H: "A4",
      J: "B4",
      K: "C4"
    };

    const note = keyMap[key.toUpperCase()];
    if (note && noteSounds[note]) {
      noteSounds[note].play();
      inputSeq.push(note);
      checkSequence();
    }

    if (keyCode === ESCAPE) {
      gameState = "explore";
      message = "You stopped playing.";
      messageTimer = millis();
    }
  }
}

// ============================================================================
// PUZZLE LOGIC
// ============================================================================
function checkSequence() {
  const idx = inputSeq.length - 1;
  if (inputSeq[idx] !== correctSeq[idx]) {
    message = "Wrong note!";
    messageTimer = millis();
    inputSeq = [];
    return;
  }

  if (inputSeq.length === correctSeq.length) {
    message = "Correct!";
    messageTimer = millis();
    gameState = "win";
  }
}

// ============================================================================
// UI
// ============================================================================
function drawPianoUI() {
  background(0, 150);
  image(pianoImg, width / 2 - 80, 120, 180, 180);

  fill(255);
  textSize(18);
  text("Hint: Mary had a Little Lamb.", width / 2, 80);

  textSize(16);
  text("Press A–K to play notes.\nPress ESC to exit.", width / 2, 320);

  textSize(12);
  text("A=C3  S=D3  D=E3  F=F3  G=G3  H=A4  J=B4  K=C4", width / 2, 350);

  fill(200);
  textSize(14);
  text("Notes played: " + inputSeq.join(" "), width / 2, 390);
}

function drawWinScreen() {
  background(0, 180);
  fill(0, 255, 0);
  textSize(32);
  text("Correct!", width / 2, height / 2 - 20);
  fill(255);
  textSize(16);
  text("You played 'Mary Had a Little Lamb'!", width / 2, height / 2 + 20);
}

function drawMessage() {
  if (message && millis() - messageTimer < 2500) {
    fill(255);
    textSize(16);
    text(message, width / 2, height - 30);
  }
}
