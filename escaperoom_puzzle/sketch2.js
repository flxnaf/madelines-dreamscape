// ============================================================================
// ECTOPAWS x ESCAPE ROOM (Merged, Clean Version)
// - Playable cat character with jump/dash
// - Interact (F) with objects: Drawer, Chest, Bed, Carpet, Crystal Ball, Mirror, Door
// - Replaced old Safe/Vent with Table + Crystal Ball + Magic Mirror
// ============================================================================

// ----------------------
// Escape Room State
// ----------------------
let hasKey = false;
let doorUnlocked = false;
let hasGem = false;
let chestOpened = false;
let hint = "";
let gameState = "start"; // start, playing, win
let code, inputBox, submitButton;
let startTime, bestTime;
let finalTime = 0;

// Images
let roomImg, doorImg, drawerImg, chestImg, openchestImg;
let bedImg, carpetImg, paintingImg, tableImg, crystalImg, mirrorImg;

// Sounds
let sfxDrawer, sfxCloth, sfxKey;

// Message system
let message = "";
let messageTimer = 0;

// ----------------------
// Player / Platformer
// ----------------------
let player;
let catImg;
let dashTrail = [];

const BORDER_THICKNESS = 10;
const INTERACT_RADIUS = 80;
const GRAVITY = 0.6;
const FLOOR_Y = 450;

// Interactable objects
const objects = {
  drawer:   { name: "Drawer",  x: 50,  y: 310, w: 150, h: 100, hitboxX: 80, hitboxY: 325, hitboxH: 130, hitboxW: 95, interact: true, platform: true },
  painting: { name: "Painting", x: 100, y: 150, w: 170, h: 120, interact: true, platform: false },
  chest:    { name: "Chest",   x: 180, y: 300, w: 125, h: 125, hitboxX: 200, hitboxY: 325, hitboxH: 130, hitboxW: 95, interact: true, platform: true },
  bed:      { name: "Bed",     x: 300, y: 265, w: 200, h: 160, hitboxY: 360, hitboxX: 320, hitboxW: 150, hitboxH: 100, interact: true, platform: true },
  carpet:   { name: "Carpet",  x: 250, y: 400, w: 180, h: 110, interact: true, platform: false },
  table:    { name: "Table",   x: 525, y: 280, w: 130, h: 170, hitboxX: 540, hitboxY: 350, hitboxW: 100, hitboxH: 50, interact: true, platform: true },
  crystalball: { name: "Crystal Ball", x: 550, y: 270, w: 80, h: 80, interact: true, platform: false },
  mirror:   { name: "Magic Mirror", x: 540, y: 125, w: 110, h: 105, interact: true, platform: false },
  door:     { name: "Door",    x: 645, y: 209, w: 165, h: 200, interact: true, platform: false },
};

// Platforms
let platformRects = [];

// Audio (oscillators from your platformer)
let jumpSound, dashSound;

// ============================================================================
// P5 CORE
// ============================================================================
function preload() {
  // Escape room art
  roomImg      = loadImage("images/room.png");
  doorImg      = loadImage("images/door.png");
  drawerImg    = loadImage("images/drawer.png");
  chestImg     = loadImage("images/chest.png");
  openchestImg = loadImage("images/openchest.png");
  bedImg       = loadImage("images/bed.png");
  carpetImg    = loadImage("images/carpet.png");
  paintingImg  = loadImage("images/painting.png");
  tableImg     = loadImage("images/table.png");
  crystalImg   = loadImage("images/crystalball.png");
  mirrorImg    = loadImage("images/magicmirror.png");

  // Player art
  catImg = loadImage("ectopaw.gif");

  // Sounds
  sfxDrawer = loadSound("sounds/drawer.mp3");
  sfxCloth  = loadSound("sounds/cloth.mp3");
  sfxKey    = loadSound("sounds/key.mp3");
}

