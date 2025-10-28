// =============================================================================
// MADELINE'S DREAMSCAPE - Main Game File
// =============================================================================

/*
FUNCTION INDEX:
- preload() - Loads all game assets (images, sounds, fonts)
- setup() - Initializes game, creates canvas, sets up audio and world
- draw() - Main game loop, handles different game states
- keyPressed() - Handles keyboard input for all game states

INTRO SEQUENCE:
- drawIntroSequence() - Manages intro cutscene with multiple scenes
- drawCatJumpAnimation() - Animates cat jumping into Madeline's head
- drawFallingAnimation() - Animates cat falling into dreamscape
- transitionToExploring() - Transitions from intro to main game

WORLD & EXPLORATION:
- initWorld() - Creates NPCs and obstacles in the game world
- drawWorld() - Renders the exploration world with camera
- updateCamera() - Centers camera on player position
- checkNPCInteraction() - Handles player talking to NPCs
- drawExploringUI() - Shows controls and dash status

DIALOGUE SYSTEM:
- startDialogue() - Begins conversation with an NPC
- drawDialogue() - Renders dialogue interface
- drawDialogueBox() - Draws the dialogue text box with animation
- drawDialogueChoices() - Displays dialogue choices with selection
- advanceDialogue() - Handles dialogue progression and choices
- handleDialogueChoice() - Processes player's dialogue selection
- exitDialogue() - Ends dialogue and returns to exploration

SWIRL ANIMATION:
- startSwirlAnimation() - Initiates cat swirling into Echo
- drawSwirlAnimation() - Renders the swirling cat animation

PUZZLE GAME:
- initPuzzle() - Sets up the XO puzzle grid and positions
- drawPuzzle() - Main puzzle game loop
- drawPuzzleGrid() - Renders the puzzle grid with tiles and player
- handlePuzzleInput() - Handles WASD movement in puzzle
- isPuzzleWalkable() - Checks if puzzle position is walkable (cage closed)
- isPuzzleWalkableOpen() - Checks if puzzle position is walkable (cage open)
- togglePuzzleTile() - Toggles X/O tiles when stepped on
- checkPuzzleSolved() - Checks if all X tiles are turned to O

PLAYER CLASS:
- Player constructor - Creates player with position, movement, and dash properties
- update() - Handles player movement, dashing, and collision detection
- dash() - Performs dash movement with cooldown
- collidesWith() - Checks collision between player and obstacles
- display() - Renders the player sprite

DASH AFTERIMAGE CLASS:
- DashAfterimage constructor - Creates trail effect for dash
- display() - Renders fading afterimage trail

NPC CLASS:
- NPC constructor - Creates NPC with position, name, and color
- getColorByName() - Returns color based on NPC name
- display() - Renders NPC sprite with name label

AUDIO:
- playDashSound() - Plays dash sound effect with woosh or oscillator fallback

HTML BUTTONS:
- setupButtons() - Sets up HTML button event listeners
- checkDash() - Handles dash input with Shift+Direction keys
*/

// =============================================================================
// GAME STATE MANAGEMENT
// =============================================================================

let gameState = 'intro'; // 'intro', 'exploring', 'dialogue', 'swirlAnimation', 'puzzle', the beginning is gonna start with intro

// =============================================================================
// PLAYER & MOVEMENT
// =============================================================================

let player;
let catImg;
let madelineImg;
let echoImg;
let echoStatueImg; // Static grayscale version for statue
let dashTrail = [];
let pixelFont;

// =============================================================================
// WORLD & ENVIRONMENT
// =============================================================================

let cameraX = 0;
let cameraY = 0;
let npcs = [];
let obstacles = [];

// =============================================================================
// INTRO SEQUENCE
// =============================================================================

let introSequence = [
  {
    type: 'catJump',
    duration: 120
  },
  {
    type: 'text',
    text: 'Deep in Madeline\'s dreams...',
    duration: 90,
    bgColor: [10, 10, 30]
  },
  {
    type: 'falling',
    duration: 180
  }
];

let introTimer = 0;
let introSceneIndex = 0;
let skipIntroPrompt = true;
let fallingCatY = -100;
let fallingCatRotation = 0;
let jumpCatY = 700; // Start below screen
let jumpCatX = 400;

// =============================================================================
// DIALOGUE SYSTEM
// =============================================================================

let currentDialogue = null;
let dialogueCooldown = 0; // Frames to wait before allowing new interaction
let dialogueBox = {
  x: 50,
  y: 450,
  w: 500,
  h: 140,
  padding: 20,
  displayedText: '',
  fullText: '',
  textIndex: 0,
  textSpeed: 2, // characters per frame
  selectedChoice: 0
};

// =============================================================================
// SWIRL ANIMATION
// =============================================================================

let swirlAnimation = {
  timer: 0,
  duration: 120, // 2 seconds
  rotation: 0,
  scale: 1,
  targetNPC: null
};

// =============================================================================
// PUZZLE GAME (XO Puzzle for Echo, Color Tile for Mind Wanderer)
// =============================================================================

const TILE_SIZE = 70;
const PUZZLE_ROWS = 7;
const PUZZLE_COLS = 9;
let puzzleGrid = [];
let puzzlePlayer = { r: 4, c: 0 };
let puzzleComplete = false;
let puzzleOffsetX = 0;
let puzzleOffsetY = 0;
let essencePosition = { r: 3, c: 7 }; // Position of Echo's Essence (outside the cage)
let essenceCollected = false;
let echoIsStatue = false; // Track if Echo has been turned into a statue
let wandererIsStatue = false; // Track if Mind Wanderer has been turned into a statue
let cageOpen = false; // Track if the cage borders have opened
let currentPuzzleNPC = null; // Track which NPC's puzzle is active

// Soul collection system
let collectedSouls = []; // Array to store collected souls ["Echo", "The Mind Wanderer", etc.]
let soulDisplayTimer = 0;
let currentSoulDisplay = 0;

// Color Tile Puzzle specific variables
const COLOR_PUZZLE_ROWS = 9;
const COLOR_PUZZLE_COLS = 13;
let puzzleMessage = "";
let playerPrevPos = { r: 0, c: 0 }; // For bounce back mechanic
let wandererSoulPosition = { r: 8, c: 11 }; // Position of Wanderer's Soul (at goal)
let wandererSoulCollected = false;

// =============================================================================
// AUDIO
// =============================================================================

let soundEnabled = true;
let dashSound;
let wooshSound;

// =============================================================================
// GAME SETTINGS
// =============================================================================

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const WORLD_WIDTH = 1600;
const WORLD_HEIGHT = 1200;

// =============================================================================
// P5.JS CORE FUNCTIONS
// =============================================================================

function preload() {
  // Load the cat sprite
  catImg = loadImage('ectopaw.gif');
  
  // Load Madeline sleeping image
  madelineImg = loadImage('l-intro-1604702252.jpg');
  
  // Load Echo sprite
  echoImg = loadImage('echo.gif');
  
  // Load woosh sound effect
  wooshSound = loadSound('Woosh Effect 5.wav');
  
  // Load pixel font
  pixelFont = loadFont('PressStart2P.ttf');
}

