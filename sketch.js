// =============================================================================
// MADELINE'S DREAMSCAPE - Main Game File
// =============================================================================

/*
FUNCTION INDEX:
- preload() - Loads all game assets (images, sounds, fonts)
- setup() - Initializes game, creates canvas, sets up audio and world
- draw() - Main game loop, handles different game states
- keyPressed() - Handles keyboard input for all game states
- mousePressed() - Handles mouse clicks (start button)

START SCREEN:
- drawStartScreen() - Displays start screen with "START GAME" button

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
- switchMusic() - Switches background music based on game state and area

HTML BUTTONS:
- setupButtons() - Sets up HTML button event listeners
- checkDash() - Handles dash input with Shift+Direction keys
*/

// =============================================================================
// GAME STATE MANAGEMENT
// =============================================================================

let gameState = 'startScreen'; // 'startScreen', 'intro', 'exploring', 'dialogue', 'swirlAnimation', 'puzzle', 'endingCutscene'
let currentArea = 'mansion'; // 'mansion', 'room1', 'room2', 'room3', 'fullWorld'
let previousArea = ''; // Track where player came from
let showDebug = false; // Set to true to show debug overlay (position, area, etc.)

// Ending cutscene variables
let endingCutscenePhase = 0; // 0: jump out, 1: spirit moves, 2: fade, 3: text, 4: restart button
let endingCutsceneTimer = 0;
let madelinesSpiritX = 0;
let madelinesSpiritY = 0;
let fadeToPurpleAlpha = 0;
let showRestartButton = false;

// Cage opening animation
let cageOpening = false;
let cageOpeningProgress = 0; // 0 to 1, bars moving down

// =============================================================================
// PLAYER & MOVEMENT
// =============================================================================

let player;
let catImg;
let madelineImg;
let echoImg;
let echoStatueImg; // Static grayscale version for statue
let dreamGuardianGif; // Dream Guardian animated gif
let sorrowGif; // Sorrow animated gif
let sorrowStatueImg; // Static grayscale version of Sorrow for statue
let greedKingGif; // King of Greed animated gif
let greedKingStatueImg; // Static grayscale version for statue
let guardianStatueImg; // Static grayscale version of Dream Guardian for statue
let rathImg; // Rath animated gif
let sansImg; // Sans sprite
let ghostImg; // Ghost sprite for tower enemies
let coinImg; // Coin sprite for tower collectibles
let keyImg; // Key icon for UI
let dashTrail = [];
let pixelFont;

// =============================================================================
// WORLD & ENVIRONMENT
// =============================================================================

let cameraX = 0;
let cameraY = 0;
let npcs = [];
let obstacles = [];
let decorations = []; // Non-collidable decorative objects
let backgroundDecorations = []; // Background objects drawn behind player (no collision)
let doors = []; // Interactive door objects for area transitions
let hasGhostPepper = false; // Unlocks dash ability
let hasCabinKey = false;
let cabinUnlocked = false; // Permanent flag for when cabin is unlocked with key // Unlocks Sorrow's cabin
let guardianIntroComplete = false; // Tracks if guardian intro animation is done
let guardianIntroTimer = 0; // Timer for guardian intro animation
let guardianShouldWalkBack = false; // Flag to trigger walk-back animation after dialogue
let door2Unlocked = false; // Tracks if Door 2 has been unlocked by Guardian
let floorPatternCache = null; // Cached floor pattern for performance

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
let jumpCatY = 700; // Start below screen (for catJump animation)
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
// PUZZLE GAME (XO Puzzle for Echo, Color Tile for Sorrow)
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
let wandererIsStatue = false; // Track if Sorrow has been turned into a statue
let greedKingIsStatue = false;
let guardianIsStatue = false; // Dream Guardian becomes statue after giving soul // Track if King of Greed has been turned into a statue
let cageOpen = false; // Track if the cage borders have opened
let currentPuzzleNPC = null; // Track which NPC's puzzle is active
let escapeRoomCompleted = false; // Track if Room 1 escape puzzle has been completed

// Soul collection system
let collectedSouls = []; // Array to store collected souls ["Echo", "Sorrow", etc.]
let soulDisplayTimer = 0;
let currentSoulDisplay = 0;

// Global lives system (shared across all minigames)
let globalLives = 9;
let maxLives = 9;

// Lava lake variables
let lavaStones = []; // Stepping stones across lava
let lavaRespawnPoint = { x: 0, y: 0 }; // Where player respawns if they fall in lava
let hasRathSoul = false; // Track if Rath's soul is collected
let lavaFallAnimation = false; // Is player falling into lava?
let lavaFallProgress = 0; // Animation progress (0 to 1)
let lavaFallStartX = 0; // Where fall started
let lavaFallStartY = 0; // Where fall started
let lavaSmoke = []; // Smoke particles

// Piano puzzle variables (Rath's cave)
let pianoInputSeq = [];
let pianoCorrectSeq = [
  "E3", "D3", "C3", "D3", "E3", "E3", "E3",
  "D3", "D3", "D3", "E3", "G3", "G3",
  "E3", "D3", "C3", "D3", "E3", "E3", "E3",
  "D3", "D3", "E3", "D3", "C3"
];
let pianoMessage = "";
let pianoMessageTimer = 0;
let pianoSounds = {}; // Will load piano sounds

// Escape Room puzzle variables (Room 1)
let escapeRoomState = "idle"; // idle, playing, completed
let escapeHasKey = false;
let escapeDoorUnlocked = false;
let escapeHasGem = false;
let escapeChestOpened = false;
let escapeHint = "";
let escapeMessage = "";
let escapeMessageTimer = 0;
let escapeCode = "";
let escapeStartTime = 0;
let escapeInputBox = null;
let escapeSubmitButton = null;
let escapeRoomImg, escapeDoorImg, escapeDrawerImg, escapeChestImg, escapeOpenChestImg;
let escapeBedImg, escapeCarpetImg, escapePaintingImg, escapeTableImg, escapeCrystalImg, escapeMirrorImg;
let escapeSfxDrawer, escapeSfxCloth, escapeSfxKey;
const ESCAPE_INTERACT_RADIUS = 80;
const ESCAPE_FLOOR_Y = 490; // Floor at bottom of screen
const escapeObjects = {
  drawer:   { name: "Drawer",  x: 50,  y: 390, w: 150, h: 100, hitboxX: 50, hitboxY: 390, hitboxH: 15, hitboxW: 150, interact: true, platform: true },
  painting: { name: "Painting", x: 100, y: 220, w: 170, h: 120, interact: true, platform: false },
  chest:    { name: "Chest",   x: 180, y: 365, w: 125, h: 125, hitboxX: 180, hitboxY: 375, hitboxH: 15, hitboxW: 125, interact: true, platform: true },
  bed:      { name: "Bed",     x: 300, y: 330, w: 200, h: 160, hitboxY: 360, hitboxX: 300, hitboxW: 200, hitboxH: 15, interact: true, platform: true },
  carpet:   { name: "Carpet",  x: 250, y: 440, w: 180, h: 110, interact: true, platform: false },
  table:    { name: "Table",   x: 525, y: 320, w: 130, h: 170, hitboxX: 525, hitboxY: 345, hitboxW: 130, hitboxH: 15, interact: true, platform: true },
  crystalball: { name: "Crystal Ball", x: 550, y: 300, w: 80, h: 80, interact: true, platform: false },
  mirror:   { name: "Magic Mirror", x: 540, y: 200, w: 110, h: 105, interact: true, platform: false },
  door:     { name: "Door",    x: 645, y: 290, w: 165, h: 200, interact: true, platform: false },
};
let escapePlatformRects = [];

// Tower climbing game variables (King of Greed's tower)
let towerLevel = 1; // Current floor (1-6)
let towerPlatforms = [];
let towerEnemies = [];
let towerCollectibles = [];
let towerCoinsCollected = 0;
let hasGreedSoul = false; // Has collected the Soul of Greed
let towerLadderActive = false; // Ladder appears after collecting soul

// Color Tile Puzzle specific variables
const COLOR_PUZZLE_ROWS = 9;
const COLOR_PUZZLE_COLS = 13;
let puzzleMessage = "";
let playerPrevPos = { r: 0, c: 0 }; // For bounce back mechanic
let wandererSoulPosition = { r: 8, c: 11 }; // Position of Wanderer's Soul (at goal)
let wandererSoulCollected = false;
let smellsLikeOranges = false; // Player state from orange tiles
let isSliding = false; // Player is sliding on purple tiles
let slideDirection = { r: 0, c: 0 }; // Direction of slide

// Multi-level puzzle system
let currentPuzzleLevel = 1; // 1, 2, or 3
let puzzleLevelGoals = []; // Goals for each level

// Lives system (now using globalLives)

// =============================================================================
// AUDIO
// =============================================================================

let soundEnabled = true;
let dashSound;
let wooshSound;
let dreamscapeMusic;
let mansionMusic;
let currentMusic = null; // Track currently playing music
let doorLockSound; // Sound for locked door
let doorUnlockSound; // Sound for unlocking door
let hurtSound; // Sound for taking damage

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
  catImg = loadImage('assets/ectopaw.gif');
  
  // Load Madeline sleeping image
  madelineImg = loadImage('assets/l-intro-1604702252.jpg');
  
  // Load Echo sprite
  echoImg = loadImage('assets/echo.gif');
  
  // Load Dream Guardian sprite
  dreamGuardianGif = loadImage('assets/dreamguardian.gif');
  
  // Load Sorrow sprite
  sorrowGif = loadImage('assets/sorrow.gif');
  
  // Load King of Greed sprite
  greedKingGif = loadImage('assets/greedking.gif');
  
  // Load Rath sprite
  rathImg = loadImage('assets/rath.gif');
  
  // Load Sans sprite
  sansImg = loadImage('assets/sans.png');
  
  // Load ghost sprite for tower
  ghostImg = loadImage('assets/myghost.gif');
  
  // Load coin sprite for tower
  coinImg = loadImage('assets/goldcoinpixel.png');
  
  // Load key icon for UI
  keyImg = loadImage('assets/key.png');
  
  // Load woosh sound effect
  wooshSound = loadSound('assets/Woosh Effect 5.wav');
  
  // Load background music
  dreamscapeMusic = loadSound('assets/dreamscape.mp3');
  mansionMusic = loadSound('assets/mansion.mp3');
  
  // Load door sounds
  doorLockSound = loadSound('assets/doorlock.mp3');
  doorUnlockSound = loadSound('assets/doorunlock.mp3');
  
  // Load hurt sound
  hurtSound = loadSound('assets/hurt.mp3');
  
  // Load escape room assets
  escapeRoomImg = loadImage('escaperoom_puzzle/images/room.png');
  escapeDoorImg = loadImage('escaperoom_puzzle/images/door.png');
  escapeDrawerImg = loadImage('escaperoom_puzzle/images/drawer.png');
  escapeChestImg = loadImage('escaperoom_puzzle/images/chest.png');
  escapeOpenChestImg = loadImage('escaperoom_puzzle/images/openchest.png');
  escapeBedImg = loadImage('escaperoom_puzzle/images/bed.png');
  escapeCarpetImg = loadImage('escaperoom_puzzle/images/carpet.png');
  escapePaintingImg = loadImage('escaperoom_puzzle/images/painting.png');
  escapeTableImg = loadImage('escaperoom_puzzle/images/table.png');
  escapeCrystalImg = loadImage('escaperoom_puzzle/images/crystalball.png');
  escapeMirrorImg = loadImage('escaperoom_puzzle/images/magicmirror.png');
  escapeSfxDrawer = loadSound('escaperoom_puzzle/sounds/drawer.mp3');
  escapeSfxCloth = loadSound('escaperoom_puzzle/sounds/cloth.mp3');
  escapeSfxKey = loadSound('escaperoom_puzzle/sounds/key.mp3');
  
  // Load piano sounds for Rath's puzzle
  // Using simple tones - these would be replaced with actual piano samples
  pianoSounds.C3 = new Tone(261.63); // C
  pianoSounds.D3 = new Tone(293.66); // D
  pianoSounds.E3 = new Tone(329.63); // E
  pianoSounds.G3 = new Tone(392.00); // G
  
  // Load pixel font
  pixelFont = loadFont('assets/PressStart2P.ttf');
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
  
  // Create grayscale statue version of King of Greed
  if (greedKingGif) {
    greedKingStatueImg = createImage(greedKingGif.width, greedKingGif.height);
    greedKingStatueImg.copy(greedKingGif, 0, 0, greedKingGif.width, greedKingGif.height, 0, 0, greedKingGif.width, greedKingGif.height);
    greedKingStatueImg.filter(GRAY); // Convert to grayscale
    greedKingStatueImg.loadPixels();
    // Brighten the grayscale image to look more like stone
    for (let i = 0; i < greedKingStatueImg.pixels.length; i += 4) {
      greedKingStatueImg.pixels[i] *= 0.85;     // R - keep more brightness
      greedKingStatueImg.pixels[i + 1] *= 0.85; // G
      greedKingStatueImg.pixels[i + 2] *= 0.85; // B
      // Keep alpha the same (i+3)
    }
    greedKingStatueImg.updatePixels();
  }
  
  // Create grayscale statue version of Dream Guardian
  if (dreamGuardianGif) {
    guardianStatueImg = createImage(dreamGuardianGif.width, dreamGuardianGif.height);
    guardianStatueImg.copy(dreamGuardianGif, 0, 0, dreamGuardianGif.width, dreamGuardianGif.height, 0, 0, dreamGuardianGif.width, dreamGuardianGif.height);
    guardianStatueImg.filter(GRAY); // Convert to grayscale
    guardianStatueImg.loadPixels();
    // Brighten the grayscale image to look more like stone
    for (let i = 0; i < guardianStatueImg.pixels.length; i += 4) {
      guardianStatueImg.pixels[i] *= 0.85;     // R - keep more brightness
      guardianStatueImg.pixels[i + 1] *= 0.85; // G
      guardianStatueImg.pixels[i + 2] *= 0.85; // B
      // Keep alpha the same (i+3)
    }
    guardianStatueImg.updatePixels();
  }
  
  // Create grayscale statue version of Sorrow
  if (sorrowGif) {
    sorrowStatueImg = createImage(sorrowGif.width, sorrowGif.height);
    sorrowStatueImg.copy(sorrowGif, 0, 0, sorrowGif.width, sorrowGif.height, 0, 0, sorrowGif.width, sorrowGif.height);
    sorrowStatueImg.filter(GRAY); // Convert to grayscale
    sorrowStatueImg.loadPixels();
    // Brighten the grayscale image to look more like stone
    for (let i = 0; i < sorrowStatueImg.pixels.length; i += 4) {
      sorrowStatueImg.pixels[i] *= 0.85;     // R - keep more brightness
      sorrowStatueImg.pixels[i + 1] *= 0.85; // G
      sorrowStatueImg.pixels[i + 2] *= 0.85; // B
      // Keep alpha the same (i+3)
    }
    sorrowStatueImg.updatePixels();
  }
  
  // Initialize audio (but don't start music yet - wait for user interaction)
  dashSound = new p5.Oscillator('square');
  
  // Initialize player (will be positioned after intro)
  player = new Player(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
  
  // Setup HTML button listeners
  setupButtons();
  
  // Initialize world
  initWorld();
}

function draw() {
  if (gameState === 'startScreen') {
    drawStartScreen();
  } else if (gameState === 'intro') {
    drawIntroSequence();
  } else if (gameState === 'exploring') {
    // Check if in tower area
    if (currentArea === 'ruinedCityBuilding') {
      drawTowerGame();
    } else {
    drawWorld();
    }
  } else if (gameState === 'dialogue') {
    drawDialogue();
  } else if (gameState === 'swirlAnimation') {
    drawSwirlAnimation();
  } else if (gameState === 'puzzle') {
    drawPuzzle();
  } else if (gameState === 'pianoPuzzle') {
    drawPianoPuzzle();
  } else if (gameState === 'escapeRoom') {
    drawEscapeRoom();
  } else if (gameState === 'endingCutscene') {
    drawEndingCutscene();
  }
}

function keyPressed() {
  // Piano puzzle input
  if (handlePianoInput()) {
    return false;
  }
  
  // Escape room input
  if (handleEscapeRoomInput()) {
    return false;
  }
  
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
  
  // Door 2, decoration, and NPC interactions while exploring
  if (gameState === 'exploring' && (key === 'e' || key === 'E' || keyCode === ENTER)) {
    // Check tower exit (level 1 only)
    if (currentArea === 'ruinedCityBuilding') {
      let floorY = height - 40;
      let doorY = floorY - 60;
      if (towerLevel === 1 && player.x < 110 && player.y > doorY - 20 && player.y < floorY) {
        // Exit tower back to fullWorld
        previousArea = 'ruinedCityBuilding';
        currentArea = 'fullWorld';
        
        // Ensure gameState is exploring
        gameState = 'exploring';
        
        // Show message if soul was collected
        if (hasGreedSoul) {
          showTemporaryMessage('The building has been sealed. Once you leave, it turns to stone.');
        }
        
        // Fully reset player physics state for top-down movement
        player.vx = 0;
        player.vy = 0;
        player.isDashing = false;
        player.isDashingDown = false;
        player.canDash = true;
        player.dashDuration = 0;
        player.dashCooldown = 0;
        player.dashVx = 0;
        player.dashVy = 0;
        player.onGround = false;
        // Ensure speed is set for top-down movement
        player.speed = 4;
        
        // Clear tower-specific variables
        towerLevel = 1;
        towerPlatforms = [];
        towerEnemies = [];
        towerCollectibles = [];
        dashTrail = []; // Clear dash trail
        
        // Initialize world (this will set player position based on previousArea)
        initWorld();
        
        // Switch background music
        switchMusic();
        
        // Update camera immediately to ensure proper positioning
        updateCamera();
        
        // Ensure we're using top-down movement
        // The draw() function will call drawWorld() which uses player.update()
        return;
      }
      // Check if using ladder in King's Chamber (center bottom)
      if (towerLevel === 7 && towerLadderActive) {
        if (player.x > width/2 - 40 && player.x < width/2 + 40 && player.y > height - 150 && player.y < height - 20) {
          // Using ladder - go back to level 1
          towerLevel = 1;
          initTowerLevel(1);
          showTemporaryMessage('Returning to first floor...');
          return;
        }
      }
      // Check if talking to King of Greed in chamber
      if (towerLevel === 7) {
        for (let npc of npcs) {
          if (npc.name === 'King of Greed' && dist(player.x, player.y, npc.x, npc.y) < 100) {
            startDialogue(npc);
            return;
          }
        }
      }
    }
    
    // Check if player is near Door 2 (special case - opens with E)
    if (!checkDoor2Interaction()) {
      // Check decoration interactions (like dark cage)
      if (!checkDecorationInteraction()) {
        // If not near Door 2 or decorations, check NPC interaction
    checkNPCInteraction();
      }
    }
  }
  
  // Puzzle controls
  if (gameState === 'puzzle') {
    handlePuzzleInput();
  }
}

// =============================================================================
// START SCREEN
// =============================================================================

function drawStartScreen() {
  // Purple background
  background(55, 45, 75);
  
  // Draw start button - yellow, centered
  let buttonX = width / 2 - 120;
  let buttonY = height / 2 - 30;
  let buttonW = 240;
  let buttonH = 60;
  
  // Check if mouse is hovering over button
  let isHovering = mouseX > buttonX && mouseX < buttonX + buttonW && 
                   mouseY > buttonY && mouseY < buttonY + buttonH;
  
  // Button color - brighter yellow on hover
  if (isHovering) {
    fill(255, 255, 100);
  } else {
    fill(255, 220, 0);
  }
  
  // Draw button rectangle
  stroke(255, 200, 0);
  strokeWeight(3);
  rect(buttonX, buttonY, buttonW, buttonH, 5);
  
  // Button text
  fill(0);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(20);
  text("START GAME", width / 2, buttonY + buttonH / 2);
}

function mousePressed() {
  // Start screen button click
  if (gameState === 'startScreen') {
    let buttonX = width / 2 - 120;
    let buttonY = height / 2 - 30;
    let buttonW = 240;
    let buttonH = 60;
    
    // Check if click is on button
    if (mouseX > buttonX && mouseX < buttonX + buttonW && 
        mouseY > buttonY && mouseY < buttonY + buttonH) {
      // Enable audio and start music
      userStartAudio().then(() => {
        if (dreamscapeMusic) {
          dreamscapeMusic.loop();
          dreamscapeMusic.setVolume(0.3);
          currentMusic = dreamscapeMusic;
        }
      });
      
      // Start intro sequence
      gameState = 'intro';
    }
  }
  
  // Restart button click in ending cutscene
  if (gameState === 'endingCutscene' && showRestartButton) {
    let buttonX = width / 2 - 120;
    let buttonY = height / 2 + 50;
    let buttonW = 240;
    let buttonH = 60;
    
    // Check if click is on button
    if (mouseX > buttonX && mouseX < buttonX + buttonW && 
        mouseY > buttonY && mouseY < buttonY + buttonH) {
      // Reset game
      restartGame();
    }
  }
}

// =============================================================================
// INTRO SEQUENCE FUNCTIONS
// =============================================================================