function setup() {
  createCanvas(800, 500);
  textAlign(CENTER, CENTER);
  rectMode(CENTER);
  imageMode(CORNER);
  textFont('Monaco');

  code = nf(int(random(1000, 9999)), 4);

  // Input UI (hidden)
  inputBox = createInput();
  inputBox.position(1000, 450);
  inputBox.hide();

  submitButton = createButton("Submit Code");
  submitButton.position(910, 450);
  submitButton.mousePressed(checkCode);
  submitButton.hide();

  startTime = millis();
  bestTime = float(getItem("bestTime")) || null;

  // Sounds
  jumpSound = new p5.Oscillator('sine');
  dashSound = new p5.Oscillator('square');

  rebuildPlatformRects();
  initPlayer();
}

function draw() {
  background(40);

  if (gameState === "start") {
    drawStartScreen();
    return;
  }

  if (gameState === "playing") {
    drawRoom();
    updatePlayer();
    drawPlayer();
    drawInteraction();
    drawUI();
    return;
  }

  if (gameState === "win") {
    drawRoom();
    drawPlayer();
    drawWinScreen();
  }
}

function mousePressed() {
  if (gameState === "start") {
    gameState = "playing";
    startTime = millis();
  }
}

function keyPressed() {
  if (gameState !== "playing") return;

  // Jump
  if ((key === ' ' || key === 'W' || key === 'w') && player.onGround) {
    player.vy = -player.jumpForce;
    player.onGround = false;
    playJumpSound();
  }

  // Interact
  if (key === 'F' || key === 'f') {
    handleInteraction();
  }
}

// ============================================================================
// Player + Physics
// ============================================================================
function initPlayer() {
  player = new Player(width / 2, FLOOR_Y - 75);
}

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.displayW = 65;
    this.displayH = 65;
    this.w = 40;
    this.h = 65;
    this.vx = 0;
    this.vy = 0;
    this.speed = 4.0;
    this.jumpForce = 12;
    this.gravity = GRAVITY;
    this.onGround = false;
    this.canDash = true;
    this.isDashing = false;
    this.dashSpeed = 15;
    this.dashDuration = 0;
    this.facingRight = true;
  }
}

function updatePlayer() {
  let p = player;

  // Movement
  if (!p.isDashing) {
    if (keyIsDown(65) || keyIsDown(37)) { // A or Left
      p.vx = -p.speed;
      p.facingRight = false;
    } else if (keyIsDown(68) || keyIsDown(39)) { // D or Right
      p.vx = p.speed;
      p.facingRight = true;
    } else {
      p.vx = 0;
    }
    p.vy += p.gravity;
  } else {
    if (frameCount % 2 === 0) dashTrail.push(new DashAfterimage(p.x, p.y, p.displayW, p.displayH));
    p.dashDuration--;
    if (p.dashDuration <= 0) {
      p.isDashing = false;
      p.vx *= 0.5;
      p.vy *= 0.5;
    }
  }

  // Dash
  if (keyIsDown(SHIFT) && p.canDash && !p.isDashing) {
    let dx = 0;
    if (keyIsDown(65) || keyIsDown(37)) dx = -1;
    if (keyIsDown(68) || keyIsDown(39)) dx = 1;
    if (dx !== 0) {
      playDashSound();
      p.isDashing = true;
      p.dashDuration = 10;
      p.canDash = false;
      p.vx = dx * p.dashSpeed;
    }
  }

  // Apply velocity
  p.x += p.vx;
  p.y += p.vy;

  // Bounds
  const minX = BORDER_THICKNESS + p.w / 2;
  const maxX = width - BORDER_THICKNESS - p.w / 2;
  if (p.x < minX) { p.x = minX; p.isDashing = false; }
  if (p.x > maxX) { p.x = maxX; p.isDashing = false; }

  // Floor
  const playerBottom = p.y + p.h / 2;
  if (playerBottom >= FLOOR_Y) {
    p.y = FLOOR_Y - p.h / 2;
    p.vy = 0;
    p.onGround = true;
    p.canDash = true;
    p.isDashing = false;
  } else {
    p.onGround = false;
  }

  // Platforms
  for (let r of platformRects) {
    const top = r.y;
    const left = r.x;
    const right = r.x + r.w;
    const prevBottom = (p.y + p.h / 2) - p.vy;
    const horizontallyOver = (p.x + p.w / 2 > left) && (p.x - p.w / 2 < right);
    const descending = p.vy >= 0;
    if (descending && horizontallyOver && prevBottom <= top && playerBottom >= top) {
      p.y = top - p.h / 2;
      p.vy = 0;
      p.onGround = true;
      p.canDash = true;
      p.isDashing = false;
    }
  }

  p.vy = constrain(p.vy, -20, 20);

  // Dash afterimages
  for (let i = dashTrail.length - 1; i >= 0; i--) {
    dashTrail[i].life--;
    if (dashTrail[i].life <= 0) dashTrail.splice(i, 1);
  }
}