function setup() {
  let canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  canvas.parent('canvas-container');
  
  // Set pixel font loaded in preload
  if (pixelFont) {
    textFont(pixelFont);
  }
  
  // Create static grayscale version of echo.gif for statue
  if (echoImg) {
    echoStatueImg = createImage(echoImg.width, echoImg.height);
    echoStatueImg.copy(echoImg, 0, 0, echoImg.width, echoImg.height, 0, 0, echoImg.width, echoImg.height);
    echoStatueImg.filter(GRAY); // Convert to grayscale
    echoStatueImg.loadPixels();
    // Brighten the grayscale image to look more like stone
    for (let i = 0; i < echoStatueImg.pixels.length; i += 4) {
      echoStatueImg.pixels[i] *= 0.85;     // R - keep more brightness
      echoStatueImg.pixels[i + 1] *= 0.85; // G
      echoStatueImg.pixels[i + 2] *= 0.85; // B
      // Keep alpha the same (i+3)
    }
    echoStatueImg.updatePixels();
  }
  
  // Initialize audio
  dashSound = new p5.Oscillator('square');
  
  // Initialize player (will be positioned after intro)
  player = new Player(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
  
  // Setup HTML button listeners
  setupButtons();
  
  // Initialize world
  initWorld();
}

function draw() {
  if (gameState === 'intro') {
    drawIntroSequence();
  } else if (gameState === 'exploring') {
    drawWorld();
  } else if (gameState === 'dialogue') {
    drawDialogue();
  } else if (gameState === 'swirlAnimation') {
    drawSwirlAnimation();
  } else if (gameState === 'puzzle') {
    drawPuzzle();
  }
}

function keyPressed() {
  // Skip intro
  if (gameState === 'intro' && (keyCode === ENTER || keyCode === 32 || key === 'e' || key === 'E')) {
    transitionToExploring();
  }
  
  // Dialogue advancement
  if (gameState === 'dialogue') {
    // ESC to exit dialogue (prevent default to avoid exiting fullscreen)
    if (keyCode === ESCAPE) {
      exitDialogue();
      return false; // Prevent default browser behavior
    }
    
    if (keyCode === ENTER || key === 'e' || key === 'E') {
      advanceDialogue();
    }
    
    // Choice selection
    if (currentDialogue && currentDialogue.choices && currentDialogue.choices.length > 0) {
      if (keyCode === UP_ARROW) {
        dialogueBox.selectedChoice = max(0, dialogueBox.selectedChoice - 1);
      } else if (keyCode === DOWN_ARROW) {
        dialogueBox.selectedChoice = min(currentDialogue.choices.length - 1, dialogueBox.selectedChoice + 1);
      }
    }
  }
  
  // NPC interactions while exploring
  if (gameState === 'exploring' && (key === 'e' || key === 'E' || keyCode === ENTER)) {
    checkNPCInteraction();
  }
  
  // Puzzle controls
  if (gameState === 'puzzle') {
    handlePuzzleInput();
  }
}

// =============================================================================
// INTRO SEQUENCE FUNCTIONS
// =============================================================================

function drawIntroSequence() {
  let scene = introSequence[introSceneIndex];
  
  if (scene.type === 'madeline') {
    // Show Madeline sleeping
    background(20, 20, 40);
    
    // Fade in effect
    let alpha = 255;
    if (introTimer < 30) {
      alpha = map(introTimer, 0, 30, 0, 255);
    }
    
    push();
    tint(255, alpha);
    imageMode(CENTER);
    // Scale image to fit canvas
    let imgScale = min(width / madelineImg.width, height / madelineImg.height) * 0.8;
    image(madelineImg, width / 2, height / 2, madelineImg.width * imgScale, madelineImg.height * imgScale);
    pop();
    
  } else if (scene.type === 'catJump') {
    // Cat jumps into Madeline's head
    drawCatJumpAnimation();
    
  } else if (scene.type === 'text') {
    background(scene.bgColor[0], scene.bgColor[1], scene.bgColor[2]);
    
    // Draw text
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(18);
    
    // Fade in effect
    let alpha = 255;
    if (introTimer < 30) {
      alpha = map(introTimer, 0, 30, 0, 255);
    } else if (introTimer > scene.duration - 30) {
      alpha = map(introTimer, scene.duration - 30, scene.duration, 255, 0);
    }
    
    fill(255, 255, 255, alpha);
    text(scene.text, width / 2, height / 2);
    
  } else if (scene.type === 'falling') {
    // Cat falling into dreamscape
    drawFallingAnimation();
  }
  
  // Skip prompt
  if (skipIntroPrompt) {
    fill(255, 255, 255, 150 + sin(frameCount * 0.1) * 105);
    textSize(10);
    textAlign(CENTER, CENTER);
    text('Press ENTER or E to skip', width / 2, height - 30);
  }
  
  // Update timer
  introTimer++;
  
  // Move to next scene
  if (introTimer >= scene.duration) {
    introTimer = 0;
    introSceneIndex++;
    
    // Reset animation variables based on next scene
    if (introSceneIndex < introSequence.length) {
      if (introSequence[introSceneIndex].type === 'falling') {
        fallingCatY = -100;
        fallingCatRotation = 0;
      } else if (introSequence[introSceneIndex].type === 'catJump') {
        jumpCatY = height + 100; // Start below screen
        jumpCatX = width / 2;
      }
    }
    
    // Check if intro is complete
    if (introSceneIndex >= introSequence.length) {
      transitionToExploring();
    }
  }
}

function drawCatJumpAnimation() {
  // Show Madeline in background
  background(20, 20, 40);
  
  push();
  imageMode(CENTER);
  let imgScale = min(width / madelineImg.width, height / madelineImg.height) * 0.8;
  image(madelineImg, width / 2, height / 2, madelineImg.width * imgScale, madelineImg.height * imgScale);
  pop();
  
  // Animate cat jumping up into Madeline's head
  let progress = introTimer / 120; // 0 to 1
  
  // Ease in-out cubic for smooth jump
  let easeProgress = progress < 0.5 
    ? 4 * progress * progress * progress 
    : 1 - pow(-2 * progress + 2, 3) / 2;
  
  // Jump from bottom to Madeline's head area
  jumpCatY = map(easeProgress, 0, 1, height + 50, height / 2 - 80);
  
  // Slight arc in the jump
  let arcOffset = sin(progress * PI) * 30;
  jumpCatX = width / 2 + arcOffset;
  
  // Draw the cat
  push();
  imageMode(CENTER);
  
  // Slight rotation during jump
  translate(jumpCatX, jumpCatY);
  rotate(sin(progress * PI * 2) * 0.2);
  
  if (catImg) {
    image(catImg, 0, 0, 60, 60);
  } else {
    fill(150, 150, 150);
    ellipse(0, 0, 60, 60);
  }
  pop();
  
  // Fade out at the end as cat enters the dream
  if (progress > 0.8) {
    let fadeAlpha = map(progress, 0.8, 1, 0, 200);
    fill(10, 10, 30, fadeAlpha);
    rect(0, 0, width, height);
  }
}

function drawFallingAnimation() {
  // Gradient background (dream-like)
  for (let i = 0; i < height; i++) {
    let inter = map(i, 0, height, 0, 1);
    let c = lerpColor(color(50, 30, 80), color(20, 10, 40), inter);
    stroke(c);
    line(0, i, width, i);
  }
  
  // Falling cat
  fallingCatY += 3;
  fallingCatRotation += 0.05;
  
  push();
  translate(width / 2, fallingCatY);
  rotate(fallingCatRotation);
  imageMode(CENTER);
  if (catImg) {
    image(catImg, 0, 0, 80, 80);
  } else {
    fill(150, 150, 150);
    ellipse(0, 0, 80, 80);
  }
  pop();
  
  // Motion lines
  stroke(255, 255, 255, 100);
  strokeWeight(2);
  for (let i = 0; i < 5; i++) {
    let lineY = fallingCatY - 50 - i * 20;
    line(width / 2 - 15, lineY, width / 2 - 25, lineY - 15);
    line(width / 2 + 15, lineY, width / 2 + 25, lineY - 15);
  }
}

function transitionToExploring() {
  gameState = 'exploring';
  introSceneIndex = 0;
  introTimer = 0;
  
  // Place player at landing spot
  player.x = WORLD_WIDTH / 2;
  player.y = WORLD_HEIGHT / 2;
  
  // Center camera on player
  updateCamera();
}

// =============================================================================
// WORLD FUNCTIONS
// =============================================================================

function initWorld() {
  // Create obstacles/buildings (grey with collision)
  obstacles = [
    { x: WORLD_WIDTH / 2 - 450, y: WORLD_HEIGHT / 2 - 200, w: 120, h: 100 },
    { x: WORLD_WIDTH / 2 + 350, y: WORLD_HEIGHT / 2 + 100, w: 150, h: 90 },
    { x: WORLD_WIDTH / 2 - 150, y: WORLD_HEIGHT / 2 + 250, w: 100, h: 140 },
    { x: WORLD_WIDTH / 2 + 150, y: WORLD_HEIGHT / 2 - 300, w: 130, h: 120 },
    { x: WORLD_WIDTH / 2 - 350, y: WORLD_HEIGHT / 2 + 100, w: 100, h: 100 }
  ];
  
  // Create NPCs in the world (all rectangles, positioned away from obstacles)
  npcs = [
    new NPC(WORLD_WIDTH / 2 - 250, WORLD_HEIGHT / 2 + 50, 'The Mind Wanderer'),
    new NPC(WORLD_WIDTH / 2 + 250, WORLD_HEIGHT / 2 - 50, 'Echo'),
    new NPC(WORLD_WIDTH / 2 - 50, WORLD_HEIGHT / 2 - 200, 'Dream Guardian')
  ];
}

function drawWorld() {
  // Decrease dialogue cooldown
  if (dialogueCooldown > 0) {
    dialogueCooldown--;
  }
  
  // Update camera to follow player
  updateCamera();
  
  // Lighter purple background for better contrast with gray cat
  background(55, 45, 75);
  
  push();
  // Apply camera translation
  translate(-cameraX, -cameraY);
  
  // Draw obstacles/buildings (grey with collision)
  for (let obs of obstacles) {
    fill(80, 80, 80);
    stroke(255);
    strokeWeight(2);
    rect(obs.x, obs.y, obs.w, obs.h);
  }
  
  // Draw non-statue NPCs and all NPC labels first (behind player)
  for (let npc of npcs) {
    let isStatue = (npc.name === 'Echo' && echoIsStatue) || 
                   (npc.name === 'The Mind Wanderer' && wandererIsStatue);
    if (!isStatue) {
      npc.display();
    } else {
      // Draw statue labels behind player
      npc.displayLabel();
    }
  }
  
  // Update and draw dash trail (before player so it appears behind)
  for (let i = dashTrail.length - 1; i >= 0; i--) {
    dashTrail[i].life--;
    dashTrail[i].display();
    
    if (dashTrail[i].life <= 0) {
      dashTrail.splice(i, 1);
    }
  }
  
  // Check for dash input
  checkDash();
  
  // Update and draw player
  player.update();
  player.display();
  
  // Draw statue sprites on top of player (without labels)
  for (let npc of npcs) {
    let isStatue = (npc.name === 'Echo' && echoIsStatue) || 
                   (npc.name === 'The Mind Wanderer' && wandererIsStatue);
    if (isStatue) {
      npc.displaySprite();
    }
  }
  
  pop();
  
  // Draw UI (not affected by camera)
  drawExploringUI();
}

// Get all collidable objects (obstacles + statues)
function getCollidableObjects() {
  let collidables = [...obstacles]; // Start with regular obstacles
  
  // Add statues as collidable obstacles
  for (let npc of npcs) {
    if (npc.name === 'Echo' && echoIsStatue) {
      // Echo statue - very tight collision box at the absolute bottom
      // This allows walking behind the statue and minimizes gap
      collidables.push({
        x: npc.x - npc.w / 2 + 15,   // Very inset from sides
        y: npc.y + 22,                 // Even lower - absolute bottom
        w: npc.w - 30,                 // Very narrow
        h: npc.h / 2 - 22              // Extremely short - just the very bottom
      });
    } else if (npc.name === 'The Mind Wanderer' && wandererIsStatue) {
      // Mind Wanderer statue - normal collision
      collidables.push({
        x: npc.x - npc.w / 2,
        y: npc.y - npc.h / 2,
        w: npc.w,
        h: npc.h
      });
    }
  }
  
  return collidables;
}

function updateCamera() {
  // Camera follows player
  cameraX = player.x - width / 2;
  cameraY = player.y - height / 2;
  
  // Keep camera within world bounds
  cameraX = constrain(cameraX, 0, WORLD_WIDTH - width);
  cameraY = constrain(cameraY, 0, WORLD_HEIGHT - height);
}

function checkNPCInteraction() {
  // Don't allow interaction if cooldown is active
  if (dialogueCooldown > 0) {
    return;
  }
  
  // Check if player is near any NPC
  for (let npc of npcs) {
    // Skip Echo if it's been turned into a statue
    if (npc.name === 'Echo' && echoIsStatue) {
      continue;
    }
    // Skip Mind Wanderer if it's been turned into a statue
    if (npc.name === 'The Mind Wanderer' && wandererIsStatue) {
      continue;
    }
    
    let distToNPC = dist(player.x, player.y, npc.x, npc.y);
    if (distToNPC < 80) {
      startDialogue(npc);
      return;
    }
  }
}

function drawExploringUI() {
  // UI background
  fill(0, 0, 0, 180);
  noStroke();
  rect(10, 10, 220, 100);
  
  // Instructions
  fill(255);
  textAlign(LEFT, TOP);
  textSize(9);
  text('WASD - Move', 20, 20);
  text('Hold Shift + Dir - Dash', 20, 40);
  text('E / Enter - Talk to NPC', 20, 60);
  
  // Dash status
  if (player.isDashing) {
    fill(100, 180, 255);
    text('Dashing!', 20, 80);
  } else if (player.dashCooldown > 0) {
    fill(255, 150, 100);
    let secondsLeft = (player.dashCooldown / 60).toFixed(1);
    text('Dash CD: ' + secondsLeft + 's', 20, 80);
  } else {
    fill(100, 255, 200);
    text('Dash Ready', 20, 80);
  }
  
  // Soul counter in bottom right
  if (collectedSouls.length > 0) {
    drawSoulCounter();
  }
  
  // Check if near any NPC
  let nearNPC = null;
  for (let npc of npcs) {
    let d = dist(player.x, player.y, npc.x, npc.y);
    if (d < 80) {
      nearNPC = npc;
      break;
    }
  }
}

function drawSoulCounter() {
  // Update display timer
  soulDisplayTimer++;
  if (soulDisplayTimer > 90) { // Change soul every 1.5 seconds
    soulDisplayTimer = 0;
    currentSoulDisplay = (currentSoulDisplay + 1) % collectedSouls.length;
  }
  
  push();
  
  // Current soul display (cycling)
  const currentSoul = collectedSouls[currentSoulDisplay];
  let soulColor;
  
  if (currentSoul === 'Echo') {
    soulColor = [100, 200, 255]; // Cyan/teal
  } else if (currentSoul === 'The Mind Wanderer') {
    soulColor = [180, 120, 255]; // Purple/lavender
  }
  
  // Draw glowing soul icon - moved further left
  const soulX = width - 130;
  const soulY = height - 33;
  
  // Outer glow
  fill(soulColor[0], soulColor[1], soulColor[2], 100 + sin(frameCount * 0.1) * 50);
  noStroke();
  ellipse(soulX, soulY, 30);
  // Middle glow
  fill(soulColor[0], soulColor[1], soulColor[2], 200);
  ellipse(soulX, soulY, 20);
  // Core
  fill(255);
  ellipse(soulX, soulY, 8);
  
  // Soul count text - on the same line as icon, to the right
  fill(255, 215, 0);
  textAlign(LEFT, CENTER);
  textSize(10);
  text('Souls: x' + collectedSouls.length, soulX + 20, soulY);
  
  pop();
}

// =============================================================================
// DIALOGUE SYSTEM FUNCTIONS
// =============================================================================

function startDialogue(npc) {
  gameState = 'dialogue';
  
  // Get dialogue from dialogues.js
  currentDialogue = getDialogue(npc.name);
  
  // Reset dialogue display
  dialogueBox.displayedText = '';
  dialogueBox.textIndex = 0;
  dialogueBox.fullText = currentDialogue.text;
  dialogueBox.selectedChoice = 0;
}

function drawDialogue() {
  // Draw world in background (dimmed)
  drawWorld();
  
  // Overlay
  fill(0, 0, 0, 150);
  rect(0, 0, width, height);
  
  // Draw dialogue box
  drawDialogueBox();
}

function drawDialogueBox() {
  let box = dialogueBox;
  
  // Reposition box for landscape canvas - bigger for options
  box.x = 50;
  box.y = height - 220;
  box.w = width - 100;
  box.h = 200;
  
  // Box background
  fill(20, 20, 40);
  stroke(255);
  strokeWeight(3);
  rect(box.x, box.y, box.w, box.h, 10);
  
  // Speaker name
  fill(255, 215, 0);
  noStroke();
  textAlign(LEFT, TOP);
  textSize(12);
  text(currentDialogue.speaker, box.x + box.padding, box.y + box.padding);
  
  // Animate text reveal
  if (box.textIndex < box.fullText.length) {
    box.textIndex += box.textSpeed;
    box.displayedText = box.fullText.substring(0, floor(box.textIndex));
  } else {
    box.displayedText = box.fullText;
  }
  
  // Dialogue text - increase height to show full text
  fill(255);
  textSize(11);
  text(box.displayedText, box.x + box.padding, box.y + box.padding + 30, box.w - box.padding * 2, 130);
  
  // Draw choices if text is fully displayed
  if (box.textIndex >= box.fullText.length && currentDialogue.choices && currentDialogue.choices.length > 0) {
    drawDialogueChoices();
  } else if (box.textIndex >= box.fullText.length) {
    // Show continue prompt when there are NO choices (response dialogue)
    fill(255, 255, 0, 150 + sin(frameCount * 0.1) * 105);
    textAlign(RIGHT, BOTTOM);
    textSize(9);
    text('Press E to exit', box.x + box.w - box.padding, box.y + box.h - box.padding);
  }
  
  // ESC to exit hint (top right of dialogue box)
  fill(200, 200, 200, 180);
  textAlign(RIGHT, TOP);
  textSize(8);
  text('ESC to exit', box.x + box.w - box.padding, box.y + box.padding);
}

function drawDialogueChoices() {
  let box = dialogueBox;
  let startY = box.y + 100;
  
  for (let i = 0; i < currentDialogue.choices.length; i++) {
    let choice = currentDialogue.choices[i];
    let y = startY + i * 25;
    
    // Highlight selected choice
    if (i === box.selectedChoice) {
      fill(255, 215, 0);
      text('>', box.x + box.padding, y);
    }
    
    // Color angry choices in red
    if (choice.isAngry) {
      fill(255, 50, 50); // Red for angry choice
    } else if (i === box.selectedChoice) {
      fill(255, 215, 0); // Yellow if selected
    } else {
      fill(200); // Default gray
    }
    
    text(choice.text, box.x + box.padding + 20, y);
  }
  
  // Instructions - bottom right of box
  fill(255, 255, 0, 150);
  textAlign(RIGHT, BOTTOM);
  textSize(8);
  text('↑↓ to select, ENTER to choose, ESC to exit', box.x + box.w - box.padding, box.y + box.h - box.padding);
}

function advanceDialogue() {
  // If text is still animating, complete it
  if (dialogueBox.textIndex < dialogueBox.fullText.length) {
    dialogueBox.textIndex = dialogueBox.fullText.length;
    return;
  }
  
  // If there are choices, handle selection
  if (currentDialogue && currentDialogue.choices && currentDialogue.choices.length > 0) {
    handleDialogueChoice(currentDialogue.choices[dialogueBox.selectedChoice]);
  } else {
    // No choices (response dialogue), check if swirl animation should trigger
    if (currentDialogue && currentDialogue.triggersSwirl) {
      startSwirlAnimation();
    } else {
      // Normal exit to exploring
      exitDialogue();
    }
  }
}

function handleDialogueChoice(choice) {
  // Get the NPC's response to this choice from the dialogue system
  if (choice.npc && choice.action) {
    currentDialogue = getDialogue(choice.npc, choice.action);
    
    // Check if this response triggers a swirl animation
    if (currentDialogue.triggersSwirl) {
      // Store the NPC for swirl animation
      for (let npc of npcs) {
        if (npc.name === choice.npc) {
          swirlAnimation.targetNPC = npc;
          break;
        }
      }
    }
    
    // Reset dialogue display for the new response
    dialogueBox.textIndex = 0;
    dialogueBox.fullText = currentDialogue.text;
    dialogueBox.displayedText = '';
    dialogueBox.selectedChoice = 0;
    
    // Since responses have no choices, pressing E/Enter will exit (or trigger swirl)
  } else {
    // Fallback: exit dialogue if choice is malformed
    exitDialogue();
  }
}

function exitDialogue() {
  gameState = 'exploring';
  currentDialogue = null;
  dialogueCooldown = 30; // 30 frames (~0.5 second cooldown)
}

// =============================================================================
// SWIRL ANIMATION FUNCTIONS
// =============================================================================

function startSwirlAnimation() {
  gameState = 'swirlAnimation';
  swirlAnimation.timer = 0;
  swirlAnimation.rotation = 0;
  swirlAnimation.scale = 1;
  currentDialogue = null; // Clear dialogue
}

function drawSwirlAnimation() {
  // Draw world in background (dimmed)
  updateCamera();
  background(55, 45, 75);
  
  push();
  translate(-cameraX, -cameraY);
  
  // Draw obstacles
  for (let obs of obstacles) {
    fill(80, 80, 80);
    stroke(255);
    strokeWeight(2);
    rect(obs.x, obs.y, obs.w, obs.h);
  }
  
  // Draw NPCs
  for (let npc of npcs) {
    npc.display();
  }
  
  // Draw player with swirl effect
  swirlAnimation.timer++;
  let progress = swirlAnimation.timer / swirlAnimation.duration;
  
  // Ease in cubic
  let easeProgress = progress * progress * progress;
  
  // Interpolate position from player to Echo
  if (swirlAnimation.targetNPC) {
    let startX = player.x;
    let startY = player.y;
    let endX = swirlAnimation.targetNPC.x;
    let endY = swirlAnimation.targetNPC.y;
    
    let currentX = lerp(startX, endX, easeProgress);
    let currentY = lerp(startY, endY, easeProgress);
    
    // Rotation increases rapidly
    swirlAnimation.rotation = progress * TWO_PI * 5; // 5 full rotations
    
    // Scale decreases as we get closer
    swirlAnimation.scale = lerp(1, 0.1, easeProgress);
    
    // Draw swirling cat
    push();
    translate(currentX, currentY);
    rotate(swirlAnimation.rotation);
    scale(swirlAnimation.scale);
    imageMode(CENTER);
    if (catImg) {
      image(catImg, 0, 0, player.displayW, player.displayH);
    } else {
      fill(150, 150, 150);
      ellipse(0, 0, player.displayW, player.displayH);
    }
    pop();
  }
  
  pop();
  
  // Check if animation is complete
  if (swirlAnimation.timer >= swirlAnimation.duration) {
    // Set which NPC's puzzle to load
    if (swirlAnimation.targetNPC) {
      currentPuzzleNPC = swirlAnimation.targetNPC.name;
    }
    initPuzzle();
    gameState = 'puzzle';
  }
}

// =============================================================================
// PUZZLE GAME FUNCTIONS (Credit Brian)
// =============================================================================

function initPuzzle() {
  // Initialize different puzzles based on which NPC triggered it
  if (currentPuzzleNPC === 'The Mind Wanderer') {
    initColorTilePuzzle();
  } else {
    initXOPuzzle();
  }
}

function initXOPuzzle() {
  const layout = [
    "NX#######",
    "#NXXN####",
    "#NNXN####",
    "#NXXNNN##",
    "NNN###X##",
    "NN####X##",
    "NX#######"
  ];

  puzzleGrid = [];
  for (let r = 0; r < PUZZLE_ROWS; r++) {
    let row = [];
    for (let c = 0; c < PUZZLE_COLS; c++) {
      const ch = layout[r][c] || "#";

      if (ch === "X") row.push({ type: "tile", symbol: "X" });
      else if (ch === "N") row.push({ type: "neutral" });
      else if (ch === "#") row.push({ type: "wall" });
      else row.push({ type: "empty" });
    }
    puzzleGrid.push(row);
  }

  puzzlePlayer = { r: 4, c: 0 }; // Start position
  puzzleComplete = false;
  essenceCollected = false; // Reset essence collection
  cageOpen = false; // Cage starts closed
  
  // Calculate centering offsets
  const puzzleWidth = PUZZLE_COLS * TILE_SIZE;
  const puzzleHeight = PUZZLE_ROWS * TILE_SIZE;
  puzzleOffsetX = (width - puzzleWidth) / 2;
  puzzleOffsetY = (height - puzzleHeight) / 2;
}

function initColorTilePuzzle() {
  // Color tile puzzle layout for The Mind Wanderer
  // P = Pink (safe), R = Red (wall), Y = Yellow (bounces back)
  // B = Blue (safe unless adjacent to yellow), S = Soul position
  const layout = [
    "RRRRRRRRRRRRR",
    "RPYBYBYYBBYYR",
    "RYYPYPYPPPPBR",
    "RPPBYPPYPYPPR",
    "RYPYPPPYPYPYR",
    "RYPPPYPPPBBPR",
    "RBYYPPBYBYPYR",
    "RYBPYPPPBYPPR",
    "RRRRRRRRRRRPS"
  ];

  puzzleGrid = [];
  for (let r = 0; r < COLOR_PUZZLE_ROWS; r++) {
    let row = [];
    for (let c = 0; c < COLOR_PUZZLE_COLS; c++) {
      const ch = layout[r][c] || "R";
      // S is just a pink tile where we'll draw the soul
      row.push({ type: ch === "S" ? "P" : ch });
    }
    puzzleGrid.push(row);
  }

  puzzlePlayer = { r: 3, c: 1 }; // Start position
  playerPrevPos = { r: 3, c: 1 };
  puzzleMessage = "Navigate the color maze! Reach the soul at the end!";
  puzzleComplete = false; // Will be set to true when reaching near the soul
  essenceCollected = false;
  wandererSoulCollected = false;
  wandererSoulPosition = { r: 8, c: 11 };
  
  // Calculate centering offsets for color puzzle
  const puzzleWidth = COLOR_PUZZLE_COLS * TILE_SIZE;
  const puzzleHeight = COLOR_PUZZLE_ROWS * TILE_SIZE;
  puzzleOffsetX = (width - puzzleWidth) / 2;
  puzzleOffsetY = (height - puzzleHeight) / 2;
}

function drawPuzzle() {
  background(25);
  
  // Draw different puzzles based on which NPC triggered it
  if (currentPuzzleNPC === 'The Mind Wanderer') {
    drawColorTilePuzzle();
  } else {
    drawXOPuzzle();
  }
}

function drawXOPuzzle() {
  drawPuzzleGrid();

  // Check if puzzle is complete (all X's turned to O's)
  if (!puzzleComplete && checkPuzzleSolved()) {
    puzzleComplete = true;
    cageOpen = true;
    
    // Open the cage by removing N tiles and walls that block the essence
    for (let r = 0; r < PUZZLE_ROWS; r++) {
      for (let c = 0; c < PUZZLE_COLS; c++) {
        if (puzzleGrid[r][c].type === "neutral") {
          puzzleGrid[r][c].type = "empty"; // Remove neutral tiles
        }
        // Open path to essence
        if (c >= 6 && r === 3) {
          puzzleGrid[r][c].type = "empty"; // Clear path to essence
        }
      }
    }
  }
  
  // Return to exploring after collecting essence
  if (essenceCollected) {
    // Add Echo's soul to collected souls
    if (!collectedSouls.includes('Echo')) {
      collectedSouls.push('Echo');
    }
    echoIsStatue = true; // Turn Echo into a statue
    
    // Move player away from the statue to avoid being stuck
    for (let npc of npcs) {
      if (npc.name === 'Echo') {
        // Move player 100 pixels away from the statue
        player.x = npc.x + 100;
        player.y = npc.y + 100;
        break;
      }
    }
    
    gameState = 'exploring';
    dialogueCooldown = 30;
    currentPuzzleNPC = null; // Reset
  }
}

function drawColorTilePuzzle() {
  // Draw the color tile grid
  push();
  translate(puzzleOffsetX, puzzleOffsetY);
  
  textAlign(CENTER, CENTER);
  textSize(26);
  
  for (let r = 0; r < COLOR_PUZZLE_ROWS; r++) {
    for (let c = 0; c < COLOR_PUZZLE_COLS; c++) {
      const cell = puzzleGrid[r][c];
      const x = c * TILE_SIZE;
      const y = r * TILE_SIZE;
      
      // Improved color scheme - more intuitive
      noStroke();
      if (cell.type === "R") {
        // Red - wall (darker, more solid looking)
        fill(140, 30, 30);
        rect(x, y, TILE_SIZE, TILE_SIZE);
        // Add texture
        stroke(100, 20, 20);
        strokeWeight(1);
        line(x, y + TILE_SIZE/3, x + TILE_SIZE, y + TILE_SIZE/3);
        line(x, y + 2*TILE_SIZE/3, x + TILE_SIZE, y + 2*TILE_SIZE/3);
      }
      else if (cell.type === "Y") {
        // Yellow - bounce (bright warning color)
        fill(255, 200, 0);
        rect(x, y, TILE_SIZE, TILE_SIZE);
        // Add warning pattern
        stroke(230, 170, 0);
        strokeWeight(2);
        noFill();
        rect(x + 5, y + 5, TILE_SIZE - 10, TILE_SIZE - 10);
      }
      else if (cell.type === "B") {
        // Blue - conditional danger (electric blue)
        fill(30, 130, 255);
        rect(x, y, TILE_SIZE, TILE_SIZE);
        // Add glow effect
        noStroke();
        fill(70, 160, 255, 100);
        rect(x + 10, y + 10, TILE_SIZE - 20, TILE_SIZE - 20);
      }
      else {
        // Pink - safe (soft, inviting color)
        fill(230, 200, 220);
        rect(x, y, TILE_SIZE, TILE_SIZE);
      }
    }
  }
  
  // Draw Wanderer's Soul (always visible once you reach the end area)
  if (!wandererSoulCollected) {
    const soulX = wandererSoulPosition.c * TILE_SIZE + TILE_SIZE / 2;
    const soulY = wandererSoulPosition.r * TILE_SIZE + TILE_SIZE / 2;
    
    // Glowing soul effect (purple/lavender for Mind Wanderer)
    push();
    // Outer glow
    fill(180, 120, 255, 100 + sin(frameCount * 0.1) * 50);
    noStroke();
    ellipse(soulX, soulY, TILE_SIZE * 0.9);
    // Middle glow
    fill(200, 150, 255, 200 + sin(frameCount * 0.15) * 55);
    ellipse(soulX, soulY, TILE_SIZE * 0.65);
    // Inner soul
    fill(220, 180, 255);
    ellipse(soulX, soulY, TILE_SIZE * 0.4);
    // Core spark
    fill(255);
    ellipse(soulX, soulY, TILE_SIZE * 0.15);
    
    // Label "Wanderer's Soul"
    fill(200, 150, 255);
    textAlign(CENTER, CENTER);
    textSize(10);
    text("Wanderer's Soul", soulX, soulY + TILE_SIZE * 0.7);
    pop();
  }
  
  // Draw player cat on top
  const playerX = puzzlePlayer.c * TILE_SIZE + TILE_SIZE / 2;
  const playerY = puzzlePlayer.r * TILE_SIZE + TILE_SIZE / 2;
  imageMode(CENTER);
  if (catImg) {
    image(catImg, playerX, playerY, TILE_SIZE * 0.7, TILE_SIZE * 0.7);
  } else {
    fill(255, 180, 50);
    stroke(255);
    strokeWeight(2);
    ellipse(playerX, playerY, TILE_SIZE * 0.5);
  }
  
  pop();
  
  // Display message
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(14);
  text(puzzleMessage, width / 2, height - 40);
  
  // Return to exploring after collecting soul
  if (wandererSoulCollected && !essenceCollected) {
    essenceCollected = true;
    collectedSouls.push('The Mind Wanderer');
    wandererIsStatue = true; // Turn Mind Wanderer into a statue
    
    // Move player away from the statue to avoid being stuck
    for (let npc of npcs) {
      if (npc.name === 'The Mind Wanderer') {
        // Move player 100 pixels away from the statue
        player.x = npc.x + 100;
        player.y = npc.y + 100;
        break;
      }
    }
    
    gameState = 'exploring';
    dialogueCooldown = 30;
    currentPuzzleNPC = null; // Reset
  }
}

function drawPuzzleGrid() {
  push();
  translate(puzzleOffsetX, puzzleOffsetY); // Center the puzzle
  
  textAlign(CENTER, CENTER);
  textSize(26);

  for (let r = 0; r < PUZZLE_ROWS; r++) {
    for (let c = 0; c < PUZZLE_COLS; c++) {
      const cell = puzzleGrid[r][c];
      const x = c * TILE_SIZE;
      const y = r * TILE_SIZE;

      if (cell.type === "wall") {
        fill(80, 80, 100);
        rect(x, y, TILE_SIZE, TILE_SIZE);
      } else if (cell.type === "tile") {
        fill(r === puzzlePlayer.r && c === puzzlePlayer.c ? 90 : 60);
        stroke(255);
        strokeWeight(2);
        rect(x, y, TILE_SIZE, TILE_SIZE);
        fill(255);
        text(cell.symbol, x + TILE_SIZE / 2, y + TILE_SIZE / 2);
      } else if (cell.type === "neutral") {
        // Bright green/lime for maximum visibility
        if (r === puzzlePlayer.r && c === puzzlePlayer.c) {
          fill(120, 255, 120); // Very bright green when player is on it
        } else {
          fill(80, 220, 100); // Bright lime green for empty neutral tiles
        }
        stroke(200, 255, 200); // Light green border
        strokeWeight(3);
        rect(x, y, TILE_SIZE, TILE_SIZE);
      } else {
        fill(25);
        rect(x, y, TILE_SIZE, TILE_SIZE);
      }
    }
  }
  
  // Draw Echo's Essence if cage is open and not collected
  if (cageOpen && !essenceCollected) {
    const essenceX = essencePosition.c * TILE_SIZE + TILE_SIZE / 2;
    const essenceY = essencePosition.r * TILE_SIZE + TILE_SIZE / 2;
    
    // Glowing essence effect
    push();
    // Outer glow
    fill(100, 200, 255, 100 + sin(frameCount * 0.1) * 50);
    noStroke();
    ellipse(essenceX, essenceY, TILE_SIZE * 0.9);
    // Middle glow
    fill(150, 230, 255, 200 + sin(frameCount * 0.15) * 55);
    ellipse(essenceX, essenceY, TILE_SIZE * 0.65);
    // Inner essence
    fill(200, 240, 255);
    ellipse(essenceX, essenceY, TILE_SIZE * 0.4);
    // Core spark
    fill(255);
    ellipse(essenceX, essenceY, TILE_SIZE * 0.15);
    
    // Label "Echo's Essence"
    fill(150, 230, 255);
    textAlign(CENTER, CENTER);
    textSize(10);
    text("Echo's Essence", essenceX, essenceY + TILE_SIZE * 0.7);
    pop();
  }
  
  // Draw player cat on top of the grid
  const playerX = puzzlePlayer.c * TILE_SIZE + TILE_SIZE / 2;
  const playerY = puzzlePlayer.r * TILE_SIZE + TILE_SIZE / 2;
  imageMode(CENTER);
  if (catImg) {
    // Draw the cat gif at player position
    image(catImg, playerX, playerY, TILE_SIZE * 0.8, TILE_SIZE * 0.8);
  } else {
    // Fallback if image doesn't load
    fill(255, 180, 50);
    stroke(255);
    strokeWeight(2);
    ellipse(playerX, playerY, TILE_SIZE * 0.6);
  }
  
  pop();
}

function handlePuzzleInput() {
  if (essenceCollected) {
    // Essence collected, will auto-return in drawPuzzle
    return;
  }

  // Handle different puzzle types
  if (currentPuzzleNPC === 'The Mind Wanderer') {
    handleColorTileInput();
  } else {
    handleXOPuzzleInput();
  }
}

function handleXOPuzzleInput() {
  let dr = 0, dc = 0;
  if (key === "w" || key === "W") dr = -1;
  if (key === "s" || key === "S") dr = 1;
  if (key === "a" || key === "A") dc = -1;
  if (key === "d" || key === "D") dc = 1;

  const newR = puzzlePlayer.r + dr;
  const newC = puzzlePlayer.c + dc;

  // Check walkability based on whether cage is open
  if (cageOpen) {
    // Cage is open - can walk on empty spaces too (to reach essence)
    if (!isPuzzleWalkableOpen(newR, newC)) return;
  } else {
    // Cage is closed - only walk on tiles and neutral spaces
    if (!isPuzzleWalkable(newR, newC)) return;
  }

  puzzlePlayer.r = newR;
  puzzlePlayer.c = newC;

  // Check if player collected the essence
  if (cageOpen && !essenceCollected && puzzlePlayer.r === essencePosition.r && puzzlePlayer.c === essencePosition.c) {
    essenceCollected = true;
  }

  // Only toggle tiles if cage is not open yet
  if (!cageOpen) {
    const cell = puzzleGrid[newR][newC];
    if (cell.type === "tile") togglePuzzleTile(newR, newC);
  }
}

function handleColorTileInput() {
  if (puzzleComplete) return;

  let dr = 0, dc = 0;
  if (key === "w" || key === "W") dr = -1;
  if (key === "s" || key === "S") dr = 1;
  if (key === "a" || key === "A") dc = -1;
  if (key === "d" || key === "D") dc = 1;

  const newR = puzzlePlayer.r + dr;
  const newC = puzzlePlayer.c + dc;

  // Check if in bounds
  if (newR < 0 || newR >= COLOR_PUZZLE_ROWS || newC < 0 || newC >= COLOR_PUZZLE_COLS) return;

  const target = puzzleGrid[newR][newC];

  // Red tile = wall
  if (target.type === "R") {
    puzzleMessage = "Can't go through red tiles!";
    return;
  }

  // Move player
  playerPrevPos.r = puzzlePlayer.r;
  playerPrevPos.c = puzzlePlayer.c;
  puzzlePlayer.r = newR;
  puzzlePlayer.c = newC;

  handleColorTileEffect(target);
}

function handleColorTileEffect(tile) {
  puzzleMessage = "";

  // Yellow = bounce back
  if (tile.type === "Y") {
    puzzleMessage = "Bounced off yellow tile!";
    puzzlePlayer.r = playerPrevPos.r;
    puzzlePlayer.c = playerPrevPos.c;
    return;
  }

  // Blue = check adjacency to yellow
  if (tile.type === "B") {
    if (isAdjacentToYellow(puzzlePlayer.r, puzzlePlayer.c)) {
      puzzleMessage = "Blue tile zapped you!";
      puzzlePlayer.r = playerPrevPos.r;
      puzzlePlayer.c = playerPrevPos.c;
      return;
    } else {
      puzzleMessage = "Safe on blue tile.";
    }
  }

  // Pink = safe
  if (tile.type === "P") {
    puzzleMessage = "Safe on the path.";
    
    // Check if player reached the soul position
    if (!wandererSoulCollected && 
        puzzlePlayer.r === wandererSoulPosition.r && 
        puzzlePlayer.c === wandererSoulPosition.c) {
      wandererSoulCollected = true;
      puzzleComplete = true;
      puzzleMessage = "Collected the Wanderer's Soul!";
    }
  }
}

function isAdjacentToYellow(r, c) {
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (let [dr, dc] of dirs) {
    const nr = r + dr, nc = c + dc;
    if (nr >= 0 && nr < COLOR_PUZZLE_ROWS && nc >= 0 && nc < COLOR_PUZZLE_COLS) {
      if (puzzleGrid[nr][nc].type === "Y") return true;
    }
  }
  return false;
}

function isPuzzleWalkable(r, c) {
  if (r < 0 || r >= PUZZLE_ROWS || c < 0 || c >= PUZZLE_COLS) return false;
  return puzzleGrid[r][c].type === "tile" || puzzleGrid[r][c].type === "neutral";
}

function isPuzzleWalkableOpen(r, c) {
  // When cage is open, can walk on tiles, neutral, AND empty spaces (but not walls)
  if (r < 0 || r >= PUZZLE_ROWS || c < 0 || c >= PUZZLE_COLS) return false;
  return puzzleGrid[r][c].type !== "wall";
}

function togglePuzzleTile(r, c) {
  const cell = puzzleGrid[r][c];
  if (cell.type === "tile") {
    cell.symbol = cell.symbol === "X" ? "O" : "X";
  }
}

function checkPuzzleSolved() {
  for (let r = 0; r < PUZZLE_ROWS; r++) {
    for (let c = 0; c < PUZZLE_COLS; c++) {
      const cell = puzzleGrid[r][c];
      if (cell.type === "tile" && cell.symbol !== "O") return false;
    }
  }
  return true;
}

// =============================================================================
// PLAYER CLASS
// =============================================================================

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.displayW = 50;
    this.displayH = 50;
    // Hitbox is 60% of width for tighter collisions
    this.hitboxW = this.displayW * 0.6;
    this.hitboxH = this.displayH;
    this.speed = 4;
    // Dash properties
    this.canDash = true;
    this.isDashing = false;
    this.dashSpeed = 12;
    this.dashDuration = 0;
    this.dashCooldown = 0; // Cooldown timer (2 seconds = 120 frames)
    this.dashCooldownMax = 15; // 2 seconds at 60fps
    this.dashVx = 0;
    this.dashVy = 0;
  }
  
  update() {
    if (gameState !== 'exploring') return;
    
    // Update dash cooldown
    if (this.dashCooldown > 0) {
      this.dashCooldown--;
      if (this.dashCooldown === 0) {
        this.canDash = true;
      }
    }
    
    // Store previous position for collision resolution
    let prevX = this.x;
    let prevY = this.y;
    
    // Handle movement and dashing
    if (!this.isDashing) {
      // Normal movement
      if (keyIsDown(65)) { // A
        this.x -= this.speed;
      }
      if (keyIsDown(68)) { // D
        this.x += this.speed;
      }
      if (keyIsDown(87)) { // W
        this.y -= this.speed;
      }
      if (keyIsDown(83)) { // S
        this.y += this.speed;
      }
    } else {
      // Dashing - create trail every few frames
      if (frameCount % 2 === 0) {
        dashTrail.push(new DashAfterimage(this.x, this.y, this.displayW, this.displayH));
      }
      
      // Apply dash velocity
      this.x += this.dashVx;
      this.y += this.dashVy;
      
      this.dashDuration--;
      if (this.dashDuration <= 0) {
        this.isDashing = false;
        this.dashVx = 0;
        this.dashVy = 0;
        // Start cooldown timer
        this.dashCooldown = this.dashCooldownMax;
        this.canDash = false;
      }
    }
    
    // Check collision with obstacles and statues
    let collidables = getCollidableObjects();
    for (let obs of collidables) {
      if (this.collidesWith(obs)) {
        // Resolve collision by moving back
        this.x = prevX;
        this.y = prevY;
        if (this.isDashing) {
          this.isDashing = false;
          this.dashVx = 0;
          this.dashVy = 0;
          // Start cooldown timer even when hitting obstacle
          this.dashCooldown = this.dashCooldownMax;
          this.canDash = false;
        }
        break;
      }
    }
    
    // Keep player in world bounds
    this.x = constrain(this.x, this.displayW / 2, WORLD_WIDTH - this.displayW / 2);
    this.y = constrain(this.y, this.displayH / 2, WORLD_HEIGHT - this.displayH / 2);
  }
  
  dash(dx, dy) {
    if (this.canDash && (dx !== 0 || dy !== 0)) {
      playDashSound();
      this.isDashing = true;
      this.dashDuration = 10;
      this.canDash = false;
      
      // Store dash velocity to apply during update
      // Normalize direction
      let mag = sqrt(dx * dx + dy * dy);
      this.dashVx = (dx / mag) * this.dashSpeed;
      this.dashVy = (dy / mag) * this.dashSpeed;
    }
  }
  
  collidesWith(obstacle) {
    // Simple AABB collision detection using hitbox (not display size)
    let playerLeft = this.x - this.hitboxW / 2;
    let playerRight = this.x + this.hitboxW / 2;
    let playerTop = this.y - this.hitboxH / 2;
    let playerBottom = this.y + this.hitboxH / 2;
    
    let obsLeft = obstacle.x;
    let obsRight = obstacle.x + obstacle.w;
    let obsTop = obstacle.y;
    let obsBottom = obstacle.y + obstacle.h;
    
    return !(playerRight < obsLeft || 
             playerLeft > obsRight || 
             playerBottom < obsTop || 
             playerTop > obsBottom);
  }
  
  display() {
    push();
    imageMode(CENTER);
    
    if (catImg) {
      image(catImg, this.x, this.y, this.displayW, this.displayH);
    } else {
      // Fallback: gray circle
      fill(150, 150, 150);
      stroke(255);
      strokeWeight(2);
      ellipse(this.x, this.y, this.displayW, this.displayH);
    }
    
    pop();
  }
}