function drawIntroSequence() {
  let scene = introSequence[introSceneIndex];
  
  if (scene.type === 'catJump') {
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
  
  // Start in the mansion
  currentArea = 'mansion';
  initWorld();
  
  // Place player on left side of mansion
  player.x = 200;
  player.y = 300;
  
  // Center camera on player
  updateCamera();
  
  // Switch music from intro (dreamscape) to mansion
  switchMusic();
}

// =============================================================================
// WORLD FUNCTIONS
// =============================================================================

function initWorld() {
  // Clear existing objects
  obstacles = [];
  npcs = [];
  doors = [];
  decorations = [];
  
  if (currentArea === 'mansion') {
    initMansion();
  } else if (currentArea === 'room1') {
    initRoom1();
  } else if (currentArea === 'room2') {
    initRoom2();
  } else if (currentArea === 'room3') {
    initRoom3();
  } else if (currentArea === 'wandererRoom') {
    initWandererRoom();
  } else if (currentArea === 'fullWorld') {
    initFullWorld();
  } else if (currentArea === 'ruinedCityBuilding') {
    // Initialize tower game at level 1
    towerLevel = 1;
    player.lives = globalLives; // Use global lives system
    initTowerLevel(1);
  } else if (currentArea === 'rathCave') {
    initRathCave();
  }
}

function initMansion() {
  // Mansion main hall - left side with 3 rooms on the right
  // Layout: Main hall on left, 3 doors on right wall leading to rooms
  
  // Clear background decorations (prevent trees from persisting)
  backgroundDecorations = [];
  
  // Walls (dark stone with decorative elements)
  obstacles = [
    // Top wall
    { x: 50, y: 50, w: 700, h: 30, style: 'wall' },
    // Bottom wall
    { x: 50, y: 520, w: 700, h: 30, style: 'wall' },
    // Left wall
    { x: 50, y: 50, w: 30, h: 500, style: 'wall' },
    // Right wall (with door gaps)
    { x: 720, y: 50, w: 30, h: 500, style: 'wall' },
    
    // Decorative pillars in main hall
    { x: 150, y: 120, w: 40, h: 60, style: 'pillar' },
    { x: 150, y: 380, w: 40, h: 60, style: 'pillar' }
  ];
  
  // Non-collidable decorations (drawn but no collision)
  decorations = [
    // Central rug/furniture (walkable)
    { x: 250, y: 260, w: 120, h: 80, style: 'furniture' }
  ];
  
  // Doors (interactive objects) - 3 doors on the right wall
  doors = [
    // Door 1 (right wall, top) - leads to puzzle room (ghost door, dash to enter)
    { x: 720, y: 120, w: 30, h: 70, targetArea: 'room1', locked: !hasGhostPepper, label: 'Door 1', isGhostDoor: true },
    // Door 2 (right wall, middle) - leads to Dream Guardian's room (normal door, E to open)
    { x: 720, y: 265, w: 30, h: 70, targetArea: 'room2', locked: !door2Unlocked, label: 'Door 2', isGhostDoor: false },
    // Door 3 (right wall, bottom) - leads to Echo's room (ghost door, dash to enter)
    { x: 720, y: 410, w: 30, h: 70, targetArea: 'room3', locked: !hasGhostPepper, label: 'Door 3', isGhostDoor: true }
  ];
  
  // Dream Guardian NPC - starts inside room 2 (behind door)
  // Will walk out during intro animation
  if (guardianIntroComplete) {
    // After intro, Guardian is in room 2
    npcs = [];
  } else {
    // During intro, Guardian walks out
  npcs = [
      new NPC(720, 300, 'Dream Guardian') // Start at door 2 position
    ];
  }
  
  // Set player position for mansion
  if (gameState !== 'intro') {
    // Spawn based on which room player came from
    // All doors are on the right wall (x=720), spawn player inside near the door
    if (previousArea === 'room1') {
      // Coming from Door 1 (top right, y=120) - spawn inside near it
      player.x = 650; // Inside mansion, away from right wall
      player.y = 155; // Near Door 1 center (120 + 70/2 = 155)
    } else if (previousArea === 'room2') {
      // Coming from Door 2 (middle right, y=265) - spawn inside near it
      player.x = 650; // Inside mansion, away from right wall
      player.y = 300; // Near Door 2 center (265 + 70/2 = 300)
    } else if (previousArea === 'room3') {
      // Coming from Door 3 (bottom right, y=410) - spawn inside near it
      player.x = 650; // Inside mansion, away from right wall
      player.y = 445; // Near Door 3 center (410 + 70/2 = 445)
    } else {
      // Default spawn (center-left of main hall)
    player.x = 200;
    player.y = 300;
    }
  }
}

function initRoom1() {
  // Check if escape room puzzle needs to be played
  if (!escapeRoomCompleted && previousArea === 'mansion') {
    // Start escape room puzzle
    startEscapeRoom();
    return;
  }
  
  // After puzzle completion, room1 is just a passage
  backgroundDecorations = []; // Clear background decorations
  obstacles = [
    // Walls
    { x: 50, y: 50, w: 700, h: 30, style: 'wall' },
    { x: 50, y: 520, w: 700, h: 30, style: 'wall' },
    { x: 50, y: 50, w: 30, h: 500, style: 'wall' },
    { x: 720, y: 50, w: 30, h: 500, style: 'wall' }
  ];
  
  doors = [
    // Exit to mansion (left wall, ghost door - dash to exit)
    { x: 50, y: 120, w: 30, h: 70, targetArea: 'mansion', locked: false, label: 'Back to Mansion', isGhostDoor: true },
    // Exit to full world (right wall, ghost door - dash to exit)
    { x: 720, y: 265, w: 30, h: 70, targetArea: 'fullWorld', locked: false, label: 'To Dreamscape', isGhostDoor: true }
  ];
  
  npcs = [];
  
  // Spawn player based on where they came from
  // Door 1 is at y=120 in mansion, left door here is at y=120
  // If coming from mansion (Door 1), spawn near left door, away from it
  if (previousArea === 'mansion') {
    player.x = 120; // Away from the left wall door
    player.y = 155; // Near Door 1 height (120 + 35)
  } else if (previousArea === 'fullWorld') {
    player.x = 650; // Away from the right wall door
    player.y = 300; // Near right door height (265 + 35)
  } else {
    // Default spawn (left side)
    player.x = 120;
  player.y = 155;
  }
}

function initRoom2() {
  // Dream Guardian's room - minimalist, ethereal
  backgroundDecorations = []; // Clear background decorations
  obstacles = [
    // Walls
    { x: 50, y: 50, w: 700, h: 30, style: 'wall' },
    { x: 50, y: 520, w: 700, h: 30, style: 'wall' },
    { x: 50, y: 50, w: 30, h: 500, style: 'wall' },
    { x: 720, y: 50, w: 30, h: 500, style: 'wall' },
    
    // Mystical altar in center
    { x: 350, y: 250, w: 100, h: 80, style: 'altar' }
  ];
  
  doors = [
    // Exit back to mansion (left wall) - opens with E key (normal door)
    { x: 50, y: 265, w: 30, h: 70, targetArea: 'mansion', locked: false, label: 'Back to Mansion', isGhostDoor: false }
  ];
  
  npcs = [
    new NPC(400, 290, 'Dream Guardian')
  ];
  
  // Complete the guardian intro animation when player enters room 2
  // This prevents the walk-back animation from playing in the mansion
  if (guardianShouldWalkBack && !guardianIntroComplete) {
    guardianIntroComplete = true;
  }
  
  player.x = 100;
  player.y = 300;
}

function initRoom3() {
  // Echo's room - where the XO puzzle happens
  backgroundDecorations = []; // Clear background decorations
  obstacles = [
    // Walls
    { x: 50, y: 50, w: 700, h: 30, style: 'wall' },
    { x: 50, y: 520, w: 700, h: 30, style: 'wall' },
    { x: 50, y: 50, w: 30, h: 500, style: 'wall' },
    { x: 720, y: 50, w: 30, h: 500, style: 'wall' }
  ];
  
  doors = [
    // Exit back to mansion (left wall, ghost door - dash to exit)
    { x: 50, y: 410, w: 30, h: 70, targetArea: 'mansion', locked: false, label: 'Back to Mansion', isGhostDoor: true }
  ];
  
  npcs = [
    new NPC(400, 300, 'Echo')
  ];
  
  // Spawn player near the entrance
  // Door 3 in mansion is at y=410, left door here is at y=410
  // Coming from mansion, spawn away from left door
  if (previousArea === 'mansion') {
    player.x = 120; // Away from the left wall door
    player.y = 445; // Near Door 3 height (410 + 35)
  } else {
    // Default spawn
    player.x = 120;
  player.y = 445;
  }
}

function initRathCave() {
  // Rath's cave - where the piano puzzle happens
  backgroundDecorations = []; // Clear background decorations
  obstacles = [
    // Walls
    { x: 50, y: 50, w: 700, h: 30, style: 'caveWall' },
    { x: 50, y: 520, w: 700, h: 30, style: 'caveWall' },
    { x: 50, y: 50, w: 30, h: 500, style: 'caveWall' },
    { x: 720, y: 50, w: 30, h: 500, style: 'caveWall' },
    
    // Piano in the center (collidable)
    { x: 350, y: 200, w: 100, h: 80, style: 'piano' }
  ];
  
  doors = [
    // Exit door back to fullWorld
    { x: 50, y: 250, w: 30, h: 80, targetArea: 'fullWorld', locked: false, label: 'Exit Cave', isGhostDoor: false }
  ];
  
  decorations = [];
  
  // Add Rath NPC
  npcs = [new NPC(400, 150, 'Rath')];
  
  // Spawn player at entrance
  if (previousArea === 'fullWorld') {
    player.x = 100;
    player.y = 300;
  }
}

function initWandererRoom() {
  // Sorrow's wooden cabin room - where the Color Tile puzzle happens
  backgroundDecorations = []; // Clear background decorations
  obstacles = [
    // Wooden walls
    { x: 50, y: 50, w: 700, h: 30, style: 'woodWall' },
    { x: 50, y: 520, w: 700, h: 30, style: 'woodWall' },
    { x: 50, y: 50, w: 30, h: 500, style: 'woodWall' },
    { x: 720, y: 50, w: 30, h: 500, style: 'woodWall' }
  ];
  
  doors = [
    // Exit back to Ghost Forest (regular door - E to exit)
    { x: 375, y: 520, w: 70, h: 30, targetArea: 'fullWorld', locked: false, label: 'Exit to Ghost Forest', isGhostDoor: false }
  ];
  
  npcs = [
    new NPC(400, 300, 'Sorrow')
  ];
  
  decorations = [];
  
  // Spawn player near the entrance
  if (previousArea === 'fullWorld') {
    player.x = 410; // Center of door
    player.y = 480; // Just inside the door
  } else {
    // Default spawn
    player.x = 410;
    player.y = 480;
  }
}

function initFullWorld() {
  // Full world map - large open dreamscape for exploration
  const mapWidth = 4800;
  const mapHeight = 3600;
  
  // Mansion position (middle-left of map)
  const mansionX = 600;
  const mansionY = 1500; // Moved down from 1200 to avoid ghost forest overlap
  const mansionW = 500;
  const mansionH = 600;
  
  // Ruined City position (directly below mansion with space)
  const ruinedCityX = mansionX - 100;
  const ruinedCityY = mansionY + mansionH + 250; // 250px gap below mansion
  const ruinedCityW = 800;
  const ruinedCityH = 700;
  
  // Ghost Forest position (above mansion, cabin centered over mansion)
  const ghostForestX = 400; // Centered over mansion
  const ghostForestY = 100; // Higher up, above mansion with larger gap
  const ghostForestW = 900; // Wider forest
  const ghostForestH = 950; // Taller forest
  
  // Entrance from mansion/room1
  obstacles = [
    // Border walls
    { x: 0, y: 0, w: mapWidth, h: 50, style: 'wall' },
    { x: 0, y: mapHeight - 50, w: mapWidth, h: 50, style: 'wall' },
    { x: 0, y: 0, w: 50, h: mapHeight, style: 'wall' },
    { x: mapWidth - 50, y: 0, w: 50, h: mapHeight, style: 'wall' },
    
    // === MANSION EXTERIOR (Gothic architecture) ===
    // Main building stone walls
    { x: mansionX, y: mansionY, w: mansionW, h: mansionH, style: 'mansionWall' },
    
    // Gothic pointed arch roof
    { x: mansionX - 20, y: mansionY - 100, w: mansionW + 40, h: 100, style: 'gothicRoof' },
    // Roof spire/tower
    { x: mansionX + mansionW / 2 - 40, y: mansionY - 200, w: 80, h: 100, style: 'spire' },
    
    // Gothic arched windows (stained glass effect)
    { x: mansionX + 60, y: mansionY + 80, w: 50, h: 90, style: 'gothicWindow' },
    { x: mansionX + 140, y: mansionY + 80, w: 50, h: 90, style: 'gothicWindow' },
    { x: mansionX + 220, y: mansionY + 80, w: 50, h: 90, style: 'gothicWindow' },
    { x: mansionX + 300, y: mansionY + 80, w: 50, h: 90, style: 'gothicWindow' },
    { x: mansionX + 380, y: mansionY + 80, w: 50, h: 90, style: 'gothicWindow' },
    
    { x: mansionX + 60, y: mansionY + 220, w: 50, h: 90, style: 'gothicWindow' },
    { x: mansionX + 140, y: mansionY + 220, w: 50, h: 90, style: 'gothicWindow' },
    { x: mansionX + 220, y: mansionY + 220, w: 50, h: 90, style: 'gothicWindow' },
    { x: mansionX + 300, y: mansionY + 220, w: 50, h: 90, style: 'gothicWindow' },
    { x: mansionX + 380, y: mansionY + 220, w: 50, h: 90, style: 'gothicWindow' },
    
    { x: mansionX + 60, y: mansionY + 360, w: 50, h: 90, style: 'gothicWindow' },
    { x: mansionX + 140, y: mansionY + 360, w: 50, h: 90, style: 'gothicWindow' },
    { x: mansionX + 220, y: mansionY + 360, w: 50, h: 90, style: 'gothicWindow' },
    { x: mansionX + 300, y: mansionY + 360, w: 50, h: 90, style: 'gothicWindow' },
    { x: mansionX + 380, y: mansionY + 360, w: 50, h: 90, style: 'gothicWindow' },
    
    // Stone buttresses (gothic support columns on sides)
    { x: mansionX - 15, y: mansionY + 100, w: 15, h: 120, style: 'buttress' },
    { x: mansionX - 15, y: mansionY + 350, w: 15, h: 120, style: 'buttress' },
    { x: mansionX + mansionW, y: mansionY + 100, w: 15, h: 120, style: 'buttress' },
    { x: mansionX + mansionW, y: mansionY + 250, w: 15, h: 120, style: 'buttress' },
    
    // Stone archway column left of bottom-right entrance
    { x: mansionX + mansionW - 60, y: mansionY + mansionH - 100, w: 20, h: 100, style: 'buttress' },
    
    // === DARK CAGE (Final boss location, moved to top-right) ===
    // Cage is positioned in the top-right of the map
    // Outer cage structure - large, ominous
    { x: 3200, y: 200, w: 400, h: 500, style: 'darkCage' },
    // Cage bars (vertical)
    { x: 3250, y: 200, w: 15, h: 500, style: 'cageBars' },
    { x: 3320, y: 200, w: 15, h: 500, style: 'cageBars' },
    { x: 3390, y: 200, w: 15, h: 500, style: 'cageBars' },
    { x: 3460, y: 200, w: 15, h: 500, style: 'cageBars' },
    { x: 3530, y: 200, w: 15, h: 500, style: 'cageBars' },
    // Dark energy glow inside cage
    { x: 3300, y: 350, w: 200, h: 200, style: 'darkEnergy' },
    
    // === GHOST FOREST (Upper-right area) ===
    // Wooden cabin in the center (collidable)
    { x: ghostForestX + 280, y: ghostForestY + 350, w: 140, h: 160, style: 'woodenCabin' },
    // Cabin roof (collidable)
    { x: ghostForestX + 270, y: ghostForestY + 330, w: 160, h: 30, style: 'cabinRoof' },
    // Cabin chimney (collidable)
    { x: ghostForestX + 360, y: ghostForestY + 300, w: 20, h: 50, style: 'chimney' }
  ];
  
  // Define lava lake dimensions BEFORE using them
  const lavaLakeX = mansionX + mansionW + 420;
  const lavaLakeY = mansionY + 580;
  const lavaLakeW = 900; // Enlarged to fit island on the right
  const lavaLakeH = 480;
  
  // Initialize lava stepping stones - path: right, up, right, right, then to island
  // Dash distance is approximately 120-140px
  lavaStones = [
    // Platform 1 - dash RIGHT from start
    { x: lavaLakeX + 80, y: lavaLakeY + 320, w: 85, h: 75 },
    // Platform 2 - dash UP from platform 1
    { x: lavaLakeX + 80, y: lavaLakeY + 180, w: 80, h: 70 },
    // Platform 3 - dash RIGHT from platform 2
    { x: lavaLakeX + 220, y: lavaLakeY + 180, w: 85, h: 75 },
    // Platform 4 - dash RIGHT from platform 3
    { x: lavaLakeX + 360, y: lavaLakeY + 180, w: 80, h: 70 }
  ];
  
  // Cave/Island position - dashable from platform 4 (center of platform 4 is at +400, dash ~130px)
  const caveX = lavaLakeX + 500; // Positioned within dash range of platform 4
  const caveY = lavaLakeY + 150; // Higher than platform 4 for easier landing
  
  // Set lava respawn point (left of lake, safe ground) - aligned with platform 1's y
  lavaRespawnPoint = { x: lavaLakeX - 60, y: lavaLakeY + 320 };
  
  // Ghostfire Lake position (bottom-right of map) - define BEFORE using in backgroundDecorations
  const ghostfireLakeX = 2900;
  const ghostfireLakeY = 2700; // Moved up from 3000
  const ghostfireLakeW = 800;
  const ghostfireLakeH = 400;
  
  // Background decorations - drawn behind player, no collision
  backgroundDecorations = [
    // === LAVA LAKE (Below the cage) - Background only, no collision ===
    // Lava lake background - deadly area (collision handled by checkLavaCollision)
    { x: lavaLakeX, y: lavaLakeY, w: lavaLakeW, h: lavaLakeH, style: 'lavaLake' },
    // Cave entrance with island - dashable from platform 4 (larger platform)
    { x: caveX, y: caveY, w: 180, h: 120, style: 'lavaCave' },
    
    // === LAVA STEPPING STONES - Background, no collision ===
    // These are drawn on top of lava lake as background elements (4 platforms)
    ...lavaStones.map(stone => ({ x: stone.x, y: stone.y, w: stone.w, h: stone.h, style: 'lavaStone' })),
    
    // === GHOSTFIRE LAKE (Bottom-right of map) - Background only ===
    { x: ghostfireLakeX, y: ghostfireLakeY, w: ghostfireLakeW, h: ghostfireLakeH, style: 'ghostfireLake' },
    
    // Wooden planks over ghostfire lake (walkable platforms at top edge)
    { x: ghostfireLakeX + 100, y: ghostfireLakeY + 30, w: 600, h: 60, style: 'woodenPlanks' },
    
    // === GHOST FOREST TREES (Background) - Ellipse pattern around cabin ===
    // Trees distributed in an ellipse pattern, avoiding cabin area (x: 280-420, y: 350-510)
    // Ellipse center: x: 450, y: 475, radiusX: 430, radiusY: 450
    
    // Outer ring - top arc (reduced height by ~30%)
    { x: ghostForestX + 50, y: ghostForestY + 80, w: 48, h: 115, style: 'ghostTree' },
    { x: ghostForestX + 160, y: ghostForestY + 45, w: 52, h: 125, style: 'ghostTree' },
    { x: ghostForestX + 280, y: ghostForestY + 30, w: 55, h: 135, style: 'ghostTree' },
    { x: ghostForestX + 420, y: ghostForestY + 25, w: 50, h: 120, style: 'ghostTree' },
    { x: ghostForestX + 560, y: ghostForestY + 30, w: 47, h: 118, style: 'ghostTree' },
    { x: ghostForestX + 690, y: ghostForestY + 45, w: 53, h: 130, style: 'ghostTree' },
    { x: ghostForestX + 800, y: ghostForestY + 80, w: 49, h: 122, style: 'ghostTree' },
    
    // Outer ring - left and right sides (upper)
    { x: ghostForestX + 20, y: ghostForestY + 200, w: 51, h: 125, style: 'ghostTree' },
    { x: ghostForestX + 850, y: ghostForestY + 200, w: 48, h: 118, style: 'ghostTree' },
    { x: ghostForestX + 15, y: ghostForestY + 350, w: 50, h: 122, style: 'ghostTree' },
    { x: ghostForestX + 860, y: ghostForestY + 350, w: 46, h: 115, style: 'ghostTree' },
    
    // Outer ring - left and right sides (middle)
    { x: ghostForestX + 20, y: ghostForestY + 500, w: 54, h: 130, style: 'ghostTree' },
    { x: ghostForestX + 850, y: ghostForestY + 500, w: 52, h: 125, style: 'ghostTree' },
    { x: ghostForestX + 30, y: ghostForestY + 650, w: 48, h: 118, style: 'ghostTree' },
    { x: ghostForestX + 840, y: ghostForestY + 650, w: 50, h: 122, style: 'ghostTree' },
    
    // Outer ring - bottom arc
    { x: ghostForestX + 80, y: ghostForestY + 820, w: 52, h: 125, style: 'ghostTree' },
    { x: ghostForestX + 200, y: ghostForestY + 870, w: 47, h: 118, style: 'ghostTree' },
    { x: ghostForestX + 350, y: ghostForestY + 895, w: 51, h: 122, style: 'ghostTree' },
    { x: ghostForestX + 500, y: ghostForestY + 895, w: 49, h: 120, style: 'ghostTree' },
    { x: ghostForestX + 650, y: ghostForestY + 870, w: 53, h: 130, style: 'ghostTree' },
    { x: ghostForestX + 770, y: ghostForestY + 820, w: 48, h: 118, style: 'ghostTree' },
    
    // Middle ring - top arc
    { x: ghostForestX + 120, y: ghostForestY + 150, w: 50, h: 122, style: 'ghostTree' },
    { x: ghostForestX + 250, y: ghostForestY + 120, w: 46, h: 115, style: 'ghostTree' },
    { x: ghostForestX + 400, y: ghostForestY + 110, w: 54, h: 132, style: 'ghostTree' },
    { x: ghostForestX + 550, y: ghostForestY + 120, w: 52, h: 125, style: 'ghostTree' },
    { x: ghostForestX + 680, y: ghostForestY + 150, w: 48, h: 120, style: 'ghostTree' },
    
    // Middle ring - left side (avoiding cabin)
    { x: ghostForestX + 90, y: ghostForestY + 310, w: 49, h: 118, style: 'ghostTree' },
    { x: ghostForestX + 110, y: ghostForestY + 470, w: 47, h: 115, style: 'ghostTree' },
    { x: ghostForestX + 90, y: ghostForestY + 620, w: 51, h: 122, style: 'ghostTree' },
    
    // Middle ring - right side (avoiding cabin)
    { x: ghostForestX + 750, y: ghostForestY + 310, w: 52, h: 125, style: 'ghostTree' },
    { x: ghostForestX + 730, y: ghostForestY + 470, w: 48, h: 118, style: 'ghostTree' },
    { x: ghostForestX + 750, y: ghostForestY + 620, w: 50, h: 122, style: 'ghostTree' },
    
    // Middle ring - bottom arc (avoiding campfire at x+320, y+600)
    { x: ghostForestX + 180, y: ghostForestY + 750, w: 51, h: 125, style: 'ghostTree' },
    { x: ghostForestX + 500, y: ghostForestY + 805, w: 53, h: 128, style: 'ghostTree' },
    { x: ghostForestX + 660, y: ghostForestY + 790, w: 49, h: 120, style: 'ghostTree' },
    
    // Inner ring - top arc (above cabin, with buffer)
    // Cabin is at x: 280-420, y: 350-510, so keep trees well away
    { x: ghostForestX + 150, y: ghostForestY + 200, w: 52, h: 125, style: 'ghostTree' },
    { x: ghostForestX + 450, y: ghostForestY + 180, w: 47, h: 118, style: 'ghostTree' },
    { x: ghostForestX + 650, y: ghostForestY + 210, w: 50, h: 122, style: 'ghostTree' },
    
    // Inner ring - left of cabin (well before x: 280, avoiding y: 350-510 cabin area)
    { x: ghostForestX + 140, y: ghostForestY + 280, w: 50, h: 122, style: 'ghostTree' },
    { x: ghostForestX + 130, y: ghostForestY + 550, w: 48, h: 118, style: 'ghostTree' },
    
    // Inner ring - right of cabin (well after x: 420, avoiding y: 350-510 cabin area)
    { x: ghostForestX + 680, y: ghostForestY + 280, w: 52, h: 125, style: 'ghostTree' },
    { x: ghostForestX + 690, y: ghostForestY + 550, w: 48, h: 120, style: 'ghostTree' },
    
    // Inner ring - bottom arc (below cabin, after y: 510, avoiding campfire)
    { x: ghostForestX + 160, y: ghostForestY + 580, w: 48, h: 120, style: 'ghostTree' },
    { x: ghostForestX + 460, y: ghostForestY + 650, w: 49, h: 118, style: 'ghostTree' },
    { x: ghostForestX + 640, y: ghostForestY + 620, w: 52, h: 125, style: 'ghostTree' },
    
    // === RUINED CITY BROKEN BUILDINGS (Background) ===
    // Left side broken buildings
    { x: ruinedCityX + 30, y: ruinedCityY + 50, w: 100, h: 150, style: 'ruinedBuilding' },
    { x: ruinedCityX + 50, y: ruinedCityY + 250, w: 80, h: 120, style: 'ruinedBuilding' },
    { x: ruinedCityX + 20, y: ruinedCityY + 420, w: 90, h: 140, style: 'ruinedBuilding' },
    
    // Top broken buildings
    { x: ruinedCityX + 180, y: ruinedCityY + 20, w: 110, h: 130, style: 'ruinedBuilding' },
    { x: ruinedCityX + 340, y: ruinedCityY + 40, w: 90, h: 110, style: 'ruinedBuilding' },
    { x: ruinedCityX + 480, y: ruinedCityY + 30, w: 100, h: 120, style: 'ruinedBuilding' },
    
    // Right side broken buildings
    { x: ruinedCityX + 570, y: ruinedCityY + 200, w: 95, h: 140, style: 'ruinedBuilding' },
    { x: ruinedCityX + 590, y: ruinedCityY + 400, w: 85, h: 130, style: 'ruinedBuilding' },
    
    // Bottom broken buildings
    { x: ruinedCityX + 180, y: ruinedCityY + 480, w: 105, h: 100, style: 'ruinedBuilding' },
    { x: ruinedCityX + 450, y: ruinedCityY + 490, w: 90, h: 90, style: 'ruinedBuilding' }
  ];
  
  // Add building obstacles only if soul not collected
  if (!hasGreedSoul) {
    obstacles.push(
      { x: ruinedCityX + 300, y: ruinedCityY + 150, w: 120, h: 300, style: 'tallBuilding' },
      // Windows on tall building
      { x: ruinedCityX + 315, y: ruinedCityY + 170, w: 20, h: 30, style: 'brokenWindow' },
      { x: ruinedCityX + 350, y: ruinedCityY + 170, w: 20, h: 30, style: 'brokenWindow' },
      { x: ruinedCityX + 385, y: ruinedCityY + 170, w: 20, h: 30, style: 'brokenWindow' },
      { x: ruinedCityX + 315, y: ruinedCityY + 220, w: 20, h: 30, style: 'brokenWindow' },
      { x: ruinedCityX + 350, y: ruinedCityY + 220, w: 20, h: 30, style: 'brokenWindow' },
      { x: ruinedCityX + 385, y: ruinedCityY + 220, w: 20, h: 30, style: 'brokenWindow' },
      { x: ruinedCityX + 315, y: ruinedCityY + 270, w: 20, h: 30, style: 'brokenWindow' },
      { x: ruinedCityX + 350, y: ruinedCityY + 270, w: 20, h: 30, style: 'brokenWindow' },
      { x: ruinedCityX + 385, y: ruinedCityY + 270, w: 20, h: 30, style: 'brokenWindow' },
      { x: ruinedCityX + 315, y: ruinedCityY + 320, w: 20, h: 30, style: 'brokenWindow' },
      { x: ruinedCityX + 350, y: ruinedCityY + 320, w: 20, h: 30, style: 'brokenWindow' },
      { x: ruinedCityX + 385, y: ruinedCityY + 320, w: 20, h: 30, style: 'brokenWindow' }
    );
  }
  
  doors = [
    // Mansion entrance - ghost door (bottom-right corner of mansion, dash to enter)
    // Vertical door positioned at the bottom-right corner
    { x: mansionX + mansionW - 30, y: mansionY + mansionH - 80, w: 30, h: 80, 
      targetArea: 'room1', locked: false, label: 'Mansion Entrance', isGhostDoor: true },
    // Ruined City tall building entrance - ghost door (locked if soul collected)
    { x: ruinedCityX + 300 + (120 / 2) - 25, y: ruinedCityY + 150 + 300 - 30, w: 50, h: 30, 
      targetArea: 'ruinedCityBuilding', locked: hasGreedSoul, label: 'Tall Building', isGhostDoor: true },
     // Ghost Forest cabin door - regular door (locked until unlocked with key)
     { x: ghostForestX + 315, y: ghostForestY + 450, w: 70, h: 60, 
       targetArea: 'wandererRoom', locked: !cabinUnlocked, label: 'Cabin Door', isGhostDoor: false }
  ];
  
  // Decorations (non-collidable but interactable or visual)
  decorations = [
    // Dark cage interaction zone (updated to new top-right position)
    { x: 3200, y: 200, w: 400, h: 500, 
      type: 'darkCageInteraction' },
    // Ghost forest campfire (collidable) - centered in clearing below cabin
    { x: ghostForestX + 340, y: ghostForestY + 680, w: 60, h: 60, style: 'campfire' },
    // Cave entrance interaction zone (on the island)
    { x: caveX - 30, y: caveY - 20, w: 120, h: 120, 
      type: 'caveEntrance', targetArea: 'rathCave' }
  ];
  
  // Add campfire to obstacles for collision (draws on top of background trees)
  obstacles.push({ x: ghostForestX + 340, y: ghostForestY + 680, w: 60, h: 60, style: 'campfire' });
  
  // If soul collected, replace building with statue
  if (hasGreedSoul) {
    decorations.push({
      x: ruinedCityX + 300, 
      y: ruinedCityY + 150, 
      w: 120, 
      h: 300, 
      style: 'statue',
      type: 'ruinedCityBuildingStatue',
      message: 'The building has been sealed. Once you leave, it turns to stone.'
    });
  }
  
  npcs = [
    // Sans - on wooden planks over ghostfire lake (centered on platform)
    new NPC(ghostfireLakeX + 400, ghostfireLakeY + 50, 'sans')
  ];
  
  // Spawn player based on where they came from
  if (previousArea === 'ruinedCityBuilding') {
    // Exiting from ruined city tower - spawn in front of the building
    player.x = ruinedCityX + 300 + (120 / 2); // Center of building
    player.y = ruinedCityY + 150 + 300 + 50; // Below the door
  } else if (previousArea === 'wandererRoom') {
    // Exiting from Sorrow's cabin - spawn in front of cabin door
    player.x = ghostForestX + 350;
    player.y = ghostForestY + 530; // Just below the cabin door
  } else if (previousArea === 'rathCave') {
    // Exiting from Rath's cave - spawn on the island platform
    const lavaLakeX = mansionX + mansionW + 420;
    const lavaLakeY = mansionY + 580;
    const caveX = lavaLakeX + 500; // Updated cave position
    const caveY = lavaLakeY + 150;
    player.x = caveX + 20; // Spawn on the platform
    player.y = caveY + 50; // On top of the island platform
  } else {
    // Default: spawn near mansion entrance (clear of door collision)
    player.x = mansionX + mansionW + 50; // To the right of door
    player.y = mansionY + mansionH + 100; // Well below mansion
  }
}

function initTowerLevel(level) {
  // Initialize a specific tower level (1-6) or the King's chamber (7)
  towerPlatforms = [];
  towerEnemies = [];
  towerCollectibles = [];
  
  // Clear any NPCs from previous areas
  npcs = [];
  obstacles = [];
  doors = [];
  decorations = [];
  backgroundDecorations = []; // Clear background decorations
  
  const LEVEL_HEIGHT = height; // Each level is one canvas height
  
  if (level >= 1 && level <= 6) {
    // Regular tower levels with platforms and enemies
    
    // Generate platforms - different layout for each level
    if (level % 3 === 1) {
      // Pattern 1: Zigzag from bottom-left to top-right
      towerPlatforms.push(new TowerPlatform(50, height - 100, 150, 15));
      towerPlatforms.push(new TowerPlatform(250, height - 220, 140, 15));
      towerPlatforms.push(new TowerPlatform(450, height - 340, 150, 15));
      towerPlatforms.push(new TowerPlatform(200, height - 460, 180, 15));
      towerPlatforms.push(new TowerPlatform(500, height - 150, 120, 15));
      towerPlatforms.push(new TowerPlatform(350, height - 120, 100, 15));
    } else if (level % 3 === 2) {
      // Pattern 2: Vertical climb on right side
      towerPlatforms.push(new TowerPlatform(500, height - 120, 180, 15));
      towerPlatforms.push(new TowerPlatform(400, height - 240, 150, 15));
      towerPlatforms.push(new TowerPlatform(480, height - 360, 160, 15));
      towerPlatforms.push(new TowerPlatform(380, height - 480, 140, 15));
      towerPlatforms.push(new TowerPlatform(100, height - 200, 140, 15));
      towerPlatforms.push(new TowerPlatform(180, height - 340, 120, 15));
    } else {
      // Pattern 3: Center platforms
      towerPlatforms.push(new TowerPlatform(280, height - 100, 160, 15));
      towerPlatforms.push(new TowerPlatform(120, height - 220, 140, 15));
      towerPlatforms.push(new TowerPlatform(450, height - 220, 140, 15));
      towerPlatforms.push(new TowerPlatform(280, height - 340, 150, 15));
      towerPlatforms.push(new TowerPlatform(100, height - 460, 160, 15));
      towerPlatforms.push(new TowerPlatform(480, height - 460, 120, 15));
    }
    
    // Add exit hole on right side (dash down to go down a level)
    // This is a visual marker, not a collision object
    
    // Spawn enemies - constant count of 3 per level
    for (let i = 0; i < 3; i++) {
      let x = random(100, width - 100);
      let y = random(100, height - 200);
      towerEnemies.push(new TowerEnemy(x, y));
    }
    
    // Player spawns at bottom of level - on the floor
    let floorY = height - 40;
    player.x = width / 2;
    player.y = floorY - player.hitboxH/2 - 5; // Just above floor
    player.vy = 0;
    player.onGround = true;
    
  } else if (level === 7) {
    // King's Chamber - top-down movement room (like dreamscape)
    obstacles = [];
    doors = [];
    decorations = [];
    
    // No platforms needed - top-down movement
    towerPlatforms = [];
    
    // Skeleton decorations on sides (center-left and center-right)
    decorations.push({ x: 100, y: height/2 - 60, w: 80, h: 120, style: 'skeleton' });
    decorations.push({ x: 620, y: height/2 - 60, w: 80, h: 120, style: 'skeleton' });
    
    // Ladder back down (appears after collecting soul) - center bottom
    if (towerLadderActive) {
      decorations.push({ x: width/2 - 30, y: height - 140, w: 60, h: 140, style: 'ladder',
                        type: 'ladder' });
    }
    
    // King of Greed NPC - center of room
    npcs = [new NPC(width/2, height/2, 'King of Greed')];
    
    // Player spawns on left side
    player.x = 200;
    player.y = height/2;
    player.vy = 0;
    player.vx = 0;
    player.onGround = true;
  }
}

function drawFloorPattern() {
  // Create cached floor pattern if it doesn't exist
  if (!floorPatternCache) {
  const tileSize = 60;
  const startX = 50;
  const startY = 50;
  const endX = 750;
  const endY = 550;
  
    floorPatternCache = createGraphics(width, height);
    floorPatternCache.noStroke();
  for (let x = startX; x < endX; x += tileSize) {
    for (let y = startY; y < endY; y += tileSize) {
      const isEven = ((x - startX) / tileSize + (y - startY) / tileSize) % 2 === 0;
        floorPatternCache.fill(isEven ? 40 : 45, isEven ? 35 : 40, isEven ? 50 : 55);
        floorPatternCache.rect(x, y, tileSize, tileSize);
    }
  }
  }
  
  // Draw the cached pattern
  image(floorPatternCache, 0, 0);
}

function drawWoodenFloor() {
  // Wooden floor for wanderer's cabin
  push();
  const startX = 50;
  const startY = 50;
  const endX = 750;
  const endY = 550;
  const plankWidth = endX - startX;
  const plankHeight = 25;
  
  for (let y = startY; y < endY; y += plankHeight) {
    // Alternate plank colors slightly
    let shade = (y / plankHeight) % 2 === 0 ? 0 : 5;
    fill(70 + shade, 50 + shade, 30 + shade);
    stroke(60, 45, 25);
    strokeWeight(2);
    rect(startX, y, plankWidth, plankHeight);
    
    // Wood grain lines
    stroke(75, 55, 35);
    strokeWeight(1);
    for (let x = startX + 50; x < endX; x += 80) {
      line(x, y, x, y + plankHeight);
    }
    
    // Horizontal plank line
    stroke(55, 40, 20);
    strokeWeight(1);
    line(startX, y + plankHeight, endX, y + plankHeight);
  }
  pop();
}

function drawStyledObstacle(obs) {
  const style = obs.style || 'default';
  
  if (style === 'wall') {
    // Stone walls - dark with texture
    fill(45, 45, 50);
    stroke(30, 30, 35);
    strokeWeight(2);
    rect(obs.x, obs.y, obs.w, obs.h);
    // Texture lines
    stroke(55, 55, 60);
    strokeWeight(1);
    for (let i = 0; i < obs.h; i += 15) {
      line(obs.x, obs.y + i, obs.x + obs.w, obs.y + i);
    }
  } else if (style === 'pillar') {
    // Decorative pillars - lighter stone with details
    fill(60, 55, 65);
    stroke(80, 75, 85);
    strokeWeight(2);
    rect(obs.x, obs.y, obs.w, obs.h);
    // Pillar details
    fill(70, 65, 75);
    rect(obs.x + 5, obs.y + 5, obs.w - 10, 10);
    rect(obs.x + 5, obs.y + obs.h - 15, obs.w - 10, 10);
  } else if (style === 'furniture') {
    // Central rug/table - burgundy tones
    fill(80, 40, 50);
    stroke(100, 50, 60);
    strokeWeight(2);
    rect(obs.x, obs.y, obs.w, obs.h);
    // Pattern
    noFill();
    stroke(90, 45, 55);
    rect(obs.x + 10, obs.y + 10, obs.w - 20, obs.h - 20);
  } else if (style === 'altar') {
    // Mystical altar - glowing
    fill(100, 120, 150);
    stroke(150, 170, 200);
    strokeWeight(2);
    rect(obs.x, obs.y, obs.w, obs.h);
    // Glow effect
    noStroke();
    fill(120, 150, 200, 100);
    ellipse(obs.x + obs.w / 2, obs.y + obs.h / 2, obs.w * 0.8, obs.h * 0.8);
  } else if (style === 'blocked') {
    // Blocked areas in full world
    fill(30, 30, 40, 200);
    stroke(60, 60, 70);
    strokeWeight(3);
    rect(obs.x, obs.y, obs.w, obs.h);
    // X pattern
    line(obs.x, obs.y, obs.x + obs.w, obs.y + obs.h);
    line(obs.x + obs.w, obs.y, obs.x, obs.y + obs.h);
    // Label
    if (obs.label) {
      fill(150, 150, 160);
      textAlign(CENTER, CENTER);
      textSize(12);
      text(obs.label, obs.x + obs.w / 2, obs.y + obs.h / 2);
    }
  } else if (style === 'roof') {
    // Gothic roof - dark with shingles
    fill(35, 30, 35);
    stroke(25, 20, 25);
    strokeWeight(2);
    rect(obs.x, obs.y, obs.w, obs.h);
    // Shingle pattern
    stroke(45, 40, 45);
    strokeWeight(1);
    for (let i = 0; i < obs.h; i += 15) {
      line(obs.x, obs.y + i, obs.x + obs.w, obs.y + i);
    }
  } else if (style === 'roofPeak') {
    // Roof peak decoration - pointed gothic style
    fill(30, 25, 30);
    stroke(20, 15, 20);
    strokeWeight(2);
    triangle(obs.x, obs.y + obs.h, obs.x + obs.w / 2, obs.y, obs.x + obs.w, obs.y + obs.h);
  } else if (style === 'wood') {
    // Wood beams - dark brown timber
    fill(60, 40, 30);
    stroke(40, 25, 15);
    strokeWeight(2);
    rect(obs.x, obs.y, obs.w, obs.h);
    // Wood grain lines
    stroke(50, 35, 25);
    strokeWeight(1);
    for (let i = 0; i < obs.h; i += 20) {
      line(obs.x + 2, obs.y + i, obs.x + obs.w - 2, obs.y + i);
    }
  } else if (style === 'mansionWall') {
    // Gothic mansion stone walls - dark gray stone
    fill(50, 50, 55);
    stroke(35, 35, 40);
    strokeWeight(3);
    rect(obs.x, obs.y, obs.w, obs.h);
    // Stone brick pattern
    stroke(60, 60, 65);
    strokeWeight(1);
    for (let y = 0; y < obs.h; y += 30) {
      line(obs.x, obs.y + y, obs.x + obs.w, obs.y + y);
    }
    for (let x = 0; x < obs.w; x += 50) {
      let offset = (Math.floor(x / 50) % 2) * 25;
      for (let y = 0; y < obs.h; y += 30) {
        line(obs.x + x, obs.y + y + offset, obs.x + x, obs.y + y + 30 + offset);
      }
    }
  } else if (style === 'gothicRoof') {
    // Pointed gothic roof - very dark, almost black
    fill(25, 20, 25);
    stroke(15, 10, 15);
    strokeWeight(2);
    rect(obs.x, obs.y, obs.w, obs.h);
    // Roof tiles pattern
    stroke(35, 30, 35);
    strokeWeight(1);
    for (let i = 0; i < obs.h; i += 10) {
      line(obs.x, obs.y + i, obs.x + obs.w, obs.y + i);
    }
  } else if (style === 'spire') {
    // Tower spire - pointed top
    fill(30, 25, 30);
    stroke(20, 15, 20);
    strokeWeight(2);
    // Draw pointed spire as triangle on top of rectangle
    rect(obs.x, obs.y + 40, obs.w, obs.h - 40);
    triangle(obs.x, obs.y + 40, obs.x + obs.w / 2, obs.y, obs.x + obs.w, obs.y + 40);
  } else if (style === 'gothicWindow') {
    // Gothic arched stained glass windows
    fill(60, 80, 120, 180); // Dark blue glass with transparency
    stroke(30, 30, 35);
    strokeWeight(3);
    rect(obs.x, obs.y, obs.w, obs.h);
    // Gothic arch top
    noFill();
    stroke(30, 30, 35);
    strokeWeight(3);
    arc(obs.x + obs.w / 2, obs.y, obs.w, obs.w, PI, TWO_PI);
    // Window leading (cross pattern)
    stroke(40, 40, 45);
    strokeWeight(2);
    line(obs.x + obs.w / 2, obs.y, obs.x + obs.w / 2, obs.y + obs.h);
    line(obs.x, obs.y + obs.h / 2, obs.x + obs.w, obs.y + obs.h / 2);
  } else if (style === 'buttress') {
    // Flying buttress - stone support columns
    fill(55, 55, 60);
    stroke(40, 40, 45);
    strokeWeight(2);
    rect(obs.x, obs.y, obs.w, obs.h);
    // Stone detail
    stroke(65, 65, 70);
    strokeWeight(1);
    for (let i = 0; i < obs.h; i += 20) {
      line(obs.x, obs.y + i, obs.x + obs.w, obs.y + i);
    }
  } else if (style === 'darkCage') {
    // Dark cage outer structure - ominous black metal
    fill(20, 15, 25, 200);
    stroke(10, 5, 15);
    strokeWeight(4);
    rect(obs.x, obs.y, obs.w, obs.h);
    // Decorative spikes on top
    for (let i = 0; i < obs.w; i += 60) {
      triangle(obs.x + i, obs.y, obs.x + i + 20, obs.y - 30, obs.x + i + 40, obs.y);
    }
  } else if (style === 'cageBars') {
    // Vertical cage bars - thick dark metal
    // Animate bars moving down if cage is opening
    let barY = obs.y;
    let barH = obs.h;
    
    if (cageOpening) {
      // Move bars down based on progress
      barY = obs.y + (obs.h * cageOpeningProgress);
      barH = obs.h * (1 - cageOpeningProgress);
      
      // Update progress
      cageOpeningProgress += 0.02;
      
      // When fully open, trigger ending cutscene
      if (cageOpeningProgress >= 1) {
        cageOpening = false;
        cageOpeningProgress = 0;
        startEndingCutscene();
      }
    }
    
    // Only draw bars if they're still visible
    if (barH > 0) {
      fill(15, 10, 20);
      stroke(5, 0, 10);
      strokeWeight(3);
      rect(obs.x, barY, obs.w, barH);
      // Metallic highlight
      stroke(30, 25, 35);
      strokeWeight(1);
      line(obs.x + 3, barY, obs.x + 3, barY + barH);
    }
  } else if (style === 'darkEnergy') {
    // Dark pulsing energy inside cage
    noStroke();
    // Outer glow - pulsing effect
    let pulseAlpha = 100 + sin(frameCount * 0.05) * 50;
    fill(80, 20, 100, pulseAlpha);
    ellipse(obs.x + obs.w / 2, obs.y + obs.h / 2, obs.w * 1.2, obs.h * 1.2);
    // Middle glow
    fill(60, 10, 80, pulseAlpha + 50);
    ellipse(obs.x + obs.w / 2, obs.y + obs.h / 2, obs.w * 0.8, obs.h * 0.8);
    // Core
    fill(40, 0, 60, 200);
    ellipse(obs.x + obs.w / 2, obs.y + obs.h / 2, obs.w * 0.5, obs.h * 0.5);
  } else if (style === 'ruinedBuilding') {
    // Ruined/broken buildings - crumbling concrete with rebar
    fill(65, 65, 70);
    stroke(45, 45, 50);
    strokeWeight(3);
    rect(obs.x, obs.y, obs.w, obs.h);
    
    // Concrete texture
    noStroke();
    fill(55, 55, 60, 100);
    for (let i = 0; i < 5; i++) {
      let rx = obs.x + random(obs.w);
      let ry = obs.y + random(obs.h);
      rect(rx, ry, random(10, 20), random(10, 20));
    }
    
    // Vertical cracks with depth
    stroke(30, 30, 35);
    strokeWeight(3);
    line(obs.x + obs.w * 0.3, obs.y + obs.h * 0.2, obs.x + obs.w * 0.35, obs.y + obs.h * 0.8);
    stroke(40, 40, 45);
    strokeWeight(1);
    line(obs.x + obs.w * 0.32, obs.y + obs.h * 0.2, obs.x + obs.w * 0.37, obs.y + obs.h * 0.8);
    
    // Exposed rebar (rusty orange)
    stroke(140, 70, 30);
    strokeWeight(2);
    line(obs.x + obs.w * 0.1, obs.y + obs.h * 0.5, obs.x + obs.w * 0.1, obs.y + obs.h);
    line(obs.x + obs.w * 0.85, obs.y + obs.h * 0.3, obs.x + obs.w * 0.85, obs.y + obs.h);
    
    // Broken top edge (jagged rubble)
    stroke(45, 45, 50);
    strokeWeight(2);
    noFill();
    beginShape();
    vertex(obs.x, obs.y);
    vertex(obs.x + obs.w * 0.15, obs.y - 15);
    vertex(obs.x + obs.w * 0.3, obs.y - 5);
    vertex(obs.x + obs.w * 0.5, obs.y - 20);
    vertex(obs.x + obs.w * 0.7, obs.y - 8);
    vertex(obs.x + obs.w * 0.85, obs.y - 12);
    vertex(obs.x + obs.w, obs.y - 3);
    endShape();
  } else if (style === 'tallBuilding') {
    // Tall standing building - brutalist concrete tower
    fill(60, 60, 65);
    stroke(40, 40, 45);
    strokeWeight(4);
    rect(obs.x, obs.y, obs.w, obs.h);
    
    // Concrete panel lines (brutalist architecture)
    stroke(50, 50, 55);
    strokeWeight(2);
    for (let i = 0; i < obs.h; i += 50) {
      line(obs.x, obs.y + i, obs.x + obs.w, obs.y + i);
    }
    
    // Vertical columns
    stroke(55, 55, 60);
    strokeWeight(3);
    line(obs.x + obs.w * 0.25, obs.y, obs.x + obs.w * 0.25, obs.y + obs.h);
    line(obs.x + obs.w * 0.5, obs.y, obs.x + obs.w * 0.5, obs.y + obs.h);
    line(obs.x + obs.w * 0.75, obs.y, obs.x + obs.w * 0.75, obs.y + obs.h);
    
    // Weathering stains (darker streaks)
    noStroke();
    fill(40, 40, 45, 120);
    rect(obs.x + obs.w * 0.1, obs.y + obs.h * 0.3, obs.w * 0.15, obs.h * 0.5);
    rect(obs.x + obs.w * 0.6, obs.y + obs.h * 0.2, obs.w * 0.2, obs.h * 0.6);
    
    // Edge highlights
    stroke(70, 70, 75);
    strokeWeight(2);
    line(obs.x, obs.y, obs.x, obs.y + obs.h);
    line(obs.x + obs.w, obs.y, obs.x + obs.w, obs.y + obs.h);
  } else if (style === 'brokenWindow') {
    // Broken/shattered windows - more detail
    fill(25, 30, 40, 180);
    stroke(45, 45, 50);
    strokeWeight(2);
    rect(obs.x, obs.y, obs.w, obs.h);
    
    // Window frame
    noFill();
    stroke(35, 35, 40);
    strokeWeight(1);
    rect(obs.x + 2, obs.y + 2, obs.w - 4, obs.h - 4);
    
    // Broken glass shards
    stroke(60, 65, 75, 150);
    strokeWeight(2);
    line(obs.x + obs.w * 0.2, obs.y, obs.x + obs.w * 0.7, obs.y + obs.h);
    line(obs.x + obs.w * 0.8, obs.y, obs.x + obs.w * 0.3, obs.y + obs.h);
    line(obs.x, obs.y + obs.h * 0.5, obs.x + obs.w, obs.y + obs.h * 0.5);
    
    // Dark interior visible through broken glass
    noStroke();
    fill(10, 15, 20, 200);
    ellipse(obs.x + obs.w / 2, obs.y + obs.h / 2, obs.w * 0.4, obs.h * 0.4);
  } else if (style === 'skeleton') {
    // Skeleton decoration for King's chamber
    push();
    fill(220, 220, 200);
    stroke(180, 180, 160);
    strokeWeight(2);
    // Skull
    ellipse(obs.x + obs.w/2, obs.y + 20, 30, 35);
    // Body/ribcage
    rect(obs.x + obs.w/2 - 15, obs.y + 35, 30, 40);
    // Pelvis
    rect(obs.x + obs.w/2 - 12, obs.y + 75, 24, 20);
    // Arms (lines)
    line(obs.x + obs.w/2 - 15, obs.y + 40, obs.x + obs.w/2 - 30, obs.y + 60);
    line(obs.x + obs.w/2 + 15, obs.y + 40, obs.x + obs.w/2 + 30, obs.y + 60);
    // Legs (lines)
    line(obs.x + obs.w/2 - 10, obs.y + 95, obs.x + obs.w/2 - 15, obs.y + obs.h);
    line(obs.x + obs.w/2 + 10, obs.y + 95, obs.x + obs.w/2 + 15, obs.y + obs.h);
    pop();
  } else if (style === 'greedSoul') {
    // Soul of Greed - ethereal floating orb
    push();
    let pulse = sin(frameCount * 0.05) * 20 + 200;
    
    // Outer glow
    noStroke();
    fill(50, 255, 100, 50);
    ellipse(obs.x + obs.w/2, obs.y + obs.h/2, obs.w * 1.5, obs.h * 1.5);
    
    // Middle glow
    fill(80, pulse, 120, 150);
    ellipse(obs.x + obs.w/2, obs.y + obs.h/2, obs.w * 1.2, obs.h * 1.2);
    
    // Core orb with slight float animation
    let floatOffset = sin(frameCount * 0.03) * 5;
    fill(150, 255, 180, 220);
    stroke(200, 255, 200);
    strokeWeight(2);
    ellipse(obs.x + obs.w/2, obs.y + obs.h/2 + floatOffset, obs.w * 0.8, obs.h * 0.8);
    
    // Inner sparkle
    noStroke();
    fill(255, 255, 255, pulse);
    ellipse(obs.x + obs.w/2, obs.y + obs.h/2 + floatOffset, obs.w * 0.3, obs.h * 0.3);
    
    pop();
  } else if (style === 'ladder') {
    // Ladder hole back down to level 1 - circular hole with small ladder poking out
    push();
    let centerX = obs.x + obs.w / 2;
    let centerY = obs.y + obs.h / 2;
    let holeRadius = min(obs.w, obs.h) / 2 - 5;
    
    // Dark circular hole background
    fill(10, 10, 15);
    noStroke();
    ellipse(centerX, centerY, holeRadius * 2, holeRadius * 2);
    
    // Hole border (dark circle)
    stroke(40, 30, 50);
    strokeWeight(3);
    noFill();
    ellipse(centerX, centerY, holeRadius * 2, holeRadius * 2);
    
    // Inner dark ring
    stroke(20, 15, 25);
    strokeWeight(2);
    ellipse(centerX, centerY, holeRadius * 1.6, holeRadius * 1.6);
    
    // Small ladder inside the hole (visible at the top)
    fill(120, 90, 60);
    stroke(80, 60, 40);
    strokeWeight(2);
    
    // Vertical rails (inside the hole, visible at top)
    let railWidth = 6;
    let railSpacing = holeRadius * 0.4;
    let railHeight = holeRadius * 0.6; // Height visible inside hole
    
    // Position ladder so top rungs are visible near the top of the hole
    let ladderTopY = centerY - holeRadius + 10; // Start near top of hole
    
    rect(centerX - railSpacing - railWidth/2, ladderTopY, railWidth, railHeight);
    rect(centerX + railSpacing - railWidth/2, ladderTopY, railWidth, railHeight);
    
    // Horizontal rungs (just top few visible inside hole)
    for (let i = 0; i < railHeight; i += 15) {
      rect(centerX - railSpacing - railWidth/2, ladderTopY + i, railSpacing * 2 + railWidth, 3);
    }
    
    // Interaction hint
    fill(255, 255, 255, 200);
    textAlign(CENTER, BOTTOM);
    textSize(9);
    text('Press E', centerX, obs.y - 5);
    pop();
  } else if (style === 'statue') {
    // Statue - petrified building (stone-like)
    push();
    // Base stone color (gray stone)
    fill(70, 70, 75);
    stroke(50, 50, 55);
    strokeWeight(3);
    rect(obs.x, obs.y, obs.w, obs.h);
    
    // Stone texture with cracks
    stroke(60, 60, 65);
    strokeWeight(1);
    for (let y = 0; y < obs.h; y += 30) {
      line(obs.x, obs.y + y, obs.x + obs.w, obs.y + y);
    }
    
    // Vertical cracks (petrification effect)
    stroke(50, 50, 55);
    strokeWeight(2);
    line(obs.x + obs.w * 0.3, obs.y, obs.x + obs.w * 0.3, obs.y + obs.h);
    line(obs.x + obs.w * 0.6, obs.y, obs.x + obs.w * 0.6, obs.y + obs.h);
    line(obs.x + obs.w * 0.9, obs.y, obs.x + obs.w * 0.9, obs.y + obs.h);
    
    // Petrified windows (blocked with stone)
    noStroke();
    fill(60, 60, 65, 200);
    for (let wy = obs.y + 20; wy < obs.y + obs.h - 50; wy += 50) {
      for (let wx = obs.x + 15; wx < obs.x + obs.w - 20; wx += 35) {
        rect(wx, wy, 20, 30);
      }
    }
    
    // Weathering/aging effect (darker patches)
    fill(55, 55, 60, 150);
    rect(obs.x + obs.w * 0.2, obs.y + obs.h * 0.3, obs.w * 0.2, obs.h * 0.4);
    rect(obs.x + obs.w * 0.6, obs.y + obs.h * 0.2, obs.w * 0.25, obs.h * 0.5);
    
    pop();
  } else if (style === 'ghostTree') {
    // Ghost tree - dark trunk with white/pale leaves (bushy appearance)
    push();
    
    let centerX = obs.x + obs.w/2;
    // Use x and y position to create unique variation for each tree
    let seed = (obs.x * 7 + obs.y * 13) % 1000;
    let variation1 = (seed % 100) / 100; // 0 to 1
    let variation2 = ((seed * 17) % 100) / 100; // Another variation
    let variation3 = ((seed * 23) % 100) / 100; // Third variation
    let variation4 = ((seed * 31) % 100) / 100; // Fourth variation
    
    // Vary trunk width and height - MUCH MORE VARIATION
    let trunkW = obs.w * (0.22 + variation1 * 0.16); // 0.22 to 0.38 (wider range)
    let trunkH = obs.h * (0.55 + variation2 * 0.35); // 0.55 to 0.90 (some very short, some very tall)
    
    // Tree trunk - extends lower to connect with canopy
    fill(40, 35, 40);
    stroke(30, 25, 30);
    strokeWeight(2);
    rect(centerX - trunkW/2, obs.y + obs.h - trunkH, trunkW, trunkH);
    
    // Tree bark texture
    stroke(35, 30, 35);
    strokeWeight(1);
    for (let i = 0; i < trunkH; i += 15) {
      line(centerX - trunkW/2, obs.y + obs.h - trunkH + i, 
           centerX + trunkW/2, obs.y + obs.h - trunkH + i);
    }
    
    // Canopy positioned to connect with trunk top - always touch trunk
    // Trunk top is at: obs.y + obs.h - trunkH
    // Position canopy slightly overlapping with trunk top for connection
    let trunkTopY = obs.y + obs.h - trunkH;
    let canopyY = trunkTopY - obs.h * 0.15; // Canopy center slightly above trunk top for natural overlap
    let sphereSize = obs.w * (0.20 + variation1 * 0.10); // Vary sphere size more
    
    // Leaf density variation (some trees are sparse, some are dense)
    let leafDensity = variation4; // 0 to 1, where 0 is very sparse, 1 is very dense
    
    // Branches with leaves (most trees have branches, 20% have none)
    let branchCount = 0;
    if (variation1 > 0.2) { // 80% have branches
      if (variation2 > 0.7) {
        branchCount = 3; // Some have 3 branches
      } else if (variation2 > 0.35) {
        branchCount = 2; // Many have 2 branches
      } else {
        branchCount = 1; // Some have 1 branch
      }
    }
    
    if (branchCount >= 1) {
      // Left branch - explicit 45-degree line from middle of trunk
      stroke(50, 45, 50);
      strokeWeight(4);
      noFill();
      let branchStartY = trunkTopY + trunkH * 0.5; // Middle of trunk
      let branchLength = obs.w * 0.8;
      let leftBranchX = centerX - branchLength;
      let leftBranchY = branchStartY - branchLength; // 45 degrees up-left
      line(centerX, branchStartY, leftBranchX, leftBranchY);
      
      // Puffy cloud of leaves at end of branch
      noStroke();
      // Back layer
      fill(200, 200, 210);
      circle(leftBranchX - sphereSize * 0.4, leftBranchY, sphereSize * 1.4);
      circle(leftBranchX + sphereSize * 0.4, leftBranchY, sphereSize * 1.4);
      // Middle layer
      fill(220, 220, 230);
      circle(leftBranchX, leftBranchY - sphereSize * 0.3, sphereSize * 1.5);
      circle(leftBranchX - sphereSize * 0.25, leftBranchY + sphereSize * 0.2, sphereSize * 1.3);
      circle(leftBranchX + sphereSize * 0.25, leftBranchY + sphereSize * 0.2, sphereSize * 1.3);
      // Front layer
      fill(245, 245, 255);
      circle(leftBranchX, leftBranchY, sphereSize * 1.6);
      circle(leftBranchX - sphereSize * 0.15, leftBranchY - sphereSize * 0.15, sphereSize * 1.2);
      circle(leftBranchX + sphereSize * 0.15, leftBranchY - sphereSize * 0.15, sphereSize * 1.2);
      // Highlights
      fill(255, 255, 255);
      circle(leftBranchX, leftBranchY - sphereSize * 0.2, sphereSize * 0.7);
      circle(leftBranchX - sphereSize * 0.1, leftBranchY + sphereSize * 0.1, sphereSize * 0.5);
    }
    
    if (branchCount >= 2) {
      // Right branch - explicit 45-degree line from middle of trunk
      stroke(50, 45, 50);
      strokeWeight(4);
      noFill();
      let branchStartY = trunkTopY + trunkH * 0.45; // Slightly higher than left
      let branchLength = obs.w * 0.85;
      let rightBranchX = centerX + branchLength;
      let rightBranchY = branchStartY - branchLength; // 45 degrees up-right
      line(centerX, branchStartY, rightBranchX, rightBranchY);
      
      // Puffy cloud of leaves at end of branch
      noStroke();
      // Back layer
      fill(200, 200, 210);
      circle(rightBranchX - sphereSize * 0.4, rightBranchY, sphereSize * 1.4);
      circle(rightBranchX + sphereSize * 0.4, rightBranchY, sphereSize * 1.4);
      // Middle layer
      fill(220, 220, 230);
      circle(rightBranchX, rightBranchY - sphereSize * 0.3, sphereSize * 1.5);
      circle(rightBranchX - sphereSize * 0.25, rightBranchY + sphereSize * 0.2, sphereSize * 1.3);
      circle(rightBranchX + sphereSize * 0.25, rightBranchY + sphereSize * 0.2, sphereSize * 1.3);
      // Front layer
      fill(245, 245, 255);
      circle(rightBranchX, rightBranchY, sphereSize * 1.6);
      circle(rightBranchX - sphereSize * 0.15, rightBranchY - sphereSize * 0.15, sphereSize * 1.2);
      circle(rightBranchX + sphereSize * 0.15, rightBranchY - sphereSize * 0.15, sphereSize * 1.2);
      // Highlights
      fill(255, 255, 255);
      circle(rightBranchX, rightBranchY - sphereSize * 0.2, sphereSize * 0.7);
      circle(rightBranchX + sphereSize * 0.1, rightBranchY + sphereSize * 0.1, sphereSize * 0.5);
    }
    
    if (branchCount >= 3) {
      // Upper branch - shorter, 45-degree line from upper trunk
      stroke(50, 45, 50);
      strokeWeight(3.5);
      noFill();
      let branchStartY = trunkTopY + trunkH * 0.25; // Upper trunk
      let branchLength = obs.w * 0.6;
      let upperBranchX = centerX + (variation1 > 0.5 ? branchLength : -branchLength);
      let upperBranchY = branchStartY - branchLength; // 45 degrees
      line(centerX, branchStartY, upperBranchX, upperBranchY);
      
      // Smaller puffy cloud of leaves
      noStroke();
      // Back layer
      fill(200, 200, 210);
      circle(upperBranchX - sphereSize * 0.3, upperBranchY, sphereSize * 1.1);
      circle(upperBranchX + sphereSize * 0.3, upperBranchY, sphereSize * 1.1);
      // Middle layer
      fill(220, 220, 230);
      circle(upperBranchX, upperBranchY - sphereSize * 0.25, sphereSize * 1.3);
      circle(upperBranchX - sphereSize * 0.2, upperBranchY + sphereSize * 0.15, sphereSize * 1.0);
      circle(upperBranchX + sphereSize * 0.2, upperBranchY + sphereSize * 0.15, sphereSize * 1.0);
      // Front layer
      fill(245, 245, 255);
      circle(upperBranchX, upperBranchY, sphereSize * 1.3);
      circle(upperBranchX - sphereSize * 0.1, upperBranchY - sphereSize * 0.1, sphereSize * 0.9);
      // Highlights
      fill(255, 255, 255);
      circle(upperBranchX, upperBranchY - sphereSize * 0.15, sphereSize * 0.5);
    }
    
    // Main canopy - White/pale leaves - bushy clusters using solid circles (no opacity)
    // Leaf count varies based on leafDensity
    noStroke();
    
    // Vary the canopy shape and density based on variation
    let spreadX = 0.30 + variation1 * 0.15; // Horizontal spread variation (wider range)
    let spreadY = 0.04 + variation2 * 0.04; // Vertical spread variation
    
    // Back layer - darker white spheres (only if dense enough)
    if (leafDensity > 0.3) {
      fill(200, 200, 210);
      circle(centerX - obs.w * spreadX * 1.1, canopyY + obs.h * spreadY, sphereSize * (1.3 + variation1 * 0.3));
      circle(centerX + obs.w * spreadX * 1.1, canopyY + obs.h * spreadY, sphereSize * (1.3 + variation2 * 0.3));
      if (leafDensity > 0.5) {
        circle(centerX - obs.w * 0.25, canopyY - obs.h * 0.02, sphereSize * (1.2 + variation3 * 0.3));
        circle(centerX + obs.w * 0.25, canopyY - obs.h * 0.02, sphereSize * (1.2 + variation1 * 0.3));
      }
    }
    
    // Middle layer - medium white spheres (always present, but count varies)
    fill(220, 220, 230);
    circle(centerX - obs.w * spreadX, canopyY, sphereSize * (1.4 + variation2 * 0.3));
    circle(centerX + obs.w * spreadX, canopyY, sphereSize * (1.4 + variation3 * 0.3));
    circle(centerX, canopyY - obs.h * 0.1, sphereSize * (1.5 + variation3 * 0.3)); // Main top
    
    // Bottom connection circles - ensure leaves touch trunk (always present)
    circle(centerX, canopyY + obs.h * 0.08, sphereSize * (1.3 + variation1 * 0.2)); // Center bottom, connects to trunk
    circle(centerX - obs.w * 0.12, canopyY + obs.h * 0.05, sphereSize * (1.1 + variation2 * 0.2)); // Left bottom
    circle(centerX + obs.w * 0.12, canopyY + obs.h * 0.05, sphereSize * (1.1 + variation3 * 0.2)); // Right bottom
    
    if (leafDensity > 0.4) {
      circle(centerX - obs.w * 0.15, canopyY - obs.h * 0.05, sphereSize * (1.3 + variation1 * 0.3));
      circle(centerX + obs.w * 0.15, canopyY - obs.h * 0.05, sphereSize * (1.3 + variation2 * 0.3));
    }
    
    if (leafDensity > 0.5) {
      circle(centerX - obs.w * 0.2, canopyY + obs.h * spreadY, sphereSize * 1.2);
      circle(centerX + obs.w * 0.2, canopyY + obs.h * spreadY, sphereSize * 1.2);
    }
    
    // Front layer - bright white spheres (count varies with density)
    fill(245, 245, 255);
    if (leafDensity > 0.2) {
      circle(centerX - obs.w * 0.28, canopyY - obs.h * 0.02, sphereSize * (1.0 + variation1 * 0.3));
      circle(centerX + obs.w * 0.28, canopyY - obs.h * 0.02, sphereSize * (1.0 + variation2 * 0.3));
    }
    
    circle(centerX, canopyY, sphereSize * (1.3 + variation2 * 0.3)); // Main center, always present
    
    if (leafDensity > 0.4) {
      circle(centerX - obs.w * 0.1, canopyY - obs.h * 0.06, sphereSize * (1.2 + variation3 * 0.3));
      circle(centerX + obs.w * 0.1, canopyY - obs.h * 0.06, sphereSize * (1.2 + variation1 * 0.3));
    }
    
    // Highlight spheres - pure white, smaller (only on denser trees)
    if (leafDensity > 0.5) {
      fill(255, 255, 255);
      circle(centerX - obs.w * (0.18 + variation1 * 0.08), canopyY - obs.h * 0.04, sphereSize * 0.6);
      circle(centerX + obs.w * (0.18 + variation2 * 0.08), canopyY - obs.h * 0.04, sphereSize * 0.6);
      circle(centerX + (variation3 - 0.5) * obs.w * 0.1, canopyY - obs.h * 0.08, sphereSize * 0.7);
    }
    
    if (leafDensity > 0.7) {
      fill(255, 255, 255);
      circle(centerX - obs.w * 0.08, canopyY + obs.h * 0.02, sphereSize * 0.5);
      circle(centerX + obs.w * 0.08, canopyY + obs.h * 0.02, sphereSize * 0.5);
    }
    
    pop();
  } else if (style === 'woodWall') {
    // Wooden walls for Sorrow's cabin interior
    push();
    fill(80, 60, 40);
    stroke(60, 45, 30);
    strokeWeight(3);
    rect(obs.x, obs.y, obs.w, obs.h);
    
    // Horizontal log planks
    stroke(70, 50, 35);
    strokeWeight(2);
    for (let y = 0; y < obs.h; y += 20) {
      line(obs.x, obs.y + y, obs.x + obs.w, obs.y + y);
    }
    
    // Wood grain texture (vertical lines)
    stroke(75, 55, 38);
    strokeWeight(1);
    for (let x = 0; x < obs.w; x += 30) {
      line(obs.x + x, obs.y, obs.x + x, obs.y + obs.h);
    }
    pop();
  } else if (style === 'woodenCabin') {
    // Wooden log cabin
    push();
    
    // Main cabin body (horizontal logs)
    fill(80, 60, 40);
    stroke(60, 45, 30);
    strokeWeight(3);
    rect(obs.x, obs.y, obs.w, obs.h);
    
    // Log lines (horizontal planks)
    stroke(70, 50, 35);
    strokeWeight(2);
    for (let y = 0; y < obs.h; y += 20) {
      line(obs.x, obs.y + y, obs.x + obs.w, obs.y + y);
    }
    
    // Vertical log ends on corners
    fill(70, 50, 35);
    noStroke();
    rect(obs.x - 5, obs.y, 10, obs.h);
    rect(obs.x + obs.w - 5, obs.y, 10, obs.h);
    
    // Windows
    fill(20, 15, 10, 200);
    stroke(50, 40, 25);
    strokeWeight(2);
    rect(obs.x + 20, obs.y + 30, 35, 35);
    rect(obs.x + obs.w - 55, obs.y + 30, 35, 35);
    
    // Window panes (cross)
    stroke(60, 50, 35);
    strokeWeight(1);
    line(obs.x + 37.5, obs.y + 30, obs.x + 37.5, obs.y + 65);
    line(obs.x + 20, obs.y + 47.5, obs.x + 55, obs.y + 47.5);
    line(obs.x + obs.w - 37.5, obs.y + 30, obs.x + obs.w - 37.5, obs.y + 65);
    line(obs.x + obs.w - 55, obs.y + 47.5, obs.x + obs.w - 20, obs.y + 47.5);
    
    pop();
  } else if (style === 'cabinRoof') {
    // Cabin roof (peaked/slanted)
    push();
    
    fill(60, 45, 30);
    stroke(40, 30, 20);
    strokeWeight(2);
    
    // Roof as triangle/trapezoid
    beginShape();
    vertex(obs.x, obs.y + obs.h);
    vertex(obs.x + obs.w / 2, obs.y);
    vertex(obs.x + obs.w, obs.y + obs.h);
    endShape(CLOSE);
    
    // Roof shingles
    stroke(50, 35, 25);
    strokeWeight(1);
    for (let i = 0; i < obs.h; i += 8) {
      line(obs.x + i, obs.y + obs.h - i/2, obs.x + obs.w / 2, obs.y + i);
      line(obs.x + obs.w - i, obs.y + obs.h - i/2, obs.x + obs.w / 2, obs.y + i);
    }
    
    pop();
  } else if (style === 'chimney') {
    // Stone chimney
    push();
    
    fill(90, 85, 90);
    stroke(70, 65, 70);
    strokeWeight(2);
    rect(obs.x, obs.y, obs.w, obs.h);
    
    // Stone texture
    stroke(80, 75, 80);
    strokeWeight(1);
    for (let y = 0; y < obs.h; y += 15) {
      line(obs.x, obs.y + y, obs.x + obs.w, obs.y + y);
    }
    
    // Chimney top
    fill(100, 95, 100);
    rect(obs.x - 3, obs.y, obs.w + 6, 8);
    
    pop();
  } else if (style === 'campfire') {
    // Campfire with flickering flames
    push();
    
    let centerX = obs.x + obs.w / 2;
    let centerY = obs.y + obs.h / 2;
    
    // Logs at base
    fill(60, 45, 30);
    stroke(40, 30, 20);
    strokeWeight(2);
    rect(centerX - 25, centerY + 10, 50, 8);
    rect(centerX - 20, centerY + 5, 8, 40);
    rect(centerX + 12, centerY + 5, 8, 40);
    
    // Fire flames (animated)
    noStroke();
    let flicker = sin(frameCount * 0.1) * 5;
    
    // Orange outer flame
    fill(255, 140, 0, 200);
    ellipse(centerX, centerY - 5 + flicker, 35, 45);
    ellipse(centerX - 10, centerY + flicker, 30, 40);
    ellipse(centerX + 10, centerY + flicker, 30, 40);
    
    // Yellow middle flame
    fill(255, 200, 0, 220);
    ellipse(centerX, centerY - 8 + flicker, 25, 35);
    ellipse(centerX - 8, centerY - 3 + flicker, 20, 30);
    ellipse(centerX + 8, centerY - 3 + flicker, 20, 30);
    
    // White hot core
    fill(255, 255, 200, 240);
    ellipse(centerX, centerY - 5 + flicker, 12, 20);
    
    // Embers rising
    fill(255, 100, 0, 150);
    let ember1Y = centerY - 30 - (frameCount * 0.5) % 40;
    let ember2Y = centerY - 35 - (frameCount * 0.7) % 45;
    ellipse(centerX + 5, ember1Y, 3, 3);
    ellipse(centerX - 7, ember2Y, 2, 2);
    
    // Glow on ground
    fill(255, 140, 0, 50);
    ellipse(centerX, centerY + 20, 80, 30);
    
    pop();
  } else if (style === 'lavaLake') {
    // Animated lava lake made of organic ellipses
    push();
    noStroke();
    
    let lavaFlicker = sin(frameCount * 0.05) * 10;
    let centerX = obs.x + obs.w / 2;
    let centerY = obs.y + obs.h / 2;
    
    // Draw multiple overlapping ellipses to create organic lake shape
    // Large center pool
    fill(255, 80 + lavaFlicker, 0);
    ellipse(centerX, centerY, obs.w * 0.8, obs.h * 0.7);
    
    // Additional pools around the edges
    fill(255, 90 + lavaFlicker, 10);
    ellipse(centerX - obs.w * 0.25, centerY - obs.h * 0.15, obs.w * 0.5, obs.h * 0.5);
    ellipse(centerX + obs.w * 0.25, centerY - obs.h * 0.15, obs.w * 0.5, obs.h * 0.5);
    ellipse(centerX - obs.w * 0.2, centerY + obs.h * 0.2, obs.w * 0.45, obs.h * 0.45);
    ellipse(centerX + obs.w * 0.2, centerY + obs.h * 0.2, obs.w * 0.45, obs.h * 0.45);
    
    // Smaller connecting pools
    fill(255, 100 + lavaFlicker, 20, 200);
    ellipse(centerX - obs.w * 0.35, centerY, obs.w * 0.3, obs.h * 0.35);
    ellipse(centerX + obs.w * 0.35, centerY, obs.w * 0.3, obs.h * 0.35);
    ellipse(centerX, centerY - obs.h * 0.25, obs.w * 0.35, obs.h * 0.3);
    ellipse(centerX, centerY + obs.h * 0.25, obs.w * 0.35, obs.h * 0.3);
    
    // Hot spots (brighter areas)
    fill(255, 150 + lavaFlicker, 50, 180);
    ellipse(centerX + obs.w * 0.1, centerY - obs.h * 0.1, obs.w * 0.2, obs.h * 0.2);
    ellipse(centerX - obs.w * 0.15, centerY + obs.h * 0.05, obs.w * 0.15, obs.h * 0.15);
    
    // Lava bubbles (animated)
    fill(255, 120, 20, 150);
    let bubble1Y = obs.y + (frameCount * 2) % obs.h;
    let bubble2Y = obs.y + (frameCount * 3 + 50) % obs.h;
    let bubble3Y = obs.y + (frameCount * 2.5 + 100) % obs.h;
    ellipse(obs.x + obs.w * 0.3, bubble1Y, 20, 20);
    ellipse(obs.x + obs.w * 0.7, bubble2Y, 15, 15);
    ellipse(centerX, bubble3Y, 18, 18);
    
    pop();
  } else if (style === 'ghostfireLake') {
    // Ghostfire lake - rectangular with white ghostly flames surrounding the platform
    push();
    
    // Base rectangle - dark purple/blue
    fill(30, 20, 50);
    noStroke();
    rect(obs.x, obs.y, obs.w, obs.h);
    
    // Multiple white ghostfire flames scattered across the lake to surround Sans
    let flicker = sin(frameCount * 0.1) * 5;
    
    // Create flames distributed around the lake (above, below, and sides of platform)
    // Platform is at Y+30 with height 60 (Y+30 to Y+90)
    for (let i = 0; i < 15; i++) {
      let flameX = obs.x + (obs.w / 16) * (i + 1);
      // Distribute flames at different heights - some above platform area, most below
      let verticalOffset;
      if (i % 3 === 0) {
        verticalOffset = obs.h * 0.15; // Higher flames (rare)
      } else if (i % 3 === 1) {
        verticalOffset = obs.h * 0.45; // Mid-level flames
      } else {
        verticalOffset = obs.h * 0.7; // Lower flames (more common)
      }
      let flameY = obs.y + verticalOffset + sin(frameCount * 0.05 + i) * 20;
      
      // White/pale ghostly flames (like campfire but white)
      noStroke();
      
      // Outer white flame
      fill(255, 255, 255, 150 + sin(frameCount * 0.1 + i) * 50);
      ellipse(flameX, flameY - 5 + flicker, 25, 35);
      ellipse(flameX - 8, flameY + flicker, 20, 30);
      ellipse(flameX + 8, flameY + flicker, 20, 30);
      
      // Pale blue inner flame
      fill(200, 220, 255, 180 + sin(frameCount * 0.1 + i) * 50);
      ellipse(flameX, flameY - 8 + flicker, 18, 28);
      ellipse(flameX - 6, flameY - 3 + flicker, 15, 25);
      ellipse(flameX + 6, flameY - 3 + flicker, 15, 25);
      
      // Bright white core
      fill(255, 255, 255, 220);
      ellipse(flameX, flameY - 5 + flicker, 8, 15);
    }
    
    pop();
  } else if (style === 'woodenPlanks') {
    // Wooden planks over ghostfire lake
    push();
    
    fill(101, 67, 33);
    stroke(70, 45, 20);
    strokeWeight(2);
    rect(obs.x, obs.y, obs.w, obs.h, 5);
    
    // Plank details (horizontal lines)
    stroke(85, 55, 25);
    strokeWeight(3);
    for (let i = 1; i < 5; i++) {
      let y = obs.y + (obs.h / 5) * i;
      line(obs.x, y, obs.x + obs.w, y);
    }
    
    // Nail details
    fill(60, 60, 60);
    noStroke();
    let nailSize = 6;
    for (let i = 0; i < 6; i++) {
      let x = obs.x + (obs.w / 6) * i + 20;
      ellipse(x, obs.y + 15, nailSize, nailSize);
      ellipse(x, obs.y + obs.h - 15, nailSize, nailSize);
    }
    
    pop();
  } else if (style === 'lavaCave') {
    // Cave entrance - rocky formation with dark opening
    push();
    
    const centerX = obs.x + obs.w / 2;
    const centerY = obs.y + obs.h / 2;
    const caveWidth = obs.w * 1.3;
    const caveHeight = obs.h * 1.1;
    
    // 1. Sandy/stone island base (horizontal platform for landing) - LARGER and OPAQUE
    noStroke();
    fill(110, 100, 85, 255); // Fully opaque
    // Horizontal ellipse for landing platform - larger and more visible
    ellipse(centerX, centerY + caveHeight * 0.25, caveWidth * 1.5, caveHeight * 0.5);
    
    // 2. Build up rocky formation with multiple overlapping stones
    // Back layer - darker rocks (opaque)
    fill(75, 70, 65, 255);
    ellipse(centerX - caveWidth * 0.25, centerY - caveHeight * 0.1, caveWidth * 0.35, caveHeight * 0.45);
    ellipse(centerX + caveWidth * 0.25, centerY - caveHeight * 0.05, caveWidth * 0.3, caveHeight * 0.4);
    
    // Middle layer - medium gray rocks (opaque)
    fill(85, 80, 75, 255);
    ellipse(centerX - caveWidth * 0.35, centerY + caveHeight * 0.05, caveWidth * 0.3, caveHeight * 0.4);
    ellipse(centerX + caveWidth * 0.32, centerY + caveHeight * 0.1, caveWidth * 0.32, caveHeight * 0.42);
    ellipse(centerX - caveWidth * 0.15, centerY - caveHeight * 0.05, caveWidth * 0.35, caveHeight * 0.38);
    ellipse(centerX + caveWidth * 0.12, centerY - caveHeight * 0.08, caveWidth * 0.33, caveHeight * 0.4);
    
    // 3. Front layer - lighter rocks framing the entrance (draw BEFORE entrance so entrance is on top, opaque)
    fill(95, 90, 80, 255);
    // Left front rock
    ellipse(centerX - caveWidth * 0.28, centerY + caveHeight * 0.18, caveWidth * 0.25, caveHeight * 0.35);
    // Right front rock
    ellipse(centerX + caveWidth * 0.28, centerY + caveHeight * 0.22, caveWidth * 0.27, caveHeight * 0.37);
    // Bottom center rocks
    ellipse(centerX - caveWidth * 0.08, centerY + caveHeight * 0.3, caveWidth * 0.22, caveHeight * 0.25);
    ellipse(centerX + caveWidth * 0.1, centerY + caveHeight * 0.32, caveWidth * 0.2, caveHeight * 0.23);
    
    // 4. Add darker shadows/crevices for depth
    fill(50, 45, 40, 150);
    ellipse(centerX - caveWidth * 0.22, centerY + caveHeight * 0.08, caveWidth * 0.15, caveHeight * 0.2);
    ellipse(centerX + caveWidth * 0.2, centerY + caveHeight * 0.12, caveWidth * 0.13, caveHeight * 0.18);
    
    // 5. Add subtle highlights on rocks
    fill(115, 110, 95, 120);
    ellipse(centerX - caveWidth * 0.32, centerY + caveHeight * 0.1, caveWidth * 0.12, caveHeight * 0.15);
    ellipse(centerX + caveWidth * 0.25, centerY + caveHeight * 0.15, caveWidth * 0.1, caveHeight * 0.13);
    ellipse(centerX, centerY - caveHeight * 0.15, caveWidth * 0.15, caveHeight * 0.18);
    
    // 6. Black cave entrance (arch shape) - DRAWN LAST so it's on top, moved down a bit
    fill(0, 0, 0, 255); // Fully opaque black
    // Main entrance opening - use arc to create arch, positioned lower
    arc(centerX, centerY + caveHeight * 0.18, caveWidth * 0.42, caveHeight * 0.55, PI, TWO_PI);
    
    pop();
  } else if (style === 'lavaStone') {
    // Stepping stone with variation
    push();
    
    const centerX = obs.x + obs.w / 2;
    const centerY = obs.y + obs.h / 2;
    
    // Check if this is the island stone (larger platform for cave)
    if (obs.type === 'island') {
      // Island stone - darker, larger, always vertical
      fill(85, 80, 75);
      stroke(60, 55, 50);
      strokeWeight(3);
      // Draw as vertical ellipse (h should be larger than w for vertical)
      ellipse(centerX, centerY, obs.w, obs.h);
      
      // Add highlights
      fill(105, 100, 90, 100);
      noStroke();
      ellipse(centerX - 8, centerY - 10, obs.w * 0.4, obs.h * 0.35);
      
      // Add texture
      fill(70, 65, 60, 80);
      ellipse(centerX + obs.w * 0.15, centerY + obs.h * 0.1, obs.w * 0.2, obs.h * 0.15);
    } else {
      // Regular stepping stones with variation
      // Use position to create consistent but varied stones
      const variation = (obs.x * 0.1 + obs.y * 0.1) % 1;
      const shapeVariation = (obs.x * 0.05 + obs.y * 0.15) % 1;
      
      // Vary the base color
      const baseGray = 95 + variation * 15;
      fill(baseGray, baseGray, baseGray);
      stroke(70, 70, 70);
      strokeWeight(2);
      
      // Draw main stone - some circular, some more elliptical
      if (shapeVariation < 0.3) {
        // Mostly circular
        ellipse(centerX, centerY, obs.w, obs.h);
      } else if (shapeVariation < 0.6) {
        // Horizontally stretched
        ellipse(centerX, centerY, obs.w * 1.15, obs.h * 0.9);
      } else {
        // Vertically stretched
        ellipse(centerX, centerY, obs.w * 0.9, obs.h * 1.15);
      }
      
      // Highlight with variation
      const highlightGray = 125 + variation * 10;
      fill(highlightGray, highlightGray, highlightGray, 100);
      noStroke();
      const highlightOffset = 3 + variation * 4;
      ellipse(centerX - highlightOffset, centerY - highlightOffset, 
              obs.w * (0.4 + variation * 0.15), obs.h * (0.4 + variation * 0.15));
      
      // Add some texture spots
      if (shapeVariation > 0.5) {
        fill(80, 80, 80, 60);
        ellipse(centerX + obs.w * 0.2, centerY + obs.h * 0.15, obs.w * 0.15, obs.h * 0.15);
      }
    }
    
    pop();
  } else if (style === 'caveWall') {
    // Gray cave walls
    push();
    fill(60, 60, 60);
    stroke(40, 40, 40);
    strokeWeight(3);
    rect(obs.x, obs.y, obs.w, obs.h);
    // Rock texture
    fill(70, 70, 70);
    noStroke();
    for (let i = 0; i < 5; i++) {
      let rockX = obs.x + random(obs.w);
      let rockY = obs.y + random(obs.h);
      ellipse(rockX, rockY, 10, 10);
    }
    pop();
  } else if (style === 'piano') {
    // Temporary square for piano (will be replaced with actual piano later)
    push();
    fill(200, 200, 200);
    stroke(0);
    strokeWeight(3);
    rect(obs.x, obs.y, obs.w, obs.h);
    // Label
    fill(0);
    textAlign(CENTER, CENTER);
    textSize(10);
    text('PIANO', obs.x + obs.w / 2, obs.y + obs.h / 2);
    pop();
  } else {
    // Default style
    fill(80, 80, 80);
    stroke(255);
    strokeWeight(2);
    rect(obs.x, obs.y, obs.w, obs.h);
  }
}

function drawDoor(door) {
  // Check if this is a ghost door
  const isGhostDoor = door.isGhostDoor === true;
  
  // Check if this is the building door and soul is collected
  const isBuildingDoor = door.label === 'Tall Building';
  const buildingSealedOff = isBuildingDoor && hasGreedSoul;
  
  // Door frame
  if (buildingSealedOff) {
    fill(100, 100, 100); // Gray for sealed building
    stroke(120, 120, 120);
  } else if (isGhostDoor) {
    fill(200, 200, 220); // Light ghostly color
    stroke(220, 220, 240);
  } else {
    fill(60, 50, 40);
    stroke(40, 35, 30);
  }
  strokeWeight(3);
  rect(door.x, door.y, door.w, door.h);
  
  // Door panel
  if (buildingSealedOff) {
    fill(80, 80, 80); // Darker gray for sealed building panel
  } else if (door.locked) {
    if (isGhostDoor) {
      fill(150, 150, 170); // Darker ghost color for locked
    } else {
      fill(100, 70, 70); // Reddish for locked
    }
  } else {
    if (isGhostDoor) {
      fill(230, 230, 250, 200); // Bright ghostly white with transparency
    } else {
      fill(80, 70, 60); // Brown for unlocked
    }
  }
  rect(door.x + 5, door.y + 5, door.w - 10, door.h - 10);
  
  // Door handle
  if (buildingSealedOff) {
    fill(60, 60, 60); // Dark gray handle for sealed building
  } else if (isGhostDoor) {
    fill(255, 255, 255); // White handle for ghost doors
  } else {
    fill(200, 180, 100);
  }
  ellipse(door.x + door.w - 15, door.y + door.h / 2, 6, 6);
  
  // Door label (when player is nearby) - skip if building is sealed off
  if (!buildingSealedOff && dist(player.x, player.y, door.x + door.w / 2, door.y + door.h / 2) < 80) {
    fill(255, 255, 200);
    textAlign(CENTER);
    textSize(10);
    text(door.label, door.x + door.w / 2, door.y - 10);
    if (!door.locked) {
      // Ghost doors use dash, normal doors use E key
      if (isGhostDoor) {
        text('Dash to open', door.x + door.w / 2, door.y + door.h + 15);
      } else {
        text('Press E', door.x + door.w / 2, door.y + door.h + 15);
      }
      } else {
      // Door is locked - only show LOCKED text for Cabin Door
      if (door.label === 'Cabin Door') {
        fill(255, 100, 100); // Red color for locked
        text('LOCKED', door.x + door.w / 2, door.y + door.h + 15);
        fill(255, 255, 200);
        textSize(8);
        text('(Find a key)', door.x + door.w / 2, door.y + door.h + 28);
      }
      // Don't show LOCKED for other doors (like Door 2 to Dream Guardian's room)
    }
  }
}

function checkDoor2Interaction() {
  // Check for E key interaction with non-ghost doors
  for (let door of doors) {
    // Skip ghost doors (they require dash)
    if (door.isGhostDoor) continue;
    
      const doorCenterX = door.x + door.w / 2;
      const doorCenterY = door.y + door.h / 2;
      
      if (dist(player.x, player.y, doorCenterX, doorCenterY) < 50) {
        if (!door.locked) {
          // Transition to target area
        previousArea = currentArea;
          currentArea = door.targetArea;
          initWorld();
          switchMusic(); // Switch background music based on new area
          return true;
        } else {
          // Door is locked
          if (door.label === 'Cabin Door') {
            if (hasCabinKey) {
              // Player has the key - unlock the door
              doorUnlockSound.play();
              hasCabinKey = false; // Use up the key
              cabinUnlocked = true; // Permanently unlock the cabin
              door.locked = false; // Unlock this door instance
              showTemporaryMessage('The cabin door unlocks with a satisfying click.');
              
              return true; // Don't enter yet, let them press E again
            } else {
              // Player doesn't have the key
              doorLockSound.play();
              showTemporaryMessage('LOCKED');
              return false;
            }
        }
      }
    }
  }
  return false;
}

function checkDecorationInteraction() {
  // Don't allow interaction if cooldown is active
  if (dialogueCooldown > 0) {
    return false;
  }
  
  // Check for E key interaction with special decorations
  for (let dec of decorations) {
    if (dec.type === 'darkCageInteraction') {
      // Check if player is touching cage edges (same logic as checkCageCollision)
      const leftEdge = dec.x;
      const rightEdge = dec.x + dec.w;
      const bottomEdge = dec.y + dec.h;
      const topEdge = dec.y;
      
      const touchingLeft = player.x > leftEdge - 30 && player.x < leftEdge + 10 && player.y > topEdge && player.y < bottomEdge;
      const touchingRight = player.x > rightEdge - 10 && player.x < rightEdge + 30 && player.y > topEdge && player.y < bottomEdge;
      const touchingBottom = player.y > bottomEdge - 10 && player.y < bottomEdge + 30 && player.x > leftEdge && player.x < rightEdge;
      
      if (touchingLeft || touchingRight || touchingBottom) {
        // Create a simple dialogue based on soul count
        if (collectedSouls.length >= 5) {
          // Already handled by collision - cage opens
          return false;
        } else if (collectedSouls.length === 4) {
          // Show dialogue from Dream Guardian
          gameState = 'dialogue';
          currentDialogue = {
            speaker: 'Dream Guardian',
            text: 'Return to my sanctum, Ectopaws. We must speak.',
            choices: []
          };
          dialogueBox.displayedText = '';
          dialogueBox.textIndex = 0;
          dialogueBox.fullText = currentDialogue.text;
          dialogueBox.selectedChoice = 0;
          return true;
        } else {
          // Not enough souls
          gameState = 'dialogue';
          currentDialogue = {
            speaker: 'Dream Guardian',
            text: 'You need all 5 souls to open this cage.',
            choices: []
          };
          dialogueBox.displayedText = '';
          dialogueBox.textIndex = 0;
          dialogueBox.fullText = currentDialogue.text;
          dialogueBox.selectedChoice = 0;
          return true;
        }
      }
    } else if (dec.type === 'caveEntrance') {
      const decCenterX = dec.x + dec.w / 2;
      const decCenterY = dec.y + dec.h / 2;
      
      if (dist(player.x, player.y, decCenterX, decCenterY) < 80) {
        // Enter cave
        previousArea = currentArea;
        currentArea = dec.targetArea;
        initWorld();
        switchMusic(); // Switch background music based on new area
        return true;
      }
    }
  }
  return false;
}

// Temporary message display variables
let temporaryMessage = '';
let temporaryMessageTimer = 0;
let cageMessage = ''; // Special message for cage interactions (displayed center middle)
let cageMessageTimer = 0;

function showTemporaryMessage(message) {
  temporaryMessage = message;
  temporaryMessageTimer = 180; // 3 seconds at 60fps
}

function showCageMessage(message) {
  cageMessage = message;
  cageMessageTimer = 180; // 3 seconds at 60fps
}

function checkDoorDashCollision() {
  // Check if player is dashing into a door
  if (!player.isDashing) return false;
  
  for (let door of doors) {
    const doorCenterX = door.x + door.w / 2;
    const doorCenterY = door.y + door.h / 2;
    
    // Check if player is close to door while dashing
    if (dist(player.x, player.y, doorCenterX, doorCenterY) < 50) {
      if (!door.locked) {
        // Stop dash immediately to prevent continuing through door on other side
        player.isDashing = false;
        player.dashVx = 0;
        player.dashVy = 0;
        player.dashDuration = 0;
        player.dashCooldown = player.dashCooldownMax;
        player.canDash = false;
        
        // Transition to new area
        previousArea = currentArea;
        currentArea = door.targetArea;
        initWorld();
        switchMusic(); // Switch background music based on new area
        return true;
      }
    }
  }
  return false;
}

function drawWorld() {
  // Decrease dialogue cooldown
  if (dialogueCooldown > 0) {
    dialogueCooldown--;
  }
  
  // Decrease temporary message timer
  if (temporaryMessageTimer > 0) {
    temporaryMessageTimer--;
  }
  
  // Animate Dream Guardian intro sequence in mansion (only if not complete)
  if (currentArea === 'mansion' && !guardianIntroComplete) {
    for (let npc of npcs) {
      if (npc.name === 'Dream Guardian') {
        // Phase 1: Walk out of door (0-120 frames = 2 seconds)
        if (guardianIntroTimer <= 120) {
          if (gameState === 'exploring') {
            guardianIntroTimer++;
          }
          let progress = guardianIntroTimer / 120;
          npc.x = map(progress, 0, 1, 720, 550); // Walk from door to center-right
          npc.y = 300;
        }
        // Phase 2: Stop and wait for player interaction (after 120 frames, until player talks)
        else if (guardianIntroTimer > 120 && !guardianShouldWalkBack) {
          npc.x = 550;
          npc.y = 300;
          // Wait for player to talk to Guardian (handled by dialogue system)
          // guardianShouldWalkBack will be set to true when player says "Okay"
        }
        // Phase 3: Walk back into room (after player dialogue)
        else if (guardianShouldWalkBack && guardianIntroTimer <= 240) {
          if (gameState === 'exploring') {
            guardianIntroTimer++;
          }
          let progress = (guardianIntroTimer - 120) / 120;
          npc.x = map(progress, 0, 1, 550, 720); // Walk back to door
          npc.y = 300;
        }
        // Phase 4: Complete - Guardian is now in room 2
        else if (guardianIntroTimer > 240) {
          guardianIntroComplete = true; // Set complete flag after walk-back finishes
          // Remove Guardian from mansion (they're now in room 2)
          npcs = npcs.filter(n => n.name !== 'Dream Guardian');
        }
      }
    }
  } else if (currentArea === 'mansion' && guardianIntroComplete) {
    // Guardian intro is complete, remove them from mansion if present
    npcs = npcs.filter(n => n.name !== 'Dream Guardian');
  }
  
  // Update camera to follow player
  updateCamera();
  
  // Background color based on area
  if (currentArea === 'mansion' || currentArea.startsWith('room') || currentArea === 'wandererRoom') {
    background(25, 20, 35); // Darker for indoor areas
  } else if (currentArea === 'rathCave') {
    background(80, 80, 80); // Gray for cave
  } else if (currentArea === 'fullWorld') {
    background(55, 45, 75); // Lighter purple for outdoor
  } else {
  background(55, 45, 75);
  }
  
  push();
  // Apply camera translation
  translate(-cameraX, -cameraY);
  
  // Draw floor pattern for mansion/rooms
  if (currentArea === 'wandererRoom') {
    drawWoodenFloor(); // Wooden floor for cabin
  } else if (currentArea === 'mansion' || currentArea.startsWith('room')) {
    drawFloorPattern(); // Checkered floor for mansion
  } else if (currentArea === 'rathCave') {
    // No floor pattern for cave
  }
  
  // Draw background decorations (behind player, no collision)
  for (let bg of backgroundDecorations) {
    drawStyledObstacle(bg);
  }
  
  // Draw obstacles with different styles
  for (let obs of obstacles) {
    drawStyledObstacle(obs);
  }
  
  // Draw decorations (non-collidable)
  for (let dec of decorations) {
    // Skip invisible interaction zones (they're just for collision detection)
    if (dec.type === 'darkCageInteraction' || dec.type === 'caveEntrance') {
      continue;
    }
    drawStyledObstacle(dec);
  }
  
  // Draw doors
  for (let door of doors) {
    drawDoor(door);
  }
  
  // Draw non-statue NPCs and all NPC labels first (behind player)
  for (let npc of npcs) {
    if (!isNPCStatue(npc)) {
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
  if (!lavaFallAnimation) {
  player.update();
  }
  
  // Check lava collision (only in fullWorld)
  if (currentArea === 'fullWorld') {
    checkLavaCollision();
    updateLavaFallAnimation();
    checkCageCollision();
  }
  
  // Draw lava smoke
  drawLavaSmoke();
  
  player.display();
  
  // Draw statue sprites on top of player (without labels)
  for (let npc of npcs) {
    if (isNPCStatue(npc)) {
      npc.displaySprite();
    }
  }
  
  pop();
  
  // Draw UI (not affected by camera)
  drawExploringUI();
  
  // Draw Guardian intro prompt during Phase 2 (if not in dialogue)
  if (currentArea === 'mansion' && !guardianIntroComplete && guardianIntroTimer > 120 && gameState === 'exploring') {
    push();
    fill(0, 0, 0, 180);
    noStroke();
    rect(50, height - 120, width - 100, 70);
    
    fill(255, 255, 200);
    textAlign(CENTER, CENTER);
    textSize(12);
    text('Press E to talk to Dream Guardian', width / 2, height - 85);
    pop();
  }
  
  // Draw cave entrance prompt (fullWorld only)
  if (currentArea === 'fullWorld') {
    for (let dec of decorations) {
      if (dec.type === 'caveEntrance') {
        const decCenterX = dec.x + dec.w / 2;
        const decCenterY = dec.y + dec.h / 2;
        
        if (dist(player.x, player.y, decCenterX, decCenterY) < 80) {
          push();
          translate(-cameraX, -cameraY);
          fill(255, 255, 255, 200);
          textAlign(CENTER, BOTTOM);
          textSize(10);
          text('Press E to enter cave', decCenterX, decCenterY - 60);
          pop();
        }
      }
    }
  }
}

// Helper function to check if NPC is a statue
function isNPCStatue(npc) {
  return (npc.name === 'Echo' && echoIsStatue) || 
         (npc.name === 'Sorrow' && wandererIsStatue) ||
         (npc.name === 'King of Greed' && greedKingIsStatue) ||
         (npc.name === 'Dream Guardian' && guardianIsStatue);
}

// Helper function to check if a point is inside an ellipse
function isPointInEllipse(px, py, ellipseCX, ellipseCY, radiusX, radiusY) {
  const dx = px - ellipseCX;
  const dy = py - ellipseCY;
  return ((dx * dx) / (radiusX * radiusX) + (dy * dy) / (radiusY * radiusY)) <= 1;
}

// Check if player is in lava (checking against actual ellipses, not rectangle)
function checkLavaCollision() {
  if (lavaStones.length === 0) return;
  
  // Don't check lava collision while dashing (player is invulnerable mid-dash)
  if (player.isDashing) return;
  
  // Don't check if already falling
  if (lavaFallAnimation) return;
  
  // Calculate lava lake position (mansionX = 600, mansionW = 500, mansionY = 1500)
  const lavaLakeX = 600 + 500 + 420; // 1520
  const lavaLakeY = 1500 + 580; // 2080
  const lavaLakeW = 900;
  const lavaLakeH = 480;
  
  // Check if CENTER and BOTTOM of player is in lava lake area
  const playerCenterX = player.x;
  const playerBottomY = player.y + player.displayH / 2;
  
  // First check if player is within the overall bounding box
  if (playerCenterX < lavaLakeX || playerCenterX > lavaLakeX + lavaLakeW ||
      playerBottomY < lavaLakeY || playerBottomY > lavaLakeY + lavaLakeH) {
    return; // Not even close to the lava lake
  }
  
  // Check if player's center/bottom is on any stone platform first
  let onStone = false;
  for (let stone of lavaStones) {
    if (playerCenterX >= stone.x && playerCenterX <= stone.x + stone.w &&
        playerBottomY >= stone.y && playerBottomY <= stone.y + stone.h) {
      onStone = true;
      break;
    }
  }
  
  if (onStone) return; // Safe on a platform
  
  // Check if on island platform (cave entrance) - match the visual ellipse
  const caveX = lavaLakeX + 500;
  const caveY = lavaLakeY + 150;
  const caveW = 180;
  const caveH = 120;
  
  // Calculate where the island ellipse is actually drawn
  const caveCenterX = caveX + caveW / 2;
  const caveCenterY = caveY + caveH / 2;
  const caveWidth = caveW * 1.3;
  const caveHeight = caveH * 1.1;
  
  // Island ellipse position and size (from drawing code)
  const islandCenterX = caveCenterX;
  const islandCenterY = caveCenterY + caveHeight * 0.25;
  const islandRadiusX = (caveWidth * 1.5) / 2; // ~175px
  const islandRadiusY = (caveHeight * 0.5) / 2; // ~33px
  
  // Create a bounding box that covers the island ellipse
  const islandX = islandCenterX - islandRadiusX;
  const islandY = islandCenterY - islandRadiusY;
  const islandW = islandRadiusX * 2;
  const islandH = islandRadiusY * 2;
  
  if (playerCenterX >= islandX && playerCenterX <= islandX + islandW &&
      playerBottomY >= islandY && playerBottomY <= islandY + islandH) {
    return; // Safe on island platform
  }
  
  // Now check if player is actually IN one of the lava ellipses
  const centerX = lavaLakeX + lavaLakeW / 2;
  const centerY = lavaLakeY + lavaLakeH / 2;
  
  let inLava = false;
  
  // Check all the lava ellipses (matching the drawing code)
  // Large center pool
  if (isPointInEllipse(playerCenterX, playerBottomY, centerX, centerY, 
                        lavaLakeW * 0.8 / 2, lavaLakeH * 0.7 / 2)) {
    inLava = true;
  }
  // Additional pools around the edges
  else if (isPointInEllipse(playerCenterX, playerBottomY, 
                            centerX - lavaLakeW * 0.25, centerY - lavaLakeH * 0.15, 
                            lavaLakeW * 0.5 / 2, lavaLakeH * 0.5 / 2)) {
    inLava = true;
  }
  else if (isPointInEllipse(playerCenterX, playerBottomY, 
                            centerX + lavaLakeW * 0.25, centerY - lavaLakeH * 0.15, 
                            lavaLakeW * 0.5 / 2, lavaLakeH * 0.5 / 2)) {
    inLava = true;
  }
  else if (isPointInEllipse(playerCenterX, playerBottomY, 
                            centerX - lavaLakeW * 0.2, centerY + lavaLakeH * 0.2, 
                            lavaLakeW * 0.45 / 2, lavaLakeH * 0.45 / 2)) {
    inLava = true;
  }
  else if (isPointInEllipse(playerCenterX, playerBottomY, 
                            centerX + lavaLakeW * 0.2, centerY + lavaLakeH * 0.2, 
                            lavaLakeW * 0.45 / 2, lavaLakeH * 0.45 / 2)) {
    inLava = true;
  }
  // Smaller connecting pools
  else if (isPointInEllipse(playerCenterX, playerBottomY, 
                            centerX - lavaLakeW * 0.35, centerY, 
                            lavaLakeW * 0.3 / 2, lavaLakeH * 0.35 / 2)) {
    inLava = true;
  }
  else if (isPointInEllipse(playerCenterX, playerBottomY, 
                            centerX + lavaLakeW * 0.35, centerY, 
                            lavaLakeW * 0.3 / 2, lavaLakeH * 0.35 / 2)) {
    inLava = true;
  }
  else if (isPointInEllipse(playerCenterX, playerBottomY, 
                            centerX, centerY - lavaLakeH * 0.25, 
                            lavaLakeW * 0.35 / 2, lavaLakeH * 0.3 / 2)) {
    inLava = true;
  }
  else if (isPointInEllipse(playerCenterX, playerBottomY, 
                            centerX, centerY + lavaLakeH * 0.25, 
                            lavaLakeW * 0.35 / 2, lavaLakeH * 0.3 / 2)) {
    inLava = true;
  }
  
  // If player is in lava, start burn animation (we already checked onStone above)
  if (inLava) {
    lavaFallAnimation = true;
    lavaFallProgress = 0;
    lavaFallStartX = player.x;
    lavaFallStartY = player.y;
    
    // Create initial smoke burst
    for (let i = 0; i < 8; i++) {
      lavaSmoke.push({
        x: player.x,
        y: player.y,
        vx: random(-2, 2),
        vy: random(-3, -1),
        life: 60,
        maxLife: 60,
        size: random(10, 20)
      });
    }
  }
}

// Check cage collision and trigger interactions
function checkCageCollision() {
  // Find the cage decoration
  let cage = null;
  for (let dec of decorations) {
    if (dec.type === 'darkCageInteraction') {
      cage = dec;
      break;
    }
  }
  
  if (!cage || cageOpening) return; // No cage or already opening
  
  // Define cage edges (left, right, bottom - NOT top)
  const leftEdge = cage.x;
  const rightEdge = cage.x + cage.w;
  const bottomEdge = cage.y + cage.h;
  const topEdge = cage.y;
  
  // Check if player is touching any edge except the top
  const touchingLeft = player.x > leftEdge - 30 && player.x < leftEdge + 10 && player.y > topEdge && player.y < bottomEdge;
  const touchingRight = player.x > rightEdge - 10 && player.x < rightEdge + 30 && player.y > topEdge && player.y < bottomEdge;
  const touchingBottom = player.y > bottomEdge - 10 && player.y < bottomEdge + 30 && player.x > leftEdge && player.x < rightEdge;
  
  if (touchingLeft || touchingRight || touchingBottom) {
    // Player is touching a cage edge
    if (collectedSouls.length >= 5) {
      // Player has all 5 souls - start cage opening animation
      cageOpening = true;
      cageOpeningProgress = 0;
    } else if (collectedSouls.length === 4) {
      // 4 souls - show prompt to press E
      if (!gameState || gameState === 'exploring') {
        // Show prompt near cage
        push();
        fill(255, 255, 200);
        textAlign(CENTER, CENTER);
        textSize(10);
        text('Press E to interact', player.x, player.y - 40);
        pop();
      }
    } else {
      // Not enough souls - show prompt
      if (!gameState || gameState === 'exploring') {
        push();
        fill(255, 255, 200);
        textAlign(CENTER, CENTER);
        textSize(10);
        text('Press E to interact', player.x, player.y - 40);
        pop();
      }
    }
  }
}

// Update lava fall animation
function updateLavaFallAnimation() {
  if (!lavaFallAnimation) return;
  
  lavaFallProgress += 0.03;
  
  // Use bezier curve for bounce motion - bounce UP when burned
  let t = lavaFallProgress;
  // Arc up from burn point and back down to respawn point
  let curveX = lerp(lavaFallStartX, lavaRespawnPoint.x, t);
  let curveY = lavaFallStartY - sin(t * PI) * 100 + (t - 1) * 150; // Arc UP then down to respawn
  
  player.x = curveX;
  player.y = curveY;
  
  // Add smoke particles along the way
  if (frameCount % 3 === 0) {
    lavaSmoke.push({
      x: player.x + random(-10, 10),
      y: player.y + random(-10, 10),
      vx: random(-1, 1),
      vy: random(-2, 0),
      life: 40,
      maxLife: 40,
      size: random(8, 15)
    });
  }
  
  // Animation complete
  if (lavaFallProgress >= 1) {
    lavaFallAnimation = false;
    lavaFallProgress = 0;
    
    // Lose life
    globalLives--;
    player.lives = globalLives;
    
    // Play hurt sound
    if (hurtSound) {
      hurtSound.play();
    }
    
    showTemporaryMessage(`Fell in lava! Lives: ${globalLives}`);
    
    // Final position
    player.x = lavaRespawnPoint.x;
    player.y = lavaRespawnPoint.y;
    
    // Check if game over
    if (globalLives <= 0) {
      // Game over - return to start screen
      gameState = 'startScreen';
      resetGameState();
    }
  }
}

// Draw smoke particles
function drawLavaSmoke() {
  for (let i = lavaSmoke.length - 1; i >= 0; i--) {
    let smoke = lavaSmoke[i];
    
    // Update smoke
    smoke.x += smoke.vx;
    smoke.y += smoke.vy;
    smoke.life--;
    
    // Draw smoke
    push();
    let alpha = map(smoke.life, 0, smoke.maxLife, 0, 150);
    fill(100, 100, 100, alpha);
    noStroke();
    ellipse(smoke.x, smoke.y, smoke.size, smoke.size);
    pop();
    
    // Remove dead smoke
    if (smoke.life <= 0) {
      lavaSmoke.splice(i, 1);
    }
  }
}

// Get all collidable objects (obstacles + statues)
function getCollidableObjects() {
  // Reuse obstacles array and only add statue collisions
  let collidables = obstacles;
  let statueColliders = [];
  
  // Add statues as collidable obstacles
  for (let npc of npcs) {
    if (npc.name === 'Echo' && echoIsStatue) {
      // Echo statue - larger collision box covering bottom half
      statueColliders.push({
        x: npc.x - npc.w / 2 + 10,
        y: npc.y + 5,
        w: npc.w - 20,
        h: npc.h / 2 + 5
      });
    } else if (npc.name === 'Sorrow' && wandererIsStatue) {
      // Sorrow statue - normal collision
      statueColliders.push({
        x: npc.x - npc.w / 2,
        y: npc.y - npc.h / 2,
        w: npc.w,
        h: npc.h
      });
    } else if (npc.name === 'King of Greed' && greedKingIsStatue) {
      // King of Greed statue - normal collision
      statueColliders.push({
        x: npc.x - npc.w / 2,
        y: npc.y - npc.h / 2,
        w: npc.w,
        h: npc.h
      });
    }
  }
  
  // Only create new array if there are statues
  return statueColliders.length > 0 ? collidables.concat(statueColliders) : collidables;
}

function drawTowerGame() {
  // Draw the tower climbing game
  
  // Background - different for King's Chamber vs regular tower
  if (towerLevel === 7) {
    // King's Chamber - matches tower style but feels like you "jumped up" into it
    background(25, 20, 30);
    
    // Gradient effect from bottom to top (same as tower levels)
    for (let i = 0; i < height; i += 5) {
      let inter = map(i, 0, height, 0, 1);
      let c = lerpColor(color(35, 25, 35), color(15, 10, 20), inter);
      stroke(c);
      line(0, i, width, i);
    }
    
    // Windows on walls (broken windows like the building)
    push();
    stroke(40, 30, 50);
    strokeWeight(3);
    fill(15, 10, 20);
    // Left wall windows
    rect(30, 100, 40, 50);
    rect(30, 200, 40, 50);
    rect(30, 350, 40, 50);
    rect(30, 450, 40, 50);
    // Right wall windows
    rect(width - 70, 100, 40, 50);
    rect(width - 70, 200, 40, 50);
    rect(width - 70, 350, 40, 50);
    rect(width - 70, 450, 40, 50);
    // Window details (cross pattern)
    for (let y of [100, 200, 350, 450]) {
      // Left windows
      line(30, y + 25, 70, y + 25);
      line(50, y, 50, y + 50);
      // Right windows
      line(width - 70, y + 25, width - 30, y + 25);
      line(width - 50, y, width - 50, y + 50);
    }
    pop();
    
    // Draw floor (same as tower levels)
    push();
    let floorY = height - 40;
    fill(40, 35, 45);
    noStroke();
    rect(0, floorY, width, 40);
    
    // Floor line
    stroke(60, 50, 70);
    strokeWeight(2);
    line(0, floorY, width, floorY);
    pop();
  } else {
    // Regular tower levels
    background(25, 20, 30);
    
    // Gradient effect from bottom to top
    for (let i = 0; i < height; i += 5) {
      let inter = map(i, 0, height, 0, 1);
      let c = lerpColor(color(35, 25, 35), color(15, 10, 20), inter);
      stroke(c);
      line(0, i, width, i);
    }
    
    // Draw floor
    push();
    let floorY = height - 40;
    fill(40, 35, 45);
    noStroke();
    rect(0, floorY, width, 40);
    
    // Floor line
    stroke(60, 50, 70);
    strokeWeight(2);
    line(0, floorY, width, floorY);
    pop();
  }
  
  // Draw tower platforms
  for (let platform of towerPlatforms) {
    platform.display();
  }
  
  // Draw decorations (skeletons, soul, ladder)
  if (towerLevel === 7) {
    for (let dec of decorations) {
      drawStyledObstacle(dec);
    }
  }
  
  // Update and draw enemies
  for (let i = towerEnemies.length - 1; i >= 0; i--) {
    towerEnemies[i].update();
    towerEnemies[i].display();
    
    // Check collision with player
    if (dist(player.x, player.y, towerEnemies[i].x, towerEnemies[i].y) < (player.w/2 + towerEnemies[i].size/2)) {
      // Take damage
      player.lives--;
      globalLives = player.lives; // Sync with global lives
      towerEnemies.splice(i, 1);
      
      // Play hurt sound
      if (hurtSound) {
        hurtSound.play();
      }
      
      // Check if game over
      if (player.lives <= 0) {
        // Game over - return to start screen
        gameState = 'startScreen';
        resetGameState();
        
        // Reset player physics state
        player.vx = 0;
        player.vy = 0;
        player.isDashing = false;
        player.isDashingDown = false;
        player.canDash = true;
        player.dashDuration = 0;
        player.dashCooldown = 0;
        player.dashVx = 0;
        player.dashVy = 0;
        player.onGround = false;
        
        // Clear tower-specific variables
        towerPlatforms = [];
        towerEnemies = [];
        towerCollectibles = [];
        dashTrail = [];
      }
    }
  }
  
  // Draw dash trail
  for (let i = dashTrail.length - 1; i >= 0; i--) {
    dashTrail[i].life--;
    dashTrail[i].display();
    
    if (dashTrail[i].life <= 0) {
      dashTrail.splice(i, 1);
    }
  }
  
  // Check for dash input (hold Shift + direction)
  // General cooldown prevents spam - check here before calling dash()
  if (keyIsDown(SHIFT) && towerLevel < 7 && !player.isDashing && player.canDash && player.dashCooldown === 0) {
    let dx = 0;
    let dy = 0;
    
    if (keyIsDown(65)) dx = -1; // A (left)
    if (keyIsDown(68)) dx = 1;  // D (right)
    if (keyIsDown(87) || keyIsDown(32)) dy = -1; // W or Space (up)
    if (keyIsDown(83)) dy = 1;  // S (down)
    
    if (dx !== 0 || dy !== 0) {
      // Set cooldown BEFORE calling dash (prevents spam)
      player.dashCooldown = player.dashCooldownMax;
      player.dash(dx, dy);
    }
  }
  
  // Update and draw player
  // King's Chamber uses top-down movement, other levels use platformer physics
  if (towerLevel === 7) {
    player.update(); // Top-down movement like dreamscape
  } else {
    player.move(); // Platformer physics for levels 1-6
  }
  player.display();
  
  // Draw NPCs (King of Greed in chamber)
  if (towerLevel === 7) {
    for (let npc of npcs) {
      npc.display();
      
      // Check if player is near for interaction
      if (dist(player.x, player.y, npc.x, npc.y) < 80) {
        fill(255, 255, 255, 200);
        textAlign(CENTER, BOTTOM);
        textSize(10);
        text('Press E to talk to ' + npc.name, npc.x, npc.y - 40);
      }
    }
  }
  
  
  // Draw door on level 1
  if (towerLevel === 1) {
    push();
    let floorY = height - 40;
    let doorY = floorY - 60; // Door sits on floor, 60px tall
    fill(80, 60, 50);
    stroke(255, 255, 255, 200);
    strokeWeight(3);
    rect(50, doorY, 40, 60);
    noStroke();
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(8);
    text('EXIT', 70, doorY + 30);
    pop();
  }
  
  // Draw tower UI
  drawTowerUI();
  
  // Check level progression
  checkTowerProgression();
}

function drawTowerUI() {
  push();
  
  // UI box - top right
  let uiX = width - 180;
  let uiY = 10;
  let uiW = 170;
  let uiH = 100;
  
  fill(0, 0, 0, 180);
  noStroke();
  rect(uiX, uiY, uiW, uiH, 5);
  
  // UI text
  fill(255, 215, 0);
  textAlign(LEFT, TOP);
  textSize(11);
  if (towerLevel === 7) {
    text('King\'s Chamber', uiX + 10, uiY + 10);
  } else {
    text(`Level: ${towerLevel}/6`, uiX + 10, uiY + 10);
  }
  
  fill(255);
  textSize(10);
  text(`Lives: ${player.lives}`, uiX + 10, uiY + 30);
  
  // Dash status (like dreamscape - show cooldown countdown)
  if (player.isDashing) {
    fill(100, 180, 255);
    text('Dash: Dashing!', uiX + 10, uiY + 50);
  } else if (player.dashCooldown > 0) {
    fill(255, 150, 100);
    let secondsLeft = (player.dashCooldown / 60).toFixed(1);
    text(`Dash CD: ${secondsLeft}s`, uiX + 10, uiY + 50);
  } else if (player.canDash) {
    fill(100, 255, 200);
    text('Dash: Ready', uiX + 10, uiY + 50);
  } else {
    fill(200, 150, 150);
    text('Dash: Used', uiX + 10, uiY + 50);
  }
  
  // Hint text
  if (towerLevel < 7) {
    fill(200, 200, 255);
    textSize(9);
    text('Reach the top!', uiX + 10, uiY + 70);
  } else if (towerLevel === 7) {
    fill(100, 255, 100);
    textSize(9);
    text('Walk to the King', uiX + 10, uiY + 70);
  }
  
  pop();
}

function checkDropPortalCollision() {
  // Check if player is dashing DOWN into the drop portal (levels 2-6)
  // Similar to ghost door collision logic
  if (towerLevel < 2 || towerLevel > 6) return false;
  if (!player.isDashing || !player.isDashingDown) return false;
  
  let floorY = height - 40;
  let portalCenterX = width - 115; // Center of drop portal line
  let portalCenterY = floorY;
  let portalLeft = width - 180;
  let portalRight = width - 50;
  
  // Check if player is near portal center (like ghost door - 50px radius)
  let distToPortal = dist(player.x, player.y, portalCenterX, portalCenterY);
  
  // Check if horizontally aligned with portal
  let isHorizontallyAligned = player.x > portalLeft && player.x < portalRight;
  // Check if vertically near portal (within 60px)
  let isVerticallyNear = abs(player.y - portalCenterY) < 60;
  
  // Must be dashing downward (vy > 0) AND near portal
  if (player.isDashing && player.isDashingDown && player.vy > 0 && 
      (distToPortal < 80 || (isHorizontallyAligned && isVerticallyNear))) {
    // Go down a level
    if (towerLevel > 1) {
      // Stop dash immediately (like ghost door)
      player.isDashing = false;
      player.vx = 0;
      player.vy = 0;
      player.dashDuration = 0;
      player.isDashingDown = false;
      
      // Transition to lower level
      towerLevel--;
      initTowerLevel(towerLevel);
      
      // Spawn at middle of screen (center of golden line horizontally, below it)
      player.x = width / 2;
      player.y = height / 2; // Middle of screen, safely below y=30 threshold
      player.onGround = false;
      player.canDash = true; // Allow dash immediately
      player.dashCooldown = 0; // Reset cooldown
      
      return true;
    }
  }
  return false;
}

function checkTowerProgression() {
  // Check if player reached the top
  if (player.y < 30 && towerLevel < 7) {
    // Advance to next level or king's chamber
    if (towerLevel < 6) {
      towerLevel++;
      initTowerLevel(towerLevel);
    } else {
      // Enter King's chamber
      towerLevel = 7;
      initTowerLevel(7);
    }
  }
  
  // Check drop portal collision (like ghost door)
  checkDropPortalCollision();
  
  // Check if player is using ladder (after getting soul) - requires E key
  if (towerLevel === 7 && towerLadderActive) {
    // Ladder is at x: 80-140, y: height/2 - 100 to height/2 + 100
    if (player.x > 80 && player.x < 140 && player.y > height/2 - 100 && player.y < height/2 + 100) {
      // Show interaction hint
      fill(255, 255, 255, 200);
      textAlign(CENTER, BOTTOM);
      textSize(10);
      text('Press E to descend', player.x, player.y - 50);
    }
  }
}

function updateCamera() {
  // For mansion and rooms, center camera on canvas (no scrolling)
  if (currentArea === 'mansion' || currentArea.startsWith('room') || currentArea === 'wandererRoom' || currentArea === 'rathCave') {
    cameraX = 0;
    cameraY = 0;
  } else if (currentArea === 'fullWorld') {
    // For full world, camera follows player
    const fullWorldWidth = 4200;
    const fullWorldHeight = 3600;
    
    cameraX = player.x - width / 2;
    cameraY = player.y - height / 2;
    
    // Keep camera within full world bounds
    cameraX = constrain(cameraX, 0, fullWorldWidth - width);
    cameraY = constrain(cameraY, 0, fullWorldHeight - height);
  } else {
    // Default: camera follows player with standard world bounds
    cameraX = player.x - width / 2;
    cameraY = player.y - height / 2;
    
    cameraX = constrain(cameraX, 0, WORLD_WIDTH - width);
    cameraY = constrain(cameraY, 0, WORLD_HEIGHT - height);
  }
}

function checkNPCInteraction() {
  // Don't allow interaction if cooldown is active
  if (dialogueCooldown > 0) {
    return;
  }
  
  // Don't allow interaction during Guardian intro animation (Phase 1 and Phase 3)
  if (currentArea === 'mansion' && !guardianIntroComplete) {
    // Phase 1: Walking out (0-120)
    if (guardianIntroTimer <= 120) {
      return;
    }
    // Phase 3: Walking back (after dialogue, when guardianShouldWalkBack is true)
    if (guardianShouldWalkBack && guardianIntroTimer <= 240) {
      return;
    }
  }
  
  // Check if player is near any NPC
  for (let npc of npcs) {
    // Skip statues
    if (isNPCStatue(npc)) {
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
  // UI background (left side)
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
  if (!hasGhostPepper) {
    fill(200, 100, 100);
    text('Dash: Locked', 20, 80);
  } else if (player.isDashing) {
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
  
  // Location display (top right)
  drawLocationDisplay();
  
  // Soul counter in bottom right
  if (collectedSouls.length > 0) {
    drawSoulCounter();
  }
  
  // Key icon if player has cabin key
  if (hasCabinKey) {
    drawKeyIcon();
  }
  
  // Temporary message (like cage interaction)
  if (temporaryMessageTimer > 0) {
    drawTemporaryMessage();
  }
  
  // Debug overlay (set showDebug = true at top of file to enable)
  if (showDebug) {
    drawDebugOverlay();
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

function drawDebugOverlay() {
  push();
  
  // Semi-transparent background
  fill(0, 0, 0, 200);
  noStroke();
  rect(10, height - 180, 380, 170);
  
  // Title
  fill(100, 255, 100);
  textAlign(LEFT, TOP);
  textSize(10);
  textStyle(BOLD);
  text('DEBUG INFO (set showDebug=true to enable)', 20, height - 170);
  
  // Debug info
  fill(255, 255, 100);
  textStyle(NORMAL);
  textSize(9);
  let y = height - 150;
  text('Position: (' + Math.round(player.x) + ', ' + Math.round(player.y) + ')', 20, y);
  y += 15;
  text('Game State: ' + gameState, 20, y);
  y += 15;
  text('Current Area: ' + currentArea, 20, y);
  y += 15;
  text('Previous Area: ' + (previousArea || 'none'), 20, y);
  y += 15;
  text('Camera: (' + Math.round(cameraX) + ', ' + Math.round(cameraY) + ')', 20, y);
  y += 15;
  
  // Puzzle states
  fill(255, 200, 100);
  y += 5;
  text('Collected Souls: ' + collectedSouls.length + ' [' + collectedSouls.join(', ') + ']', 20, y);
  y += 15;
  text('Dash: ' + (hasGhostPepper ? 'Yes' : 'No') + ' | Tower Level: ' + towerLevel + ' | Lives: ' + player.lives, 20, y);
  y += 15;
  
  // Useful info
  fill(150, 150, 255);
  text('Obstacles: ' + obstacles.length + ' | Doors: ' + doors.length + ' | NPCs: ' + npcs.length, 20, y);
  
  pop();
}

function drawTemporaryMessage() {
  // Message with fade - position based on content
  push();
  
  // Calculate fade based on timer (fade out in last 60 frames)
  let alpha = 255;
  if (temporaryMessageTimer < 60) {
    alpha = map(temporaryMessageTimer, 0, 60, 0, 255);
  }
  
  // Position at 75% height for general messages (like key obtained, door unlocked)
  // Keep at top for other messages
  let msgX = width / 2;
  let msgY = height * 0.75; // 75% down the canvas
  
  // Semi-transparent background
  fill(0, 0, 0, alpha * 0.7);
  noStroke();
  rectMode(CENTER);
  rect(msgX, msgY, textWidth(temporaryMessage) + 60, 30, 5);
  rectMode(CORNER);
  
  // Don't show Dream Guardian icon for these messages anymore
  
  fill(255, 215, 0, alpha);
  textAlign(CENTER, CENTER);
  textSize(10);
  text(temporaryMessage, msgX, msgY);
  pop();
}

function drawCageMessage() {
  // Message at center middle of screen with fade
  push();
  
  // Calculate fade based on timer (fade out in last 60 frames)
  let alpha = 255;
  if (cageMessageTimer < 60) {
    alpha = map(cageMessageTimer, 0, 60, 0, 255);
  }
  
  // Position at center middle
  let msgX = width / 2;
  let msgY = height / 2;
  
  // Semi-transparent background
  fill(0, 0, 0, alpha * 0.7);
  noStroke();
  rectMode(CENTER);
  rect(msgX, msgY, textWidth(cageMessage) + 80, 50, 5);
  rectMode(CORNER);
  
  // Show Dream Guardian icon
  if (dreamGuardianGif && dreamGuardianGif.width > 0) {
    tint(255, alpha);
    imageMode(CENTER);
    image(dreamGuardianGif, msgX - (textWidth(cageMessage) / 2 + 35), msgY, 30, 30);
    noTint();
  }
  
  fill(255, 215, 0, alpha);
  textAlign(CENTER, CENTER);
  textSize(12);
  text(cageMessage, msgX, msgY);
  pop();
}

function drawLocationDisplay() {
  // Get location name
  let locationName = '';
  if (currentArea === 'mansion') {
    locationName = 'The Mansion';
  } else if (currentArea === 'room1') {
    locationName = 'Puzzle Chamber';
  } else if (currentArea === 'room2') {
    locationName = 'Guardian\'s Sanctum';
  } else if (currentArea === 'room3') {
    locationName = 'Echo\'s Room';
  } else if (currentArea === 'wandererRoom') {
    locationName = 'Sorrow\'s Cabin';
  } else if (currentArea === 'rathCave') {
    locationName = 'Rath\'s Cave';
  } else if (currentArea === 'fullWorld') {
    // Check if player is in specific sub-areas
    const ruinedCityX = 500;
    const ruinedCityY = 2050;
    const ruinedCityW = 800;
    const ruinedCityH = 700;
    
    const ghostForestX = 400;
    const ghostForestY = 100;
    const ghostForestW = 900;
    const ghostForestH = 950;
    
    if (player.x >= ruinedCityX && player.x <= ruinedCityX + ruinedCityW &&
        player.y >= ruinedCityY && player.y <= ruinedCityY + ruinedCityH) {
      locationName = 'Ruined City';
    } else if (player.x >= ghostForestX && player.x <= ghostForestX + ghostForestW &&
               player.y >= ghostForestY && player.y <= ghostForestY + ghostForestH) {
      locationName = 'Ghost Forest';
    } else {
      locationName = 'The Dreamscape';
    }
  }
  
  // Background
  fill(0, 0, 0, 180);
  noStroke();
  let textW = textWidth(locationName) + 40;
  rect(width - textW - 10, 10, textW, 40);
  
  // Location text
  fill(255, 215, 0);
  textAlign(RIGHT, TOP);
  textSize(10);
  text(locationName, width - 20, 25);
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
  } else if (currentSoul === 'Sorrow') {
    soulColor = [180, 120, 255]; // Purple/lavender
  } else if (currentSoul === 'King of Greed') {
    soulColor = [100, 255, 100]; // Green
  } else {
    soulColor = [200, 200, 200]; // Default gray for unknown souls
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

function drawKeyIcon() {
  push();
  
  // Position key icon to the left of soul counter
  const keyX = width - 210;
  const keyY = height - 33;
  
  // Draw key icon
  if (keyImg) {
    imageMode(CENTER);
    image(keyImg, keyX, keyY, 30, 30);
  }
  
  // Key label text
  fill(255, 215, 0);
  textAlign(LEFT, CENTER);
  textSize(10);
  text('Key', keyX + 20, keyY);
  
  pop();
}

// =============================================================================
// DIALOGUE SYSTEM FUNCTIONS
// =============================================================================

function startDialogue(npc) {
  gameState = 'dialogue';
  
  // Get dialogue from dialogues.js
  // Special case: Dream Guardian intro greeting in mansion
  if (npc.name === 'Dream Guardian' && currentArea === 'mansion' && !guardianIntroComplete) {
    currentDialogue = getDialogue(npc.name, 'introGreeting');
  }
  // Special case: Dream Guardian with 4 souls in mansion
  else if (npc.name === 'Dream Guardian' && currentArea === 'mansion' && collectedSouls.length === 4) {
    currentDialogue = getDialogue(npc.name, 'fourSouls');
  }
  // Special case: Dream Guardian in room2 with 4 souls
  else if (npc.name === 'Dream Guardian' && currentArea === 'room2' && collectedSouls.length === 4) {
    currentDialogue = getDialogue(npc.name, 'inRoom2FourSouls');
  }
  // Special case: Dream Guardian in room2 has different dialogue
  else if (npc.name === 'Dream Guardian' && currentArea === 'room2') {
    currentDialogue = getDialogue(npc.name, 'inRoom2');
  } else {
  currentDialogue = getDialogue(npc.name);
  }
  
  // Reset dialogue display
  dialogueBox.displayedText = '';
  dialogueBox.textIndex = 0;
  dialogueBox.fullText = currentDialogue.text;
  dialogueBox.selectedChoice = 0;
}

function drawDialogue() {
  // Draw world in background (simplified - no UI updates)
  updateCamera();
  
  // Background color based on area
  if (currentArea === 'ruinedCityBuilding') {
    // Tower area - use matching backgrounds
    if (towerLevel === 7) {
      // King's Chamber - matches tower style
      background(25, 20, 30);
      
      // Gradient effect from bottom to top (same as tower levels)
      for (let i = 0; i < height; i += 5) {
        let inter = map(i, 0, height, 0, 1);
        let c = lerpColor(color(35, 25, 35), color(15, 10, 20), inter);
        stroke(c);
        line(0, i, width, i);
      }
      
      // Windows on walls
      push();
      stroke(40, 30, 50);
      strokeWeight(3);
      fill(15, 10, 20);
      // Left wall windows
      rect(30, 100, 40, 50);
      rect(30, 200, 40, 50);
      rect(30, 350, 40, 50);
      rect(30, 450, 40, 50);
      // Right wall windows
      rect(width - 70, 100, 40, 50);
      rect(width - 70, 200, 40, 50);
      rect(width - 70, 350, 40, 50);
      rect(width - 70, 450, 40, 50);
      // Window details (cross pattern)
      for (let y of [100, 200, 350, 450]) {
        // Left windows
        line(30, y + 25, 70, y + 25);
        line(50, y, 50, y + 50);
        // Right windows
        line(width - 70, y + 25, width - 30, y + 25);
        line(width - 50, y, width - 50, y + 50);
      }
      pop();
      
      // Draw floor (same as tower levels)
      push();
      let floorY = height - 40;
      fill(40, 35, 45);
      noStroke();
      rect(0, floorY, width, 40);
      
      // Floor line
      stroke(60, 50, 70);
      strokeWeight(2);
      line(0, floorY, width, floorY);
      pop();
    } else {
      // Regular tower levels
      background(25, 20, 30);
      
      for (let i = 0; i < height; i += 5) {
        let inter = map(i, 0, height, 0, 1);
        let c = lerpColor(color(35, 25, 35), color(15, 10, 20), inter);
        stroke(c);
        line(0, i, width, i);
      }
    }
  } else if (currentArea === 'mansion' || currentArea.startsWith('room')) {
    background(25, 20, 35);
  } else if (currentArea === 'fullWorld') {
    background(55, 45, 75);
  } else {
    background(55, 45, 75);
  }
  
  push();
  translate(-cameraX, -cameraY);
  
  // Draw floor pattern for mansion/rooms
  if (currentArea === 'wandererRoom') {
    drawWoodenFloor(); // Wooden floor for cabin
  } else if (currentArea === 'mansion' || currentArea.startsWith('room')) {
    drawFloorPattern(); // Checkered floor for mansion
  }
  
  // Draw obstacles
  for (let obs of obstacles) {
    drawStyledObstacle(obs);
  }
  
  // Draw decorations
  for (let dec of decorations) {
    drawStyledObstacle(dec);
  }
  
  // Draw tower platforms if in tower
  if (currentArea === 'ruinedCityBuilding') {
    for (let platform of towerPlatforms) {
      platform.display();
    }
  }
  
  // Draw doors
  for (let door of doors) {
    drawDoor(door);
  }
  
  // Draw NPCs
  for (let npc of npcs) {
    if (!isNPCStatue(npc)) {
      npc.display();
    } else {
      npc.displayLabel();
    }
  }
  
  // Draw player
  player.display();
  
  // Draw statue sprites
  for (let npc of npcs) {
    if (isNPCStatue(npc)) {
      npc.displaySprite();
    }
  }
  
  pop();
  
  // Overlay
  fill(0, 0, 0, 150);
  rect(0, 0, width, height);
  
  // Draw faded bobbing Dream Guardian for cage dialogues only
  // Only show when it's a simple message (no choices) about the cage
  if (currentDialogue && currentDialogue.speaker === 'Dream Guardian' && 
      (!currentDialogue.choices || currentDialogue.choices.length === 0) &&
      (currentDialogue.text.includes('cage') || currentDialogue.text.includes('sanctum'))) {
    // Bobbing animation
    let bobOffset = sin(frameCount * 0.05) * 10; // Slow bob up and down
    
    // Draw Dream Guardian sprite centered, faded
    if (dreamGuardianGif) {
      push();
      tint(255, 120); // 120/255 = ~47% opacity
      imageMode(CENTER);
      let spriteX = width / 2;
      let spriteY = height / 2 - 100 + bobOffset; // Above dialogue box, bobbing
      image(dreamGuardianGif, spriteX, spriteY, 100, 100); // 100x100 size
      pop();
    }
  }
  
  // Draw dialogue box
  drawDialogueBox();
}

function drawDialogueBox() {
  let box = dialogueBox;
  
  // Reposition box for landscape canvas - bigger to fit longer text
  box.x = 50;
  box.y = height - 260;
  box.w = width - 100;
  box.h = 240;
  
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
  
  // Dialogue text - increased height to show full text without cutting off
  fill(255);
  textSize(11);
  text(box.displayedText, box.x + box.padding, box.y + box.padding + 30, box.w - box.padding * 2, 160);
  
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
  let startY = box.y + 155; // Push options up with better padding from text
  
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
  
  // Removed bottom right instructions tooltip to prevent overlap
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
    
    // Check if this response completes the intro (Guardian walks back)
    if (currentDialogue.completesIntro) {
      // Don't set guardianIntroComplete yet - wait for Guardian to walk back
      // Unlock Door 2 globally
      door2Unlocked = true;
      console.log('Door 2 unlocked! door2Unlocked =', door2Unlocked);
      // Update the door in the current doors array
      for (let door of doors) {
        if (door.targetArea === 'room2') {
          door.locked = false;
          console.log('Door 2 in mansion set to unlocked');
        }
      }
      // Trigger Guardian walk-back animation
      guardianShouldWalkBack = true;
      // guardianIntroTimer stays at 120, will increment during walk-back
    }
    
    // Check if this response gives the ghost pepper
    if (currentDialogue.givesGhostPepper) {
      hasGhostPepper = true;
      player.canDash = true; // Enable dash ability
      console.log('=== GHOST PEPPER RECEIVED ===');
      console.log('hasGhostPepper =', hasGhostPepper);
      console.log('Player canDash =', player.canDash);
      console.log('Player dashCooldown =', player.dashCooldown);
      // Update doors in current area immediately
      for (let door of doors) {
        if (door.targetArea === 'room1' || door.targetArea === 'room3') {
          door.locked = false;
          console.log('Door', door.label, 'unlocked');
        }
      }
    }
    
    // Check if this response gives the cabin key
    if (currentDialogue.givesCabinKey) {
      hasCabinKey = true;
      showTemporaryMessage('Cabin key obtained!');
      // Don't unlock the door yet - player must use the key at the door
    }
    
    // Check if this response shows the ladder (King of Greed)
    if (currentDialogue.showsLadder) {
      towerLadderActive = true;
      // Add ladder decoration dynamically without resetting the room
      decorations.push({ x: width/2 - 30, y: height - 140, w: 60, h: 140, style: 'ladder',
                        type: 'ladder' });
    }
    
    // Check if this response gives a soul (King of Greed)
    if (currentDialogue.givesSoul) {
      hasGreedSoul = true;
      collectedSouls.push('King of Greed');
      showTemporaryMessage('Soul of Greed obtained!');
    }
    
    // Check if this response gives Dream Guardian's soul
    if (currentDialogue.givesGuardianSoul) {
      collectedSouls.push('Dream Guardian');
      showTemporaryMessage('Dream Guardian\'s soul obtained!');
    }
    
    // Check if this response turns Dream Guardian to statue
    if (currentDialogue.turnsGuardianToStatue) {
      guardianIsStatue = true;
      // Move player away from Guardian's position
      player.x = width / 2 - 80;
      player.y = height / 2 + 60;
    }
    
    // Check if this response turns NPC to statue (King of Greed)
    if (currentDialogue.turnsToStatue) {
      greedKingIsStatue = true; // Turn King of Greed into statue
      
      // Move player away from King's position to prevent getting stuck in statue
      // King is at center of room, move player down and to the left
      player.x = width / 2 - 80;
      player.y = height / 2 + 60;
    }
    
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
    
    // Check if this response triggers the piano game (Rath)
    if (currentDialogue.triggersPiano) {
      // Exit dialogue and start piano game
      gameState = 'pianoPuzzle';
      pianoInputSeq = [];
      pianoMessage = '';
      pianoMessageTimer = 0;
      // Stop background music for piano puzzle
      switchMusic();
      pianoGamePhase = 'listening';
      pianoPlaybackIndex = 0;
      pianoPlaybackTimer = 0;
      return;
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
  // Draw world in background (simplified)
  updateCamera();
  
  if (currentArea === 'mansion' || currentArea.startsWith('room') || currentArea === 'wandererRoom') {
    background(25, 20, 35);
  } else {
  background(55, 45, 75);
  }
  
  push();
  translate(-cameraX, -cameraY);
  
  // Draw floor for mansion/rooms
  if (currentArea === 'wandererRoom') {
    drawWoodenFloor(); // Wooden floor for cabin
  } else if (currentArea === 'mansion' || currentArea.startsWith('room')) {
    drawFloorPattern(); // Checkered floor for mansion
  }
  
  // Draw obstacles with proper styling
  for (let obs of obstacles) {
    drawStyledObstacle(obs);
  }
  
  // Draw decorations
  for (let dec of decorations) {
    drawStyledObstacle(dec);
  }
  
  // Draw doors
  for (let door of doors) {
    drawDoor(door);
  }
  
  // Draw NPCs
  for (let npc of npcs) {
    npc.display();
  }
  
  // Update swirl animation
  swirlAnimation.timer++;
  let progress = swirlAnimation.timer / swirlAnimation.duration;
  let easeProgress = progress * progress * progress; // Ease in cubic
  
  // Draw swirling cat
  if (swirlAnimation.targetNPC) {
    let currentX = lerp(player.x, swirlAnimation.targetNPC.x, easeProgress);
    let currentY = lerp(player.y, swirlAnimation.targetNPC.y, easeProgress);
    
    swirlAnimation.rotation = progress * TWO_PI * 5; // 5 full rotations
    swirlAnimation.scale = lerp(1, 0.1, easeProgress);
    
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
  if (currentPuzzleNPC === 'Sorrow') {
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
  // Color tile puzzle layout for Sorrow (Undertale-inspired)
  // P = Floor base (safe, no effect)
  // R = Wall blocks (impassable)
  // Y = Yellow electric (bounces back)
  // B = Blue water (dangerous if smell like grapes or next to yellow)
  // O = Grape tile (makes you smell like grapes)
  // U = Ice (makes you slide)
  // G = Goal position for level progression
  
  // Three increasingly difficult levels - each teaches a mechanic
  const layouts = {
    1: {
      // Level 1: Basic navigation - scattered yellow barriers
      // Teaches: avoid yellow (electric bounce back)
      grid: [
        "RRRRRRRRRRRRR",
        "RPPYPPYPPPYGR",
        "RPPPYPPYPYPPR",
        "RYYPPPPYPPYPR",
        "RPPPYYPPPPPPR",
        "RPYPPYPYYPYPR",
        "RPPPPPPYPPYPR",
        "RPYYPPPPPPPPR",
        "RRRRRRRRRRRRR"
      ],
      start: { r: 1, c: 1 },
      goal: { r: 1, c: 11 }
    },
    2: {
      // Level 2: Ice slides with hazards - control momentum around dangers
      // Teaches: ice makes you slide, must avoid yellow barriers, water near yellow is deadly
      grid: [
        "RRRRRRRRRRRRR",
        "RPUUPPPUUPYGR",
        "RPYBPUUPBPUPR",
        "RPUUPBPUYPUPR",
        "RBPYUPUPBPUPR",
        "RPUUPBPYUPUPR",
        "RPYBPUUPBPYPR",
        "RPUUPPPPUUPPR",
        "RRRRRRRRRRRRR"
      ],
      start: { r: 1, c: 1 },
      goal: { r: 1, c: 11 }
    },
    3: {
      // Level 3: Grapes + water danger - strategic planning
      // Safe path: avoid grapes, navigate water carefully (water is safe if not near yellow)
      grid: [
        "RRRRRRRRRRRRR",
        "RPPBPYOBPYBSR",
        "RPYBPPOYPBPPR",
        "RPBPYPBPOPYBR",
        "RPPOYBPPYBPPR",
        "RPYBPOBPYPBPR",
        "RPBPYPPOYBPPR",
        "RPPOBPYBPPPPR",
        "RRRRRRRRRRRRR"
      ],
      start: { r: 1, c: 1 },
      goal: { r: 1, c: 11 }
    }
  };
  
  const currentLayout = layouts[currentPuzzleLevel];
  const layout = currentLayout.grid;

  puzzleGrid = [];
  for (let r = 0; r < COLOR_PUZZLE_ROWS; r++) {
    let row = [];
    for (let c = 0; c < COLOR_PUZZLE_COLS; c++) {
      const ch = layout[r][c] || "R";
      // G and S are floor tiles where we'll draw the goal/soul
      row.push({ type: (ch === "G" || ch === "S") ? "P" : ch });
    }
    puzzleGrid.push(row);
  }

  puzzlePlayer = currentLayout.start;
  playerPrevPos = currentLayout.start;
  
  if (currentPuzzleLevel === 3) {
    puzzleMessage = "Level 3: Final challenge! Reach the soul!";
    wandererSoulPosition = currentLayout.goal;
    wandererSoulCollected = false;
    // Don't set puzzleLevelGoals for level 3, use wandererSoulPosition instead
  } else {
    puzzleMessage = `Level ${currentPuzzleLevel}: Reach the goal!`;
    puzzleLevelGoals[currentPuzzleLevel] = currentLayout.goal;
    wandererSoulPosition = { r: -1, c: -1 }; // Reset soul position for non-final levels
  }
  
  puzzleComplete = false;
  essenceCollected = false;
  smellsLikeOranges = false;
  isSliding = false;
  slideDirection = { r: 0, c: 0 };
  // Lives persist across attempts in the same game session
  
  // Calculate centering offsets for color puzzle
  const puzzleWidth = COLOR_PUZZLE_COLS * TILE_SIZE;
  const puzzleHeight = COLOR_PUZZLE_ROWS * TILE_SIZE;
  puzzleOffsetX = (width - puzzleWidth) / 2;
  puzzleOffsetY = (height - puzzleHeight) / 2;
}

function drawPuzzle() {
  background(25);
  
  // Draw different puzzles based on which NPC triggered it
  if (currentPuzzleNPC === 'Sorrow') {
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
  // Handle sliding automatically
  if (isSliding && frameCount % 10 === 0) {
    handleColorTileInput();
  }
  
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
      
      // Custom dark color palette
      noStroke();
      if (cell.type === "R") {
        // Wall / blocks - dark royal violet
        fill(90, 70, 160);
        rect(x, y, TILE_SIZE, TILE_SIZE);
        // Add texture
        stroke(60, 15, 70); // Frame color for borders
        strokeWeight(2);
        line(x, y + TILE_SIZE/3, x + TILE_SIZE, y + TILE_SIZE/3);
        line(x, y + 2*TILE_SIZE/3, x + TILE_SIZE, y + 2*TILE_SIZE/3);
      }
      else if (cell.type === "Y") {
        // Electric/bounce tiles - warm yellow
        fill(255, 200, 50);
        rect(x, y, TILE_SIZE, TILE_SIZE);
        // Add electric pattern with darker warm yellow
        stroke(220, 160, 30);
        strokeWeight(2);
        noFill();
        rect(x + 5, y + 5, TILE_SIZE - 10, TILE_SIZE - 10);
      }
      else if (cell.type === "B") {
        // Blue tiles - rich midnight blue
        fill(40, 90, 180);
        rect(x, y, TILE_SIZE, TILE_SIZE);
        // Add water ripple effect
        noStroke();
        fill(60, 120, 200, 150);
        ellipse(x + TILE_SIZE/2, y + TILE_SIZE/2, TILE_SIZE * 0.6);
      }
      else if (cell.type === "O") {
        // Grapes tile - deep magenta (same as bounce for warmth)
        fill(160, 60, 90);
        rect(x, y, TILE_SIZE, TILE_SIZE);
        // Add grape scent effect
        noStroke();
        fill(180, 80, 110, 150);
        ellipse(x + TILE_SIZE/2, y + TILE_SIZE/3, TILE_SIZE * 0.4);
      }
      else if (cell.type === "U") {
        // Purple tiles - ice color (light blue-white)
        fill(180, 220, 255);
        rect(x, y, TILE_SIZE, TILE_SIZE);
        // Add subtle ice shimmer (no arrows)
        noStroke();
        fill(200, 235, 255, 120);
        ellipse(x + TILE_SIZE/3, y + TILE_SIZE/3, TILE_SIZE * 0.3);
        ellipse(x + 2*TILE_SIZE/3, y + 2*TILE_SIZE/3, TILE_SIZE * 0.25);
      }
      else {
        // Floor (base) - deep indigo-charcoal
        fill(22, 18, 40);
        rect(x, y, TILE_SIZE, TILE_SIZE);
      }
    }
  }
  
  // Draw goal or soul depending on level
  if (currentPuzzleLevel < 3) {
    // Draw level goal
    const goal = puzzleLevelGoals[currentPuzzleLevel];
    if (goal) {
      const goalX = goal.c * TILE_SIZE + TILE_SIZE / 2;
      const goalY = goal.r * TILE_SIZE + TILE_SIZE / 2;
      
      // Glowing goal effect (green)
      push();
      noStroke();
      fill(100, 255, 100, 100);
      ellipse(goalX, goalY, TILE_SIZE * 1.2);
      fill(100, 255, 100, 150);
      ellipse(goalX, goalY, TILE_SIZE * 0.8);
      fill(150, 255, 150);
      ellipse(goalX, goalY, TILE_SIZE * 0.5);
      pop();
    }
  } else if (!wandererSoulCollected) {
    // Draw Wanderer's Soul (level 3 only)
    const soulX = wandererSoulPosition.c * TILE_SIZE + TILE_SIZE / 2;
    const soulY = wandererSoulPosition.r * TILE_SIZE + TILE_SIZE / 2;
    
    // Glowing soul effect (purple/lavender for Sorrow)
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
    
    // Label "Sorrow's Soul"
    fill(200, 150, 255);
    textAlign(CENTER, CENTER);
    textSize(10);
    text("Sorrow's Soul", soulX, soulY + TILE_SIZE * 0.7);
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
  
  // Display message and status
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(14);
  text(puzzleMessage, width / 2, height - 40);
  
  // Show grape smell status
  if (smellsLikeOranges) {
    fill(160, 60, 90);
    textSize(10);
    text("* Smells like grapes! *", width / 2, height - 60);
  }
  
  // Show cat lives and level in bottom left
  fill(255);
  textAlign(LEFT, CENTER);
  textSize(14);
  text("Lives: " + globalLives, 20, height - 30);
  text("Level: " + currentPuzzleLevel + "/3", 20, height - 50);
  
  // Return to exploring after collecting soul
  if (wandererSoulCollected && !essenceCollected) {
    essenceCollected = true;
    collectedSouls.push('Sorrow');
    wandererIsStatue = true; // Turn Sorrow into a statue
    
    // Move player away from the statue to avoid being stuck
    for (let npc of npcs) {
      if (npc.name === 'Sorrow') {
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
  if (currentPuzzleNPC === 'Sorrow') {
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
  
  // If sliding, continue sliding automatically
  if (isSliding) {
    const newR = puzzlePlayer.r + slideDirection.r;
    const newC = puzzlePlayer.c + slideDirection.c;
    
    // Check if can continue sliding
    if (newR >= 0 && newR < COLOR_PUZZLE_ROWS && newC >= 0 && newC < COLOR_PUZZLE_COLS) {
      const target = puzzleGrid[newR][newC];
      
      // Stop sliding if hit wall, yellow, or non-ice tile
      if (target.type === "R" || target.type === "Y" || target.type !== "U") {
        const prevDir = slideDirection;
        isSliding = false;
        slideDirection = { r: 0, c: 0 };
        // Only move if not hitting wall or yellow
        if (target.type !== "R" && target.type !== "Y") {
          puzzlePlayer.r = newR;
          puzzlePlayer.c = newC;
          handleColorTileEffect(target, prevDir.r, prevDir.c);
        }
        return;
      }
      
      // Continue sliding on ice tile
      puzzlePlayer.r = newR;
      puzzlePlayer.c = newC;
      puzzleMessage = "Sliding...";
    } else {
      // Out of bounds, stop sliding
      isSliding = false;
      slideDirection = { r: 0, c: 0 };
    }
    return;
  }

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
    puzzleMessage = "Can't pass through walls!";
    return;
  }
  
  // Yellow tile = electric bounce (prevent movement)
  if (target.type === "Y") {
    puzzleMessage = "Bounced back!";
    return;
  }

  // Move player
  playerPrevPos.r = puzzlePlayer.r;
  playerPrevPos.c = puzzlePlayer.c;
  puzzlePlayer.r = newR;
  puzzlePlayer.c = newC;

  handleColorTileEffect(target, dr, dc);
}

function handleColorTileEffect(tile, dr, dc) {
  puzzleMessage = "";

  // Yellow tiles are handled before movement, so this shouldn't trigger
  // But keeping as safety check
  if (tile.type === "Y") {
    puzzleMessage = "Bounced back!";
    puzzlePlayer.r = playerPrevPos.r;
    puzzlePlayer.c = playerPrevPos.c;
    return;
  }

  // Blue = water (dangerous if smell like grapes OR adjacent to yellow)
  if (tile.type === "B") {
    if (smellsLikeOranges) {
      puzzleMessage = "The water reacts to the grape smell! Lost a life!";
      puzzlePlayer.r = playerPrevPos.r;
      puzzlePlayer.c = playerPrevPos.c;
      smellsLikeOranges = false; // Lose the smell
      globalLives--; // Lose a life
      player.lives = globalLives; // Sync with player
      
      // Play hurt sound
      if (hurtSound) {
        hurtSound.play();
      }
      
      // Check if game over
      if (globalLives <= 0) {
        gameState = 'startScreen';
        resetGameState();
      }
      return;
    } else if (isAdjacentToYellow(puzzlePlayer.r, puzzlePlayer.c)) {
      puzzleMessage = "Water near magenta tiles is dangerous! Lost a life!";
      puzzlePlayer.r = playerPrevPos.r;
      puzzlePlayer.c = playerPrevPos.c;
      globalLives--; // Lose a life
      player.lives = globalLives; // Sync with player
      
      // Play hurt sound
      if (hurtSound) {
        hurtSound.play();
      }
      
      // Check if game over
      if (globalLives <= 0) {
        gameState = 'startScreen';
        resetGameState();
      }
      return;
    } else {
      puzzleMessage = "Splashing through water...";
    }
  }

  // Orange tile = makes you smell like grapes
  if (tile.type === "O") {
    smellsLikeOranges = true; // Variable name stays same for code consistency
    puzzleMessage = "You smell like grapes now!";
  }

  // Purple = makes you slide
  if (tile.type === "U") {
    isSliding = true;
    slideDirection = { r: dr, c: dc };
    puzzleMessage = "Sliding on ice!";
  }

  // Pink = safe
  if (tile.type === "P") {
    puzzleMessage = "Safe tile.";
    
    // Check level progression
    if (currentPuzzleLevel < 3) {
      // Check if reached level goal
      const goal = puzzleLevelGoals[currentPuzzleLevel];
      if (goal && puzzlePlayer.r === goal.r && puzzlePlayer.c === goal.c) {
        currentPuzzleLevel++;
        puzzleMessage = `Level ${currentPuzzleLevel - 1} complete! Moving to level ${currentPuzzleLevel}...`;
        setTimeout(() => {
          initColorTilePuzzle(); // Load next level
        }, 1000);
      }
    } else {
      // Level 3 - check if reached the soul position
      if (!wandererSoulCollected && 
          puzzlePlayer.r === wandererSoulPosition.r && 
          puzzlePlayer.c === wandererSoulPosition.c) {
        wandererSoulCollected = true;
        puzzleComplete = true;
        puzzleMessage = "Collected Sorrow's Soul!";
      }
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
    this.hitboxH = this.displayH * 0.6; // Shorter hitbox (60% of height)
    this.hitboxOffsetY = 8; // Offset hitbox down so top doesn't collide as early
    this.w = this.hitboxW; // Alias for tower collision code
    this.h = this.hitboxH; // Alias for tower collision code
    this.speed = 4;
    // Dash properties
    this.canDash = true;
    this.isDashing = false;
    this.dashSpeed = 12;
    this.dashDuration = 0;
    this.dashCooldown = 0; // Cooldown timer
    this.dashCooldownMax = 8; // Shorter cooldown (8 frames = ~0.13 seconds) - prevents spam but allows quick dashes
    this.dashVx = 0;
    this.dashVy = 0;
    // Tower physics properties
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.gravity = 0.6;
    this.jumpForce = 12;
    this.lives = 9; // Tower lives counter
    this.isDashingDown = false; // Track if dashing downward for exit detection
  }
  
  update() {
    if (gameState !== 'exploring') return;
    
    // Don't update during lava fall animation
    if (lavaFallAnimation) return;
    
    // Update dash cooldown (only for non-tower areas)
    // In tower, dash only resets when touching platform
    if (currentArea !== 'ruinedCityBuilding') {
    if (this.dashCooldown > 0) {
      this.dashCooldown--;
        // Cooldown expired - can dash again
      if (this.dashCooldown === 0) {
        this.canDash = true;
        }
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
    
    // Check door collision while dashing (before obstacle collision)
    if (this.isDashing) {
      checkDoorDashCollision();
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
    
    // Keep player in world bounds (adjust based on current area)
    if (currentArea === 'fullWorld') {
      const fullWorldWidth = 4200;
      const fullWorldHeight = 3600;
      this.x = constrain(this.x, this.displayW / 2, fullWorldWidth - this.displayW / 2);
      this.y = constrain(this.y, this.displayH / 2, fullWorldHeight - this.displayH / 2);
    } else if (currentArea === 'ruinedCityBuilding') {
      // Tower area - constrain to canvas size
      this.x = constrain(this.x, this.displayW / 2, width - this.displayW / 2);
      this.y = constrain(this.y, this.displayH / 2, height - this.displayH / 2);
    } else {
      this.x = constrain(this.x, this.displayW / 2, WORLD_WIDTH - this.displayW / 2);
      this.y = constrain(this.y, this.displayH / 2, WORLD_HEIGHT - this.displayH / 2);
    }
  }
  
  move() {
    // Tower-specific movement with gravity and jumping (like towerjump.js)
    // Handle movement
    if (!this.isDashing) {
      if (keyIsDown(65)) { // A
        this.vx = -this.speed;
      } else if (keyIsDown(68)) { // D
        this.vx = this.speed;
      } else {
        this.vx = 0;
      }
      
      // Jump (W or Space) - can hold down to keep jumping when on ground
      if ((keyIsDown(87) || keyIsDown(32)) && this.onGround) {
        this.vy = -this.jumpForce;
        this.onGround = false;
      }
      
      // Apply gravity
      this.vy += this.gravity;
    } else {
      // Dashing - create trail
      if (frameCount % 2 === 0) {
        dashTrail.push(new DashAfterimage(this.x, this.y, this.displayW, this.displayH));
      }
      
      this.dashDuration--;
      if (this.dashDuration <= 0) {
        this.isDashing = false;
        this.isDashingDown = false; // Reset dash direction flag
        this.vx *= 0.5;
        this.vy *= 0.5;
        // canDash remains false until landing on platform/ground (like towerjump.js)
        // Cooldown is handled separately in input handler
      }
    }
    
    // Update position
    this.x += this.vx;
    this.y += this.vy;
    
    // Check drop portal collision while dashing (like ghost door collision)
    if (this.isDashing && currentArea === 'ruinedCityBuilding') {
      if (checkDropPortalCollision()) {
        return; // Portal collision handled, exit early
      }
    }
    
    // Check collision with borders
    if (this.x < this.hitboxW/2) {
      this.x = this.hitboxW/2;
      if (this.isDashing) this.isDashing = false;
    }
    if (this.x > width - this.hitboxW/2) {
      this.x = width - this.hitboxW/2;
      if (this.isDashing) this.isDashing = false;
    }
    // Floor at height - 40 to leave room for exit door
    let floorY = height - 40;
    if (this.y > floorY - this.hitboxH/2) {
      this.y = floorY - this.hitboxH/2;
      this.vy = 0;
      this.onGround = true;
      // Reset dash when touching ground
      this.canDash = true; // Allow dash when cooldown expires
      // Don't reset cooldown - let it finish naturally to prevent spam
      if (this.isDashing) this.isDashing = false;
    }
    
    // Check collision with tower platforms
    let wasOnGround = this.onGround;
    this.onGround = false;
    
    // Check if on bottom border (floor)
    let floorYCheck = height - 40;
    if (this.y >= floorYCheck - this.hitboxH/2) {
      this.onGround = true;
    }
    
    for (let platform of towerPlatforms) {
      if (this.collidesWithPlatform(platform)) {
        let bottomOfPlayer = this.y + this.hitboxH/2;
        let topOfPlayer = this.y - this.hitboxH/2;
        let leftOfPlayer = this.x - this.hitboxW/2;
        let rightOfPlayer = this.x + this.hitboxW/2;
        
        let topOfPlatform = platform.y;
        let bottomOfPlatform = platform.y + platform.h;
        let leftOfPlatform = platform.x;
        let rightOfPlatform = platform.x + platform.w;
        
        let prevBottom = bottomOfPlayer - this.vy;
        let prevTop = topOfPlayer - this.vy;
        let prevLeft = leftOfPlayer - this.vx;
        let prevRight = rightOfPlayer - this.vx;
        
        // Landing on top of platform (falling down)
        if (this.vy > 0 && prevBottom <= topOfPlatform) {
          this.y = topOfPlatform - this.hitboxH/2;
          this.vy = 0;
          this.onGround = true;
          // Reset dash when touching platform
          this.canDash = true; // Allow dash when cooldown expires
          // Don't reset cooldown - let it finish naturally to prevent spam
          if (this.isDashing) this.isDashing = false;
        }
        // Hitting platform from below (jumping up)
        else if (this.vy < 0 && prevTop >= bottomOfPlatform) {
          this.y = bottomOfPlatform + this.hitboxH/2;
          this.vy = 0;
        }
        // Hitting from left side (moving right)
        else if (this.vx > 0 && prevRight <= leftOfPlatform) {
          this.x = leftOfPlatform - this.hitboxW/2;
          this.vx = 0;
          if (this.isDashing) this.isDashing = false;
        }
        // Hitting from right side (moving left)
        else if (this.vx < 0 && prevLeft >= rightOfPlatform) {
          this.x = rightOfPlatform + this.hitboxW/2;
          this.vx = 0;
          if (this.isDashing) this.isDashing = false;
        }
      }
    }
    
    // Terminal velocity
    this.vy = constrain(this.vy, -20, 20);
    
    // Update dash cooldown timer (prevents spam)
    // Cooldown takes priority - must finish even if landing on platform/ground
    if (this.dashCooldown > 0) {
      this.dashCooldown--;
    }
  }
  
  collidesWithPlatform(platform) {
    return this.x + this.hitboxW/2 > platform.x &&
           this.x - this.hitboxW/2 < platform.x + platform.w &&
           this.y + this.hitboxH/2 > platform.y &&
           this.y - this.hitboxH/2 < platform.y + platform.h;
  }
  
  dash(dx, dy) {
    // Simple dash logic from towerjump.js - only check canDash
    // General cooldown prevents spam (checked in input handler)
    if (this.canDash && (dx !== 0 || dy !== 0)) {
      playDashSound();
      this.isDashing = true;
      this.dashDuration = 10;
      this.canDash = false;
      
      // Normalize direction
      let mag = sqrt(dx * dx + dy * dy);
      
      // For tower mode, set vx/vy directly (like towerjump.js)
      if (currentArea === 'ruinedCityBuilding') {
        this.vx = (dx / mag) * this.dashSpeed;
        this.vy = (dy / mag) * this.dashSpeed;
        // Track if dashing downward for drop portal detection
        if (dy > 0) {
          this.isDashingDown = true;
        } else {
          this.isDashingDown = false;
        }
      } else {
        // For regular areas, use dashVx/dashVy
      this.dashVx = (dx / mag) * this.dashSpeed;
      this.dashVy = (dy / mag) * this.dashSpeed;
        this.dashCooldown = this.dashCooldownMax; // Start cooldown timer
      }
    }
  }
  
  collidesWith(obstacle) {
    // Simple AABB collision detection using hitbox (not display size)
    // Hitbox is offset down so top of sprite doesn't collide as early
    let playerLeft = this.x - this.hitboxW / 2;
    let playerRight = this.x + this.hitboxW / 2;
    let playerTop = this.y - this.hitboxH / 2 + this.hitboxOffsetY;
    let playerBottom = this.y + this.hitboxH / 2 + this.hitboxOffsetY;
    
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
    
    // Apply red tint if burning in lava
    if (lavaFallAnimation) {
      tint(255, 100, 100); // Red tint
    }
    
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
// TOWER GAME CLASSES (for Greed's Tower)
// =============================================================================

// Platform class for tower
class TowerPlatform {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }
  
  display() {
    push();
    fill(60, 50, 55);
    stroke(40, 35, 40);
    strokeWeight(3);
    rect(this.x, this.y, this.w, this.h);
    
    // Add texture lines
    stroke(40, 35, 40);
    strokeWeight(1);
    line(this.x + 5, this.y + this.h/2, this.x + this.w - 5, this.y + this.h/2);
    pop();
  }
}

// Tower Enemy (Ghost) class
class TowerEnemy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 50;
    this.speed = 2;
    this.vx = random(-this.speed, this.speed);
    this.vy = random(-this.speed, this.speed);
    this.noiseOffsetX = random(1000);
    this.noiseOffsetY = random(1000);
    this.facingRight = this.vx > 0;
    // Animation offset so each ghost blinks at different times
    this.animationOffset = random(0, 1000);
  }
  
  update() {
    // Smooth floating movement with Perlin noise
    this.noiseOffsetX += 0.02;
    this.noiseOffsetY += 0.02;
    
    let noiseX = noise(this.noiseOffsetX);
    let noiseY = noise(this.noiseOffsetY);
    
    this.vx = map(noiseX, 0, 1, -this.speed, this.speed);
    this.vy = map(noiseY, 0, 1, -this.speed, this.speed);
    
    if (this.vx > 0.1) {
      this.facingRight = true;
    } else if (this.vx < -0.1) {
      this.facingRight = false;
    }
    
    this.x += this.vx;
    this.y += this.vy;
    
    // Bounce off canvas bounds
    if (this.x < this.size/2) {
      this.x = this.size/2;
      this.vx *= -1;
    }
    if (this.x > width - this.size/2) {
      this.x = width - this.size/2;
      this.vx *= -1;
    }
    if (this.y < this.size/2) {
      this.y = this.size/2;
      this.vy *= -1;
    }
    if (this.y > height - this.size/2) {
      this.y = height - this.size/2;
      this.vy *= -1;
    }
  }
  
  display() {
    push();
    imageMode(CENTER);
    translate(this.x, this.y);
    
    // Flip horizontally if moving left
    if (!this.facingRight) {
      scale(-1, 1);
    }
    
    if (ghostImg && ghostImg.width > 0) {
      // Apply animation offset to make each ghost blink at different times
      // Using a time-based offset with frameCount
      let offsetFrameCount = frameCount + this.animationOffset;
      // The offset doesn't directly control the GIF, but we can use tint to create variation
      // Each ghost has a slightly different timing feel based on their offset
      let blinkCycle = (offsetFrameCount * 0.05) % 1;
      // Subtle opacity variation to simulate different blink timing
      let alpha = 255 - (sin(blinkCycle * TWO_PI) * 30);
      tint(255, alpha);
      image(ghostImg, 0, 0, this.size, this.size);
      noTint();
    } else {
      // Fallback
      fill(200, 50, 200, 150);
      stroke(255, 100, 255);
      strokeWeight(2);
      ellipse(0, 0, this.size, this.size);
    }
    
    pop();
  }
}

// Tower Collectible (Coin) class
class TowerCollectible {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 30;
    this.angleOffset = random(TWO_PI);
    this.maxRotation = radians(30);
  }
  
  display() {
    push();
    imageMode(CENTER);
    translate(this.x, this.y);
    
    // Oscillating rotation
    let baseRotation = radians(45);
    let oscillation = sin(frameCount * 0.05 + this.angleOffset) * this.maxRotation;
    rotate(baseRotation + oscillation);
    
    if (coinImg) {
      image(coinImg, 0, 0, this.size, this.size);
    } else {
      // Fallback
      fill(255, 215, 0);
      stroke(255, 180, 0);
      strokeWeight(2);
      ellipse(0, 0, this.size, this.size);
    }
    
    pop();
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
    this.w = 75; // Medium size - bigger than original 60, smaller than 90
    this.h = 75; // Medium size - bigger than original 60, smaller than 90
    this.color = this.getColorByName();
  }
  
  getColorByName() {
    // Cooler colors that work well with purple background
    if (this.name === 'Sorrow') return [180, 120, 255]; // Lavender purple
    if (this.name === 'Echo') return [100, 255, 200]; // Mint teal
    if (this.name === 'Dream Guardian') return [255, 180, 255]; // Pink magenta
    if (this.name === 'King of Greed') return [100, 255, 100]; // Bright green for greed
    if (this.name === 'Rath') return [255, 100, 50]; // Red-orange for fire/wrath
    return [200, 200, 200];
  }
  
  display() {
    this.displaySprite();
    this.displayLabel();
  }
  
  displaySprite() {
    push();
    
    // Display NPC or statue sprite
    if (isNPCStatue(this)) {
      // Statue appearance
      if (this.name === 'Echo' && echoStatueImg) {
        // Echo statue: static grayscale version
        imageMode(CENTER);
        image(echoStatueImg, this.x, this.y, this.w, this.h);
      } else if (this.name === 'King of Greed' && greedKingStatueImg) {
        // King of Greed statue: static grayscale version
        imageMode(CENTER);
        image(greedKingStatueImg, this.x, this.y, this.w, this.h);
      } else if (this.name === 'Sorrow' && sorrowStatueImg) {
        // Sorrow statue: static grayscale version
        imageMode(CENTER);
        image(sorrowStatueImg, this.x, this.y, this.w, this.h);
      } else if (this.name === 'Dream Guardian' && guardianStatueImg) {
        // Dream Guardian statue: static grayscale version
        imageMode(CENTER);
        image(guardianStatueImg, this.x, this.y, this.w, this.h);
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
      } else if (this.name === 'Dream Guardian' && dreamGuardianGif) {
        // Use dreamguardian.gif for Dream Guardian
        imageMode(CENTER);
        image(dreamGuardianGif, this.x, this.y, this.w, this.h);
      } else if (this.name === 'Sorrow' && sorrowGif) {
        // Use sorrow.gif for Sorrow
        imageMode(CENTER);
        image(sorrowGif, this.x, this.y, this.w, this.h);
      } else if (this.name === 'King of Greed' && greedKingGif) {
        // Use greedking.gif for King of Greed
        imageMode(CENTER);
        image(greedKingGif, this.x, this.y, this.w, this.h);
      } else if (this.name === 'Rath' && rathImg) {
        // Use rath.gif for Rath
        imageMode(CENTER);
        image(rathImg, this.x, this.y, this.w, this.h);
      } else if (this.name === 'sans' && sansImg) {
        // Use sans.png for Sans
        imageMode(CENTER);
        image(sansImg, this.x, this.y, this.w, this.h);
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
    
    // Name label
    fill(isNPCStatue(this) ? 150 : 255);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(12);
    
    // Show statue label if turned to stone
    if (isNPCStatue(this)) {
      if (this.name === 'Echo') {
        text('Echo (Statue)', this.x, this.y + this.h / 2 + 20);
      } else if (this.name === 'Sorrow') {
        text('Sorrow (Statue)', this.x, this.y + this.h / 2 + 20);
      } else if (this.name === 'King of Greed') {
        text('King of Greed (Statue)', this.x, this.y + this.h / 2 + 20);
      } else if (this.name === 'Dream Guardian') {
        text('Dream Guardian (Statue)', this.x, this.y + this.h / 2 + 20);
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
    currentArea = 'mansion';
    previousArea = '';
    introSceneIndex = 0;
    introTimer = 0;
    fallingCatY = -100;
    fallingCatRotation = 0;
    jumpCatY = height + 100;
    jumpCatX = width / 2;
    
    // Reset player abilities and items
    hasGhostPepper = false;
    
    // Reset Guardian state
    guardianIntroComplete = false;
    guardianIntroTimer = 0;
    guardianShouldWalkBack = false;
    door2Unlocked = false;
    
    // Reset NPC statue states
    echoIsStatue = false;
    wandererIsStatue = false;
    currentPuzzleNPC = null;
    
    // Reset soul collection
    collectedSouls = [];
    soulDisplayTimer = 0;
    currentSoulDisplay = 0;
    
    // Reset tower states
    towerLevel = 1;
    towerPlatforms = [];
    towerEnemies = [];
    towerCollectibles = [];
    towerCoinsCollected = 0;
    hasGreedSoul = false;
    towerLadderActive = false;
    
    // Reset puzzle states
    puzzleComplete = false;
    essenceCollected = false;
    cageOpen = false;
    smellsLikeOranges = false;
    isSliding = false;
    slideDirection = { r: 0, c: 0 };
    // Lives now use globalLives (no separate catLives)
    currentPuzzleLevel = 1;
    puzzleLevelGoals = [];
    wandererSoulCollected = false;
    
    // Reset floor cache to redraw
    floorPatternCache = null;
    
    // Reset dialogue
    currentDialogue = null;
    dialogueCooldown = 0;
    
    // Reset player state
    if (player) {
      player.canDash = true;
      player.isDashing = false;
      player.dashCooldown = 0;
      player.dashDuration = 0;
    }
    
    initWorld();
  });
}

// =============================================================================
// PIANO PUZZLE SYSTEM
// =============================================================================

// Simple Tone class for piano sounds
class Tone {
  constructor(frequency) {
    this.frequency = frequency;
    this.oscillator = null;
  }
  
  play() {
    let osc = new p5.Oscillator('sine');
    osc.freq(this.frequency);
    osc.amp(0.3);
    osc.start();
    setTimeout(() => osc.stop(), 300); // Play for 300ms
  }
}

// Piano game state
let pianoGamePhase = 'listening'; // 'listening', 'playing', 'complete'
let pianoPlaybackIndex = 0;
let pianoPlaybackTimer = 0;

function drawPianoPuzzle() {
  // Draw fixed gray cave background
  background(80, 80, 80);
  
  // Draw Rath sprite
  if (rathImg) {
    push();
    imageMode(CENTER);
    image(rathImg, width / 2, 140, 80, 80);
    pop();
  }
  
  // Title
  push();
  fill(255);
  textAlign(CENTER);
  textSize(24);
  textFont(pixelFont);
  text("Rath's Melody", width / 2, 50);
  
  // Instructions based on phase
  textSize(12);
  if (pianoGamePhase === 'listening') {
    text("Listen to the melody...", width / 2, height - 80);
  } else if (pianoGamePhase === 'playing') {
    text("Now repeat it back!", width / 2, height - 80);
    textSize(10);
    text("1=C  2=D  3=E  4=G  | ESC to exit", width / 2, height - 50);
    
    // Show current progress
    text("Notes played: " + pianoInputSeq.length + " / " + pianoCorrectSeq.length, width / 2, height - 30);
  }
  pop();
  
  // Display message
  if (pianoMessageTimer > 0) {
    push();
    fill(255, 255, 100);
    textAlign(CENTER);
    textSize(16);
    text(pianoMessage, width / 2, height / 2);
    pianoMessageTimer--;
    pop();
  }
  
  // Auto-play sequence during listening phase
  if (pianoGamePhase === 'listening') {
    pianoPlaybackTimer++;
    if (pianoPlaybackTimer > 40) { // Play next note every 40 frames (~0.67 seconds)
      if (pianoPlaybackIndex < pianoCorrectSeq.length) {
        let note = pianoCorrectSeq[pianoPlaybackIndex];
        if (pianoSounds[note]) {
          pianoSounds[note].play();
        }
        pianoPlaybackIndex++;
        pianoPlaybackTimer = 0;
      } else {
        // Finished playing sequence
        pianoGamePhase = 'playing';
        pianoMessage = "Your turn!";
        pianoMessageTimer = 60;
        pianoInputSeq = [];
      }
    }
  }
}

// Handle piano input in keyPressed
function handlePianoInput() {
  if (gameState === 'pianoPuzzle') {
    if (keyCode === ESCAPE) {
      // Exit piano game
      gameState = 'exploring';
      pianoGamePhase = 'listening';
      pianoPlaybackIndex = 0;
      pianoPlaybackTimer = 0;
      pianoInputSeq = [];
      // Resume background music
      switchMusic();
      return true;
    }
    
    // Only accept input during playing phase
    if (pianoGamePhase === 'playing') {
      let note = null;
      if (key === '1') note = 'C3';
      else if (key === '2') note = 'D3';
      else if (key === '3') note = 'E3';
      else if (key === '4') note = 'G3';
      
      if (note && pianoSounds[note]) {
        pianoSounds[note].play();
        pianoInputSeq.push(note);
        
        // Check if correct so far
        let currentIndex = pianoInputSeq.length - 1;
        if (pianoInputSeq[currentIndex] !== pianoCorrectSeq[currentIndex]) {
          // Wrong note!
          pianoMessage = "Wrong! Try again.";
          pianoMessageTimer = 120;
          pianoInputSeq = [];
          pianoGamePhase = 'listening';
          pianoPlaybackIndex = 0;
          pianoPlaybackTimer = 0;
        } else if (pianoInputSeq.length === pianoCorrectSeq.length) {
          // Success!
          pianoMessage = "Perfect! Soul of Wrath obtained!";
          pianoMessageTimer = 180;
          pianoGamePhase = 'complete';
          
          // Give soul after delay
          setTimeout(() => {
            collectedSouls.push('Rath');
            gameState = 'exploring';
            pianoGamePhase = 'listening';
            pianoPlaybackIndex = 0;
            pianoPlaybackTimer = 0;
            pianoInputSeq = [];
            // Resume background music
            switchMusic();
          }, 3000);
        }
      }
    }
    return true;
  }
  return false;
}

// =============================================================================
// ENDING CUTSCENE
// =============================================================================

function startEndingCutscene() {
  gameState = 'endingCutscene';
  endingCutscenePhase = 0;
  endingCutsceneTimer = 0;
  fadeToPurpleAlpha = 0;
  
  // Set Madeline's spirit position at head (will move to heart)
  // Using the intro image as reference - head is in upper portion
  madelinesSpiritX = width / 2; // Center of screen
  madelinesSpiritY = height * 0.3; // Upper portion (head area)
  
  // Stop music from looping - let it play out naturally
  if (currentMusic) {
    currentMusic.setLoop(false);
  }
}

function resetGameState() {
  // Reset all game progress variables
  globalLives = maxLives;
  collectedSouls = [];
  hasEchoSoul = false;
  hasGreedSoul = false;
  wandererIsStatue = false;
  greedKingIsStatue = false;
  guardianIsStatue = false;
  echoIsStatue = false;
  hasCabinKey = false;
  cabinUnlocked = false;
  door2Unlocked = false;
  towerLadderActive = false;
  escapeRoomCompleted = false;
  hasGhostPepper = false; // Remove dash ability
  guardianIntroComplete = false; // Reset intro
  guardianShouldWalkBack = false;
  guardianIntroTimer = 0;
  essenceCollected = false; // Reset Echo's essence
  cageOpen = false; // Reset cage state
  currentPuzzleNPC = null; // Reset puzzle tracking
  
  // Reset minigame states
  pianoInputSeq = []; // Reset piano puzzle
  towerLevel = 1; // Reset tower to level 1
  towerCoinsCollected = 0; // Reset coin count
  towerPlatforms = [];
  towerEnemies = [];
  towerCollectibles = [];
  
  // Reset player dash state
  if (player) {
    player.canDash = false;
    player.isDashing = false;
    player.dashCooldown = 0;
    player.dashDuration = 0;
  }
  
  // Reset area tracking
  currentArea = 'mansion';
  previousArea = '';
  
  // Stop all music
  if (currentMusic) {
    currentMusic.stop();
  }
  currentMusic = null;
  
  // Reset ending cutscene variables
  endingCutscenePhase = 0;
  endingCutsceneTimer = 0;
  fadeToPurpleAlpha = 0;
  showRestartButton = false;
  cageOpening = false;
  cageOpeningProgress = 0;
  
  // Hide escape room UI elements if they exist
  if (escapeInputBox) escapeInputBox.hide();
  if (escapeSubmitButton) escapeSubmitButton.hide();
}

function restartGame() {
  // Reset game state
  resetGameState();
  
  // Go back to start screen (not intro directly)
  gameState = 'startScreen';
}

function drawEndingCutscene() {
  updateEndingCutscene();
  
  if (endingCutscenePhase === 0) {
    // Phase 0: Show intro image with Ectopaws jumping out and falling down (like intro but reversed)
    // Draw the intro image (Madeline sleeping)
    if (madelineImg) {
      imageMode(CORNER);
      image(madelineImg, 0, 0, width, height);
    }
    
    // Animate cat jumping out and falling (reverse of intro jump)
    let progress = endingCutsceneTimer / 120; // 0 to 1 (same duration as intro)
    
    // Ease in-out cubic for smooth jump (same as intro)
    let easeProgress = progress < 0.5 
      ? 4 * progress * progress * progress 
      : 1 - pow(-2 * progress + 2, 3) / 2;
    
    // Jump from head area down to below screen (reverse of intro)
    let ectopawsY = map(easeProgress, 0, 1, height * 0.3, height + 50);
    
    // Slight arc in the jump (same as intro)
    let arcOffset = sin(progress * PI) * 30;
    let ectopawsX = width / 2 + arcOffset;
    
    // Draw the cat
    push();
    imageMode(CENTER);
    
    // Slight rotation during jump (same as intro)
    translate(ectopawsX, ectopawsY);
    rotate(sin(progress * PI * 2) * 0.2);
    
    if (catImg) {
      image(catImg, 0, 0, 60, 60);
    } else {
      fill(150, 150, 150);
      ellipse(0, 0, 60, 60);
    }
    pop();
    
  } else if (endingCutscenePhase === 1) {
    // Phase 1: Dark purple spirit moves from head to heart
    // Draw the intro image
    if (madelineImg) {
      imageMode(CORNER);
      image(madelineImg, 0, 0, width, height);
    }
    
    // Draw spirit (dark purple, like cage)
    push();
    let heartX = width / 2;
    let heartY = height * 0.75; // Lower 3/4 of screen (heart position)
    
    // Lerp spirit position from head to heart
    madelinesSpiritX = lerp(madelinesSpiritX, heartX, 0.03);
    madelinesSpiritY = lerp(madelinesSpiritY, heartY, 0.03);
    
    // Draw dark purple glowing spirit (similar to cage energy)
    noStroke();
    let pulseAlpha = 100 + sin(frameCount * 0.1) * 50;
    
    // Outer glow
    fill(80, 20, 100, pulseAlpha);
    ellipse(madelinesSpiritX, madelinesSpiritY, 80, 80);
    
    // Middle glow
    fill(60, 10, 80, pulseAlpha + 50);
    ellipse(madelinesSpiritX, madelinesSpiritY, 60, 60);
    
    // Core
    fill(40, 0, 60, 200);
    ellipse(madelinesSpiritX, madelinesSpiritY, 40, 40);
    
    pop();
    
  } else if (endingCutscenePhase === 2) {
    // Phase 2: Fade to dark purple (spirit absorbed)
    background(40, 20, 60, fadeToPurpleAlpha); // Darker purple
    
    // Increase fade alpha
    fadeToPurpleAlpha = min(fadeToPurpleAlpha + 3, 255);
    
  } else if (endingCutscenePhase === 3) {
    // Phase 3: Show text and restart button (keep music playing)
    background(40, 20, 60); // Darker purple background
    
    // Keep music playing - don't stop it
    
    // Yellow text in center (using location text color)
    push();
    fill(255, 215, 0); // Same yellow as location text
    textAlign(CENTER, CENTER);
    textSize(24);
    text("madeline can sleep well now...", width / 2, height / 2 - 50);
    pop();
    
    // Show restart button after 3 seconds (180 frames)
    if (showRestartButton) {
      // Draw restart button (same style as start game button)
      let buttonX = width / 2 - 120;
      let buttonY = height / 2 + 50;
      let buttonW = 240;
      let buttonH = 60;
      
      // Check hover
      let isHover = mouseX > buttonX && mouseX < buttonX + buttonW && 
                    mouseY > buttonY && mouseY < buttonY + buttonH;
      
      // Button background - match start button style
      if (isHover) {
        fill(255, 255, 100);
      } else {
        fill(255, 220, 0);
      }
      
      stroke(255, 200, 0);
      strokeWeight(3);
      rect(buttonX, buttonY, buttonW, buttonH, 5);
      
      // Button text
      fill(0);
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(20);
      text("RESTART GAME", buttonX + buttonW / 2, buttonY + buttonH / 2);
    }
  }
}

function updateEndingCutscene() {
  endingCutsceneTimer++;
  
  // Phase transitions
  if (endingCutscenePhase === 0 && endingCutsceneTimer > 120) {
    // After 2 seconds (same as intro jump), move to phase 1
    endingCutscenePhase = 1;
    endingCutsceneTimer = 0;
  } else if (endingCutscenePhase === 1 && endingCutsceneTimer > 180) {
    // After 3 seconds, move to phase 2
    endingCutscenePhase = 2;
    endingCutsceneTimer = 0;
  } else if (endingCutscenePhase === 2 && fadeToPurpleAlpha >= 255) {
    // Once faded, move to phase 3
    endingCutscenePhase = 3;
    endingCutsceneTimer = 0;
    showRestartButton = false;
  } else if (endingCutscenePhase === 3 && endingCutsceneTimer > 180 && !showRestartButton) {
    // After 3 seconds, show restart button
    showRestartButton = true;
  }
}

// =============================================================================
// ESCAPE ROOM PUZZLE
// =============================================================================

function startEscapeRoom() {
  gameState = 'escapeRoom';
  escapeRoomState = "playing";
  escapeHasKey = false;
  escapeDoorUnlocked = false;
  escapeHasGem = false;
  escapeChestOpened = false;
  escapeHint = "";
  escapeMessage = "";
  escapeMessageTimer = 0;
  escapeCode = nf(int(random(1000, 9999)), 4);
  escapeStartTime = millis();
  
  // Reset player for escape room
  player.x = width / 2;
  player.y = ESCAPE_FLOOR_Y - 75;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
  
  // Build platform rectangles for escape room
  escapePlatformRects = [];
  for (let key in escapeObjects) {
    const o = escapeObjects[key];
    if (o.platform) {
      escapePlatformRects.push({
        x: (o.hitboxX !== undefined ? o.hitboxX : o.x),
        y: (o.hitboxY !== undefined ? o.hitboxY : o.y),
        w: (o.hitboxW !== undefined ? o.hitboxW : o.w),
        h: (o.hitboxH !== undefined ? o.hitboxH : o.h)
      });
    }
  }
  
  // Create input elements if they don't exist
  if (!escapeInputBox) {
    escapeInputBox = createInput();
    escapeInputBox.position(width / 2 + 50, height - 50);
    escapeInputBox.size(100);
    escapeInputBox.hide();
    
    escapeSubmitButton = createButton("Submit");
    escapeSubmitButton.position(width / 2 + 160, height - 50);
    escapeSubmitButton.mousePressed(checkEscapeCode);
    escapeSubmitButton.hide();
  }
}

function drawEscapeRoom() {
  // Draw room background
  if (escapeRoomImg) {
    image(escapeRoomImg, 0, 0, width, height);
  } else {
    background(40);
  }
  
  // Draw all objects
  if (escapePaintingImg) image(escapePaintingImg, escapeObjects.painting.x, escapeObjects.painting.y, escapeObjects.painting.w, escapeObjects.painting.h);
  if (escapeDrawerImg) image(escapeDrawerImg, escapeObjects.drawer.x, escapeObjects.drawer.y, escapeObjects.drawer.w, escapeObjects.drawer.h);
  if (!escapeChestOpened && escapeChestImg) {
    image(escapeChestImg, escapeObjects.chest.x, escapeObjects.chest.y, escapeObjects.chest.w, escapeObjects.chest.h);
  } else if (escapeOpenChestImg) {
    image(escapeOpenChestImg, escapeObjects.chest.x, escapeObjects.chest.y, escapeObjects.chest.w, escapeObjects.chest.h);
  }
  if (escapeBedImg) image(escapeBedImg, escapeObjects.bed.x, escapeObjects.bed.y, escapeObjects.bed.w, escapeObjects.bed.h);
  if (escapeCarpetImg) image(escapeCarpetImg, escapeObjects.carpet.x, escapeObjects.carpet.y, escapeObjects.carpet.w, escapeObjects.carpet.h);
  if (escapeTableImg) image(escapeTableImg, escapeObjects.table.x, escapeObjects.table.y, escapeObjects.table.w, escapeObjects.table.h);
  if (escapeCrystalImg) image(escapeCrystalImg, escapeObjects.crystalball.x, escapeObjects.crystalball.y, escapeObjects.crystalball.w, escapeObjects.crystalball.h);
  if (escapeMirrorImg) image(escapeMirrorImg, escapeObjects.mirror.x, escapeObjects.mirror.y, escapeObjects.mirror.w, escapeObjects.mirror.h);
  if (escapeDoorImg) image(escapeDoorImg, escapeObjects.door.x, escapeObjects.door.y, escapeObjects.door.w, escapeObjects.door.h);
  
  // Update and draw player
  updateEscapeRoomPlayer();
  player.display();
  
  // Draw dash trail
  for (let i = dashTrail.length - 1; i >= 0; i--) {
    dashTrail[i].life--;
    dashTrail[i].display();
    if (dashTrail[i].life <= 0) {
      dashTrail.splice(i, 1);
    }
  }
  
  // Draw interaction prompt
  drawEscapeInteraction();
  
  // Draw UI
  drawEscapeUI();
}

function updateEscapeRoomPlayer() {
  let p = player;
  
  // Movement (horizontal)
  if (!p.isDashing) {
    if (keyIsDown(65) || keyIsDown(37)) { // A or Left
      p.vx = -p.speed;
    } else if (keyIsDown(68) || keyIsDown(39)) { // D or Right
      p.vx = p.speed;
    } else {
      p.vx = 0;
    }
    
    // Jump (allow holding W/Space for continuous jump attempts)
    if ((keyIsDown(87) || keyIsDown(32)) && p.onGround) {
      p.vy = -p.jumpForce;
      p.onGround = false;
    }
    
    p.vy += p.gravity;
  } else {
    // Dashing - add trail
    dashTrail.push(new DashAfterimage(p.x, p.y, p.displayW, p.displayH));
    p.dashDuration--;
    if (p.dashDuration <= 0) {
      p.isDashing = false;
      p.vx *= 0.5;
      p.vy *= 0.5;
    }
  }
  
  // Dash cooldown
  if (p.dashCooldown > 0) {
    p.dashCooldown--;
  }
  
  // Dash input (8-directional)
  if (keyIsDown(SHIFT) && p.canDash && !p.isDashing && p.dashCooldown === 0) {
    let dx = 0;
    let dy = 0;
    if (keyIsDown(65) || keyIsDown(37)) dx = -1; // Left
    if (keyIsDown(68) || keyIsDown(39)) dx = 1;  // Right
    if (keyIsDown(87) || keyIsDown(38)) dy = -1; // Up
    if (keyIsDown(83) || keyIsDown(40)) dy = 1;  // Down
    
    if (dx !== 0 || dy !== 0) {
      p.isDashing = true;
      p.dashDuration = 10;
      p.canDash = false;
      p.dashCooldown = 60; // 1 second cooldown
      p.vx = dx * p.dashSpeed;
      p.vy = dy * p.dashSpeed;
      if (wooshSound) wooshSound.play();
    }
  }
  
  // Apply velocity
  p.x += p.vx;
  p.y += p.vy;
  
  // Bounds
  const minX = 10 + p.w / 2;
  const maxX = width - 10 - p.w / 2;
  if (p.x < minX) { p.x = minX; p.isDashing = false; }
  if (p.x > maxX) { p.x = maxX; p.isDashing = false; }
  
  // Floor collision
  const playerBottom = p.y + p.h / 2;
  if (playerBottom >= ESCAPE_FLOOR_Y) {
    p.y = ESCAPE_FLOOR_Y - p.h / 2;
    p.vy = 0;
    p.onGround = true;
    p.canDash = true;
    p.isDashing = false;
  } else {
    p.onGround = false;
  }
  
  // Platform collision
  for (let r of escapePlatformRects) {
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
}

function handleEscapeRoomInput() {
  if (gameState !== 'escapeRoom') return false;
  
  // Interact (E key only)
  if (key === 'E' || key === 'e') {
    handleEscapeInteraction();
    return true;
  }
  
  return false;
}

function handleEscapeInteraction() {
  let target = getNearestEscapeInteractable();
  if (!target) return;
  
  const name = target.name;
  
  if (name === "Drawer") {
    if (!escapeHasKey) {
      escapeHasKey = true;
      escapeMessage = "You found a key!";
      if (escapeSfxDrawer) escapeSfxDrawer.play();
    } else {
      escapeMessage = "The drawer is empty...";
      if (escapeSfxCloth) escapeSfxCloth.play();
    }
  }
  else if (name === "Painting") {
    escapeMessage = "Just a painting... nothing special";
    if (escapeSfxCloth) escapeSfxCloth.play();
  }
  else if (name === "Chest") {
    if (!escapeHasKey) {
      escapeMessage = "It's locked... maybe there's a key somewhere.";
    } else if (escapeHasKey && !escapeChestOpened) {
      escapeHasGem = true;
      escapeChestOpened = true;
      escapeMessage = "Unlocked the chest and found a glowing gem!";
      if (escapeSfxKey) escapeSfxKey.play();
    } else {
      escapeMessage = "The chest is empty now...";
    }
  }
  else if (name === "Crystal Ball") {
    if (!escapeHasKey) escapeHint = "The crystal whispers: 'Check the drawer...'";
    else if (!escapeHasGem) escapeHint = "The crystal hums: 'Something valuable lies within the chest...'";
    else if (!escapeDoorUnlocked) escapeHint = "The crystal glows: 'The mirror holds your path to freedom...'";
    else escapeHint = "The crystal dims, its power spent.";
    escapeMessage = "The crystal ball shimmers softly.";
  }
  else if (name === "Magic Mirror") {
    if (!escapeHasGem) {
      escapeMessage = "The mirror's surface ripples faintly, but nothing happens...";
    } else {
      escapeMessage = "The mirror reveals glowing runes: " + escapeCode;
    }
  }
  else if (name === "Bed") {
    escapeMessage = "Nothing useful here...";
    if (escapeSfxCloth) escapeSfxCloth.play();
  }
  else if (name === "Carpet") {
    escapeMessage = "Just a carpet...";
    if (escapeSfxCloth) escapeSfxCloth.play();
  }
  else if (name === "Door") {
    if (escapeDoorUnlocked) {
      // Door is unlocked - player can exit
      escapeRoomCompleted = true;
      escapeMessage = "Escaping to the dreamscape...";
      escapeMessageTimer = millis();
      
      // After 1 second, transition back to room1 in normal mode
      setTimeout(() => {
        gameState = 'exploring';
        currentArea = 'room1';
        previousArea = 'mansion';
        initRoom1(); // Will now initialize as normal room
        switchMusic();
      }, 1000);
    } else if (escapeHasGem && !escapeDoorUnlocked) {
      escapeInputBox.show();
      escapeSubmitButton.show();
      escapeMessage = "Enter the 4-digit code to escape.";
    } else if (!escapeHasGem) {
      escapeMessage = "It's locked tight.";
    }
  }
  
  escapeMessageTimer = millis();
}

function getNearestEscapeInteractable() {
  let best = null;
  let bestDist = Infinity;
  for (let key in escapeObjects) {
    const o = escapeObjects[key];
    if (!o.interact) continue;
    const cx = o.x + o.w / 2;
    const cy = o.y + o.h / 2;
    const d = dist(player.x, player.y, cx, cy);
    if (d < ESCAPE_INTERACT_RADIUS && d < bestDist) {
      best = o;
      bestDist = d;
    }
  }
  return best;
}

function drawEscapeInteraction() {
  const target = getNearestEscapeInteractable();
  if (!target) return;
  push();
  
  // Calculate text width dynamically
  textSize(14);
  const message = "Press E to interact with " + target.name;
  const textW = textWidth(message);
  const boxW = textW + 40; // Add padding
  const boxH = 36;
  
  // Draw background box
  fill(0, 180);
  noStroke();
  rectMode(CENTER);
  rect(width / 2, 40, boxW, boxH, 8);
  
  // Draw text
  fill(255);
  textAlign(CENTER, CENTER);
  text(message, width / 2, 40);
  pop();
}

function drawEscapeUI() {
  push();
  
  if (escapeMessage && millis() - escapeMessageTimer < 2000) {
    // Draw background box
    textSize(16);
    const msgTextW = textWidth(escapeMessage);
    const boxW = min(msgTextW + 40, width - 40); // Cap at canvas width
    const boxH = 40;
    
    fill(0, 180);
    noStroke();
    rectMode(CENTER);
    rect(width / 2, height - 40, boxW, boxH, 8);
    
    // Draw text with wrapping
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(16);
    
    // Wrap text if too long
    if (msgTextW > width - 80) {
      const words = escapeMessage.split(' ');
      let line = '';
      let y = height - 50;
      for (let word of words) {
        let testLine = line + word + ' ';
        if (textWidth(testLine) > width - 80) {
          text(line, width / 2, y);
          line = word + ' ';
          y += 20;
        } else {
          line = testLine;
        }
      }
      text(line, width / 2, y);
    } else {
      text(escapeMessage, width / 2, height - 40);
    }
  }
  
  if (escapeHint) {
    textAlign(CENTER, TOP);
    fill(255);
    textSize(14);
    text(escapeHint, width / 2, 10);
  }
  pop();
}

function checkEscapeCode() {
  if (escapeInputBox.value() === escapeCode) {
    escapeDoorUnlocked = true;
    escapeInputBox.hide();
    escapeSubmitButton.hide();
    escapeMessage = "Door unlocked! Interact with the door to escape.";
    escapeMessageTimer = millis();
  } else {
    escapeMessage = "Wrong code!";
    escapeMessageTimer = millis();
  }
}

// =============================================================================
// DASH INPUT FUNCTION
// =============================================================================

function checkDash() {
  // Only allow dashing if player has ghost pepper
  if (!hasGhostPepper) {
    return;
  }
  
  // Don't allow dashing during lava fall animation
  if (lavaFallAnimation) {
    return;
  }
  
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

// =============================================================================
// BACKGROUND MUSIC MANAGEMENT
// =============================================================================

function switchMusic() {
  // Determine which music should be playing based on current area/gameState
  let targetMusic = null;
  
  // Piano puzzle gets no music (need to hear piano notes)
  if (gameState === 'pianoPuzzle') {
    targetMusic = null;
  }
  // Intro sequence and fullWorld (exterior dreamscape) get dreamscape music
  else if (gameState === 'intro' || currentArea === 'fullWorld') {
    targetMusic = dreamscapeMusic;
  }
  // All indoor areas get mansion music: mansion, rooms, cabin, cave, ruined building
  else if (currentArea === 'mansion' || currentArea === 'room1' || 
           currentArea === 'room2' || currentArea === 'room3' || 
           currentArea === 'wandererRoom' || currentArea === 'kingsChamber' ||
           currentArea === 'rathCave' || currentArea === 'ruinedCityBuilding') {
    targetMusic = mansionMusic;
  }
  // Default to dreamscape for any other state
  else {
    targetMusic = dreamscapeMusic;
  }
  
  // If target music is the same as current, do nothing
  if (targetMusic === currentMusic) {
    return;
  }
  
  // Fade out current music
  if (currentMusic && currentMusic.isPlaying()) {
    currentMusic.stop();
  }
  
  // Fade in new music
  if (targetMusic) {
    targetMusic.loop();
    targetMusic.setVolume(0.3); // Set volume to 30%
    currentMusic = targetMusic;
  } else {
    currentMusic = null; // No music playing
  }
}