function drawPlayer() {
  for (let i = 0; i < dashTrail.length; i++) dashTrail[i].display();
  push();
  imageMode(CENTER);
  translate(player.x, player.y);
  if (!player.facingRight) scale(-1, 1);
  if (catImg) image(catImg, 0, 0, player.displayW, player.displayH);
  else ellipse(0, 0, player.displayW, player.displayH);
  pop();
}

class DashAfterimage {
  constructor(x, y, w, h) {
    this.x = x; this.y = y; this.w = w; this.h = h;
    this.life = 15; this.maxLife = 15;
  }
  display() {
    push();
    imageMode(CENTER);
    let alpha = map(this.life, 0, this.maxLife, 0, 230);
    tint(0, 200, 255, alpha);
    image(catImg, this.x, this.y, this.w, this.h);
    pop();
  }
}

// ============================================================================
// Interaction
// ============================================================================
function handleInteraction() {
  let target = getNearestInteractable();
  if (!target) return;

  const name = target.name;

  if (name === "Drawer") {
    if (!hasKey) {
      hasKey = true;
      message = "You found a key!";
      sfxDrawer.play();
    } else {
      message = "The drawer is empty...";
      sfxCloth.play();
    }
  }

  else if (name === "Painting") {
    message = "Just a painting... nothing special";
    sfxCloth.play();
  }

  else if (name === "Chest") {
    if (!hasKey) {
      message = "It's locked... maybe there's a key somewhere.";
    } else if (hasKey && !chestOpened) {
      hasGem = true;
      chestOpened = true;
      message = "Unlocked the chest and found a glowing gem!";
      sfxKey.play();
    } else {
      message = "The chest is empty now...";
    }
  }

  else if (name === "Crystal Ball") {
    if (!hasKey) hint = "The crystal whispers: 'Check the drawer...'";
    else if (!hasGem) hint = "The crystal hums: 'Something valuable lies within the chest...'";
    else if (!doorUnlocked) hint = "The crystal glows: 'The mirror holds your path to freedom...'";
    else hint = "The crystal dims, its power spent.";
    message = "The crystal ball shimmers softly.";
  }

  else if (name === "Magic Mirror") {
    if (!hasGem) {
      message = "The mirror's surface ripples faintly, but nothing happens...";
    } else {
      message = "The mirror reveals glowing runes: " + code;
    }
  }

  else if (name === "Bed") {
    message = "Nothing useful here...";
    sfxCloth.play();
  }

  else if (name === "Carpet") {
    message = "Just a carpet...";
    sfxCloth.play();
  }

  else if (name === "Door") {
    if (hasGem && !doorUnlocked) {
      inputBox.show();
      submitButton.show();
      message = "Enter the 4-digit code to escape.";
    } else if (!hasGem) {
      message = "It's locked tight.";
    }
  }

  messageTimer = millis();
}

function getNearestInteractable() {
  let best = null;
  let bestDist = Infinity;
  for (let key in objects) {
    const o = objects[key];
    if (!o.interact) continue;
    const cx = o.x + o.w / 2;
    const cy = o.y + o.h / 2;
    const d = dist(player.x, player.y, cx, cy);
    if (d < INTERACT_RADIUS && d < bestDist) {
      best = o;
      bestDist = d;
    }
  }
  return best;
}

function drawInteraction() {
  const target = getNearestInteractable();
  if (!target) return;
  push();
  fill(0, 180);
  noStroke();
  rect(width / 2, 40, 250, 36, 8);
  fill(255);
  textSize(14);
  text("Press F to interact with " + target.name, width / 2, 40);
  pop();
}