// =============================================================================
// DASH AFTERIMAGE CLASS
// =============================================================================

class DashAfterimage {
  constructor(x, y, displayW, displayH) {
    this.x = x;
    this.y = y;
    this.displayW = displayW;
    this.displayH = displayH;
    this.life = 15; // Frames until it disappears
    this.maxLife = 15;
  }
  
  display() {
    if (catImg) {
      push();
      imageMode(CENTER);
      
      // Calculate fading alpha based on remaining life
      let alpha = map(this.life, 0, this.maxLife, 0, 230);
      
      // Blue tint that fades out
      tint(100, 180, 255, alpha);
      image(catImg, this.x, this.y, this.displayW, this.displayH);
      
      pop();
    }
  }
}

// =============================================================================
// NPC CLASS
// =============================================================================

class NPC {
  constructor(x, y, name) {
    this.x = x;
    this.y = y;
    this.name = name;
    this.w = 60;
    this.h = 60;
    this.color = this.getColorByName();
  }
  
  getColorByName() {
    // Cooler colors that work well with purple background
    if (this.name === 'The Mind Wanderer') return [180, 120, 255]; // Lavender purple
    if (this.name === 'Echo') return [100, 255, 200]; // Mint teal
    if (this.name === 'Dream Guardian') return [255, 180, 255]; // Pink magenta
    return [200, 200, 200];
  }
  
  display() {
    this.displaySprite();
    this.displayLabel();
  }
  
  displaySprite() {
    push();
    
    // Check if this NPC has been turned to stone
    let isStatue = (this.name === 'Echo' && echoIsStatue) || 
                   (this.name === 'The Mind Wanderer' && wandererIsStatue);
    
    // Display NPC or statue sprite
    if (isStatue) {
      // Statue appearance
      if (this.name === 'Echo' && echoStatueImg) {
        // Echo statue: static grayscale version
        imageMode(CENTER);
        image(echoStatueImg, this.x, this.y, this.w, this.h);
      } else {
        // Other NPCs as rectangles when statues
        fill(120, 120, 130);
        stroke(180, 180, 190);
        strokeWeight(3);
        rectMode(CENTER);
        rect(this.x, this.y, this.w, this.h);
        
        // Stone texture lines
        stroke(100, 100, 110);
        strokeWeight(1);
        line(this.x - this.w/4, this.y - this.h/3, this.x + this.w/4, this.y - this.h/3);
        line(this.x - this.w/3, this.y, this.x + this.w/3, this.y);
        line(this.x - this.w/4, this.y + this.h/3, this.x + this.w/4, this.y + this.h/3);
      }
    } else {
      // Normal NPC appearance
      if (this.name === 'Echo' && echoImg) {
        // Use echo.gif for Echo
        imageMode(CENTER);
        image(echoImg, this.x, this.y, this.w, this.h);
      } else {
        // Other NPCs remain as colored rectangles
        fill(this.color[0], this.color[1], this.color[2]);
        stroke(255);
        strokeWeight(3);
        rectMode(CENTER);
        rect(this.x, this.y, this.w, this.h);
      }
    }
    
    pop();
  }
  