// ============================================================================
// Room Rendering + UI
// ============================================================================
function drawRoom() {
  image(roomImg, 0, 0, width, height);
  image(paintingImg, objects.painting.x, objects.painting.y, objects.painting.w, objects.painting.h);
  image(drawerImg, objects.drawer.x, objects.drawer.y, objects.drawer.w, objects.drawer.h);
  if (!chestOpened)
    image(chestImg, objects.chest.x, objects.chest.y, objects.chest.w, objects.chest.h);
  else
    image(openchestImg, objects.chest.x, objects.chest.y, objects.chest.w, objects.chest.h);
  image(bedImg, objects.bed.x, objects.bed.y, objects.bed.w, objects.bed.h);
  image(carpetImg, objects.carpet.x, objects.carpet.y, objects.carpet.w, objects.carpet.h);
  image(tableImg, objects.table.x, objects.table.y, objects.table.w, objects.table.h);
  image(crystalImg, objects.crystalball.x, objects.crystalball.y, objects.crystalball.w, objects.crystalball.h);
  image(mirrorImg, objects.mirror.x, objects.mirror.y, objects.mirror.w, objects.mirror.h);
  image(doorImg, objects.door.x, objects.door.y, objects.door.w, objects.door.h);
}

function drawStartScreen() {
  fill(255);
  textSize(28);
  text("ECTOPAWS — Escape Room", width / 2, height / 2 - 20);
  textSize(16);
  text("Click to Start", width / 2, height / 2 + 10);
  text("Move: A/D or ←/→   Jump: W/SPACE   Dash: SHIFT   Interact: F", width / 2, height / 2 + 40);
}

function drawWinScreen() {
  fill(0, 0, 0, 200);
  rect(width / 2, height / 2, width, height);
  fill(0, 255, 0);
  textSize(32);
  text('You Escaped!', width / 2, height / 2 - 50);
  fill(255);
  textSize(18);
  text("Code was: " + code, width / 2, height / 2 - 15);
  text("Your Time: " + nf(finalTime, 1, 2) + "s", width / 2, height / 2 + 15);
  if (bestTime !== null) text("Best Time: " + nf(bestTime, 1, 2) + "s", width / 2, height / 2 + 45);
}

function drawUI() {
  push();
  textAlign(LEFT, TOP);
  fill(255);
  textSize(14);
  const elapsed = (millis() - startTime) / 1000;
  text(`Time: ${nf(elapsed, 1, 2)}s`, 10, 10);
  if (bestTime !== null) text(`Best: ${nf(bestTime, 1, 2)}s`, 10, 28);
  if (message && millis() - messageTimer < 2000) {
    textAlign(CENTER, CENTER);
    textSize(16);
    text(message, width / 2, height - 30);
  }
  if (hint) {
    textAlign(CENTER, TOP);
    textSize(14);
    text(hint, width / 2, 10);
  }
  pop();
}

// ============================================================================
// Helpers
// ============================================================================
function rebuildPlatformRects() {
  platformRects = [];
  for (let key in objects) {
    const o = objects[key];
    if (o.platform) {
      platformRects.push({
        x: (o.hitboxX !== undefined ? o.hitboxX : o.x),
        y: (o.hitboxY !== undefined ? o.hitboxY : o.y),
        w: (o.hitboxW !== undefined ? o.hitboxW : o.w),
        h: (o.hitboxH !== undefined ? o.hitboxH : o.h)
      });
    }
  }
}

function checkCode() {
  if (inputBox.value() === code) {
    doorUnlocked = true;
    inputBox.hide();
    submitButton.hide();
    gameState = "win";
    finalTime = (millis() - startTime) / 1000;
    if (!bestTime || finalTime < bestTime) {
      storeItem("bestTime", finalTime);
      bestTime = finalTime;
    }
  } else {
    message = "Wrong code!";
    messageTimer = millis();
  }
}

// ============================================================================
// Audio shims
// ============================================================================
function playJumpSound() {
  jumpSound.freq(400);
  jumpSound.amp(0.1);
  jumpSound.start();
  setTimeout(() => jumpSound.stop(), 100);
}

function playDashSound() {
  dashSound.freq(200);
  dashSound.amp(0.15);
  dashSound.start();
  setTimeout(() => dashSound.stop(), 150);
}