  displayLabel() {
    push();
    
    // Check if this NPC has been turned to stone
    let isStatue = (this.name === 'Echo' && echoIsStatue) || 
                   (this.name === 'The Mind Wanderer' && wandererIsStatue);
    
    // Name label
    fill(isStatue ? 150 : 255);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(12);
    
    // Show statue label if turned to stone
    if (isStatue) {
      if (this.name === 'Echo') {
        text('Echo (Statue)', this.x, this.y + this.h / 2 + 20);
      } else if (this.name === 'The Mind Wanderer') {
        text('Wanderer (Statue)', this.x, this.y + this.h / 2 + 20);
      }
    } else {
      text(this.name, this.x, this.y + this.h / 2 + 20);
    }
    
    pop();
  }
}

// =============================================================================
// HTML BUTTON FUNCTIONS
// =============================================================================

function setupButtons() {
  // Sound toggle
  document.getElementById('sound-toggle').addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    document.getElementById('sound-toggle').textContent = soundEnabled ? 'Sound: ON' : 'Sound: OFF';
  });
  
  // Restart button
  document.getElementById('restart-btn').addEventListener('click', () => {
    gameState = 'intro';
    introSceneIndex = 0;
    introTimer = 0;
    fallingCatY = -100;
    fallingCatRotation = 0;
    echoIsStatue = false;
    wandererIsStatue = false;
    currentPuzzleNPC = null;
    collectedSouls = [];
    soulDisplayTimer = 0;
    currentSoulDisplay = 0;
    initWorld();
  });
}

// =============================================================================
// DASH INPUT FUNCTION
// =============================================================================

function checkDash() {
  if (gameState === 'exploring' && keyIsDown(SHIFT)) {
    let dx = 0;
    let dy = 0;
    
    // Check horizontal direction
    if (keyIsDown(65)) { // A (left)
      dx = -1;
    }
    if (keyIsDown(68)) { // D (right)
      dx = 1;
    }
    
    // Check vertical direction
    if (keyIsDown(87)) { // W (up)
      dy = -1;
    }
    if (keyIsDown(83)) { // S (down)
      dy = 1;
    }
    
    // Only dash if there's a direction and player can dash
    if ((dx !== 0 || dy !== 0) && player.canDash && !player.isDashing) {
      player.dash(dx, dy);
    }
  }
}

// =============================================================================
// AUDIO FUNCTIONS
// =============================================================================

function playDashSound() {
  if (!soundEnabled) return;
  if (wooshSound && wooshSound.isLoaded()) {
    // Start playing from 5ms (0.005 seconds) to trim the beginning
    wooshSound.play(0, 1, 1, 0.2);
  } else {
    // Fallback to oscillator
    dashSound.freq(200);
    dashSound.amp(0.15);
    dashSound.start();
    setTimeout(() => dashSound.stop(), 150);
  }
}

