// =============================================================================
// VARIABLE DECLARATIONS
// =============================================================================

// Game states
let gameState = 'start'; // 'start', 'playing', 'gameOver'

// Player
let player;
let catImg;
let dashTrail = [];

// Sprites
let ghostImg;
let coinImg;

// World
let platforms = [];
let enemies = [];
let collectibles = [];
let walls = [];
let WORLD_WIDTH = 600;
let WORLD_HEIGHT = 800;
let BORDER_THICKNESS = 10;

// Game progression
let level = 1;
let coinsCollected = 0;
let totalCoinsEver = 0; // Track across all sessions
let lives = 9;
let maxLives = 9;
let damageFlashTimer = 0;

// Game settings
let difficulty = 'Medium'; // Peaceful, Easy, Medium, Hard
let soundEnabled = true;

// Audio
let jumpSound;
let dashSound;
let coinSound;
let hurtSound;

// Perlin noise offset for procedural generation
let noiseOffset = 0;

// =============================================================================
// P5.JS CORE FUNCTIONS
// =============================================================================

function preload() {
  // Load the cat animation
  catImg = loadImage('ectopaw.gif');
  
  // Load ghost and coin sprites
  ghostImg = loadImage('ghost.sprite.png');
  coinImg = loadImage('goldcoinpixel.png');
}

function setup() {
  let canvas = createCanvas(WORLD_WIDTH, WORLD_HEIGHT);
  canvas.parent('canvas-container');
  
  // Set default font to Monaco
  textFont('Monaco');
  
  // Load from localStorage
  totalCoinsEver = parseInt(localStorage.getItem('ectopawsTotalCoins')) || 0;
  
  updateUI();
  
  // Initialize audio (simple oscillator sounds)
  jumpSound = new p5.Oscillator('sine');
  dashSound = new p5.Oscillator('square');
  coinSound = new p5.Oscillator('triangle');
  hurtSound = new p5.Oscillator('sawtooth');
  
  // Initialize player
  initPlayer();
  
  // Setup HTML button listeners
  setupButtons();
}

function draw() {
  background(15, 15, 25);
  
  if (gameState === 'start') {
    drawStartScreen();
  } else if (gameState === 'playing') {
    drawGame();
  } else if (gameState === 'gameOver') {
    drawGameOver();
  }
}

function mousePressed() {
  console.log("Mouse pressed! Game state: " + gameState);
  
  // Only respond to clicks on the canvas
  if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) {
    return; // Click was outside canvas
  }
  
  if (gameState === 'start') {
    console.log("Starting game...");
    gameState = 'playing';
    level = 1;
    coinsCollected = 0;
    lives = maxLives;
    damageFlashTimer = 0;
    dashTrail = []; // Clear dash trail
    disableDifficultyButtons(); // Disable difficulty buttons during play
    console.log("About to call generateWorld()");
    generateWorld();
    console.log("After generateWorld, arrays have: P=" + platforms.length + " W=" + walls.length + " E=" + enemies.length + " C=" + collectibles.length);
    player.reset(width/2, height - 100);
    updateUI();
  } else if (gameState === 'gameOver') {
    gameState = 'start';
    enableDifficultyButtons(); // Re-enable difficulty buttons
  }
}

// =============================================================================
// CLASSES
// =============================================================================

// Player class
class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    // Display size (how big the sprite looks)
    this.displayW = 65;
    this.displayH = 65;
    // Hitbox dimensions (smaller width for tighter side collision)
    // Width is smaller so enemies/coins need to touch the body, not empty space
    // Height matches display to prevent sinking into ground
    this.w = 40;  // Collision width - skinnier for tighter side hits
    this.h = 65;  // Collision height - matches display to prevent ground sink
    this.vx = 0;
    this.vy = 0;
    this.speed = 4;
    this.jumpForce = 12;
    this.gravity = 0.6;
    this.onGround = false;
    this.canDash = true;
    this.isDashing = false;
    this.dashSpeed = 15;
    this.dashDuration = 0;
  }
  
  update() {
    // Handle movement
    if (!this.isDashing) {
      if (keyIsDown(65)) { // A
        this.vx = -this.speed;
      } else if (keyIsDown(68)) { // D
        this.vx = this.speed;
      } else {
        this.vx = 0;
      }
      
      // Jump (W or Space)
      if ((keyIsDown(87) || keyIsDown(32)) && this.onGround) { // W or Space
        this.vy = -this.jumpForce;
        this.onGround = false;
        playJumpSound();
      }
      
      // Apply gravity
      this.vy += this.gravity;
    } else {
      // Dashing - create trail every few frames (use display size for trail)
      if (frameCount % 2 === 0) {
        dashTrail.push(new DashAfterimage(this.x, this.y, this.displayW, this.displayH));
      }
      
      this.dashDuration--;
      if (this.dashDuration <= 0) {
        this.isDashing = false;
        this.vx *= 0.5;
        this.vy *= 0.5;
      }
    }
    
    // Update position
    this.x += this.vx;
    this.y += this.vy;
    
    // Check collision with borders
    if (this.x < BORDER_THICKNESS + this.w/2) {
      this.x = BORDER_THICKNESS + this.w/2;
      if (this.isDashing) this.isDashing = false;
    }
    if (this.x > width - BORDER_THICKNESS - this.w/2) {
      this.x = width - BORDER_THICKNESS - this.w/2;
      if (this.isDashing) this.isDashing = false;
    }
    if (this.y > height - BORDER_THICKNESS - this.h/2) {
      this.y = height - BORDER_THICKNESS - this.h/2;
      this.vy = 0;
      this.onGround = true;
      this.canDash = true;
      if (this.isDashing) this.isDashing = false;
    }
    
    // Check collision with platforms
    let wasOnGround = this.onGround;
    this.onGround = false;
    
    // Check if on bottom border
    if (this.y >= height - BORDER_THICKNESS - this.h/2) {
      this.onGround = true;
    }
    
    for (let platform of platforms) {
      if (this.collidesWithPlatform(platform)) {
        let bottomOfPlayer = this.y + this.h/2;
        let topOfPlayer = this.y - this.h/2;
        let leftOfPlayer = this.x - this.w/2;
        let rightOfPlayer = this.x + this.w/2;
        
        let topOfPlatform = platform.y;
        let bottomOfPlatform = platform.y + platform.h;
        let leftOfPlatform = platform.x;
        let rightOfPlatform = platform.x + platform.w;
        
        // Determine collision direction based on velocity and position
        let prevBottom = bottomOfPlayer - this.vy;
        let prevTop = topOfPlayer - this.vy;
        let prevLeft = leftOfPlayer - this.vx;
        let prevRight = rightOfPlayer - this.vx;
        
        // Landing on top of platform (falling down)
        if (this.vy > 0 && prevBottom <= topOfPlatform) {
          this.y = topOfPlatform - this.h/2;
          this.vy = 0;
          this.onGround = true;
          this.canDash = true;
          if (this.isDashing) this.isDashing = false;
        }
        // Hitting platform from below (jumping up)
        else if (this.vy < 0 && prevTop >= bottomOfPlatform) {
          this.y = bottomOfPlatform + this.h/2;
          this.vy = 0;
        }
        // Hitting from left side (moving right)
        else if (this.vx > 0 && prevRight <= leftOfPlatform) {
          this.x = leftOfPlatform - this.w/2;
          this.vx = 0;
          if (this.isDashing) this.isDashing = false;
        }
        // Hitting from right side (moving left)
        else if (this.vx < 0 && prevLeft >= rightOfPlatform) {
          this.x = rightOfPlatform + this.w/2;
          this.vx = 0;
          if (this.isDashing) this.isDashing = false;
        }
      }
    }
    
    // Check collision with walls (can stand on them, dash can break them)
    for (let i = walls.length - 1; i >= 0; i--) {
      if (this.collidesWithWall(walls[i])) {
        if (this.isDashing) {
          // Break the wall
          walls.splice(i, 1);
        } else {
          let wall = walls[i];
          let bottomOfPlayer = this.y + this.h/2;
          let topOfPlayer = this.y - this.h/2;
          let leftOfPlayer = this.x - this.w/2;
          let rightOfPlayer = this.x + this.w/2;
          
          let topOfWall = wall.y;
          let bottomOfWall = wall.y + wall.h;
          let leftOfWall = wall.x;
          let rightOfWall = wall.x + wall.w;
          
          let prevBottom = bottomOfPlayer - this.vy;
          let prevTop = topOfPlayer - this.vy;
          let prevLeft = leftOfPlayer - this.vx;
          let prevRight = rightOfPlayer - this.vx;
          
          // Landing on top of wall (falling down)
          if (this.vy > 0 && prevBottom <= topOfWall) {
            this.y = topOfWall - this.h/2;
            this.vy = 0;
            this.onGround = true;
            this.canDash = true;
          }
          // Hitting wall from below (jumping up)
          else if (this.vy < 0 && prevTop >= bottomOfWall) {
            this.y = bottomOfWall + this.h/2;
            this.vy = 0;
          }
          // Hitting from left side (moving right)
          else if (this.vx > 0 && prevRight <= leftOfWall) {
            this.x = leftOfWall - this.w/2;
            this.vx = 0;
          }
          // Hitting from right side (moving left)
          else if (this.vx < 0 && prevLeft >= rightOfWall) {
            this.x = rightOfWall + this.w/2;
            this.vx = 0;
          }
        }
      }
    }
    
    // Terminal velocity
    this.vy = constrain(this.vy, -20, 20);
    
    // UI is now drawn on canvas, no need to update HTML
  }
  
  display() {
    push();
    imageMode(CENTER);
    
    // Draw cat image at display size (bigger than hitbox)
    if (catImg) {
      image(catImg, this.x, this.y, this.displayW, this.displayH);
    } else {
      // Fallback if image doesn't load
      fill(255, 200, 100);
      ellipse(this.x, this.y, this.displayW, this.displayH);
      // Simple face
      fill(0);
      ellipse(this.x - 7, this.y - 5, 5, 5);
      ellipse(this.x + 7, this.y - 5, 5, 5);
    }
    
    pop();
  }
  
  dash(dx, dy) {
    if (this.canDash && (dx !== 0 || dy !== 0)) {
      playDashSound();
      this.isDashing = true;
      this.dashDuration = 10;
      this.canDash = false;
      
      // Normalize direction
      let mag = sqrt(dx * dx + dy * dy);
      this.vx = (dx / mag) * this.dashSpeed;
      this.vy = (dy / mag) * this.dashSpeed;
    }
  }
  
  collidesWithPlatform(platform) {
    return this.x + this.w/2 > platform.x &&
           this.x - this.w/2 < platform.x + platform.w &&
           this.y + this.h/2 > platform.y &&
           this.y - this.h/2 < platform.y + platform.h;
  }
  
  collidesWithWall(wall) {
    return this.x + this.w/2 > wall.x &&
           this.x - this.w/2 < wall.x + wall.w &&
           this.y + this.h/2 > wall.y &&
           this.y - this.h/2 < wall.y + wall.h;
  }
  
  collidesWith(obj) {
    return dist(this.x, this.y, obj.x, obj.y) < (this.w/2 + obj.size/2);
  }
  
  reset(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.canDash = true;
    this.isDashing = false;
  }
}

// Platform class
class Platform {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }
  
  display() {
    push();
    fill(40, 40, 50);
    stroke(0);
    strokeWeight(3);
    rect(this.x, this.y, this.w, this.h);
    
    // Add some texture
    stroke(20, 20, 30);
    strokeWeight(1);
    line(this.x + 10, this.y + 5, this.x + this.w - 10, this.y + 5);
    line(this.x + 10, this.y + 10, this.x + this.w - 10, this.y + 10);
    pop();
  }
}

// Wall class (breakable with dash)
class Wall {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }
  
  display() {
    push();
    fill(80, 50, 50);
    stroke(0);
    strokeWeight(3);
    rect(this.x, this.y, this.w, this.h);
    
    // Crack pattern
    stroke(60, 30, 30);
    strokeWeight(2);
    line(this.x + this.w/2, this.y, this.x + this.w/2, this.y + this.h);
    line(this.x, this.y + this.h/2, this.x + this.w, this.y + this.h/2);
    pop();
  }
}

// Enemy class (Ghost)
class Enemy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 60;
    this.speed = 2.5; // Increased from 1.2 to 2.5 for bigger range
    this.vx = random(-this.speed, this.speed);
    this.vy = random(-this.speed, this.speed);
    this.noiseOffsetX = random(1000);
    this.noiseOffsetY = random(1000);
    this.alpha = random(150, 200);
    this.facingRight = this.vx > 0;
  }
  
  update() {
    // Move randomly using Perlin noise for smooth floating ghost movement
    // Increased increment from 0.01 to 0.02 for more variation
    this.noiseOffsetX += 0.02;
    this.noiseOffsetY += 0.02;
    
    let noiseX = noise(this.noiseOffsetX);
    let noiseY = noise(this.noiseOffsetY);
    
    // Map noise to larger velocity range
    this.vx = map(noiseX, 0, 1, -this.speed, this.speed);
    this.vy = map(noiseY, 0, 1, -this.speed, this.speed);
    
    // Update facing direction based on horizontal movement
    if (this.vx > 0.1) {
      this.facingRight = true;
    } else if (this.vx < -0.1) {
      this.facingRight = false;
    }
    
    this.x += this.vx;
    this.y += this.vy;
    
    // Bounce off borders
    if (this.x < BORDER_THICKNESS + this.size/2) {
      this.x = BORDER_THICKNESS + this.size/2;
      this.vx *= -1;
    }
    if (this.x > width - BORDER_THICKNESS - this.size/2) {
      this.x = width - BORDER_THICKNESS - this.size/2;
      this.vx *= -1;
    }
    if (this.y < BORDER_THICKNESS + this.size/2) {
      this.y = BORDER_THICKNESS + this.size/2;
      this.vy *= -1;
    }
    if (this.y > height - BORDER_THICKNESS - this.size/2) {
      this.y = height - BORDER_THICKNESS - this.size/2;
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
    
    if (ghostImg) {
      // Draw ghost sprite
      image(ghostImg, 0, 0, this.size, this.size);
    } else {
      // Fallback if image doesn't load
      fill(200, 50, 200, this.alpha);
      stroke(255, 100, 255, this.alpha);
      strokeWeight(2);
      ellipse(0, 0, this.size, this.size);
    }
    
    pop();
  }
}

// Collectible class (coins)
class Collectible {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 30;
    this.angleOffset = random(TWO_PI); // Random starting phase
    this.maxRotation = radians(30); // 30 degrees each way = 60 degree range
  }
  
  display() {
    push();
    imageMode(CENTER);
    translate(this.x, this.y);
    
    // Start at 45 degrees, then oscillate +/- 45 degrees (0 to 90 total)
    let baseRotation = radians(45);
    let oscillation = sin(frameCount * 0.05 + this.angleOffset) * this.maxRotation;
    rotate(baseRotation + oscillation);
    
    if (coinImg) {
      // Draw coin sprite
      image(coinImg, 0, 0, this.size, this.size);
    } else {
      // Fallback if image doesn't load
      fill(255, 215, 0);
      stroke(255, 180, 0);
      strokeWeight(2);
      ellipse(0, 0, this.size, this.size);
    }
    
    pop();
  }
}

// Dash Afterimage class (Celeste-style)
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
      
      // Brighter cyan/electric blue tint that fades out
      tint(0, 200, 255, alpha);
      image(catImg, this.x, this.y, this.displayW, this.displayH);
      
      pop();
    }
  }
}

// =============================================================================
// GAME LOGIC FUNCTIONS
// =============================================================================

function drawStartScreen() {
  
  // Brighter background
  fill(100, 100, 120);
  noStroke();
  rect(0, 0, width, height);
  
  // Title
  fill(0);
  textAlign(CENTER, CENTER);
  textFont('Monaco');
  textSize(48);
  textStyle(BOLD);
  text('ECTOPAWS', width/2, height/3);
  
  // Cat preview
  if (catImg) {
    imageMode(CENTER);
    image(catImg, width/2, height/2, 100, 100);
  }
  
  // Instructions
  fill(0);
  textFont('Monaco');
  textSize(18);
  textStyle(NORMAL);
  text('Click to Start', width/2, height/2 + 100);
  textSize(14);
  text('Reach the top to advance levels!', width/2, height/2 + 130);
  text('Avoid ghosts and collect coins', width/2, height/2 + 150);
}

function drawGame() {
  // Draw bordered world
  drawWorld();
  
  // Update and draw platforms
  for (let platform of platforms) {
    platform.display();
  }
  
  // Update and draw walls
  for (let wall of walls) {
    wall.display();
  }
  
  // Update and draw enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    enemies[i].update();
    enemies[i].display();
    
    // Check collision with player
    if (player.collidesWith(enemies[i])) {
      playHurtSound();
      lives--;
      damageFlashTimer = 60; // Flash for 60 frames (1 second)
      enemies.splice(i, 1);
      updateUI();
      
      // Check game over
      if (lives <= 0) {
        gameOver();
      }
    }
  }
  
  // Update and draw collectibles
  for (let i = collectibles.length - 1; i >= 0; i--) {
    collectibles[i].display();
    
    if (player.collidesWith(collectibles[i])) {
      playCoinSound();
      coinsCollected++;
      totalCoinsEver++;
      localStorage.setItem('ectopawsTotalCoins', totalCoinsEver);
      collectibles.splice(i, 1);
      updateUI();
    }
  }
  
  // Update damage flash timer
  if (damageFlashTimer > 0) {
    damageFlashTimer--;
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
  
  // Draw UI on canvas
  drawGameUI();
  
  // Draw top indicator line
  drawTopIndicator();
  
  // Check if player reached the top (1/3 of cat from top needs to touch border)
  // This makes it easier to advance levels
  if (player.y - player.h/3 < BORDER_THICKNESS) {
    nextLevel();
  }
  
  // Check if player fell off
  if (player.y > height + 50) {
    gameOver();
  }
}

function drawGameOver() {
  drawGame();
  
  // Overlay
  fill(0, 0, 0, 200);
  rect(0, 0, width, height);
  
  // Game Over text
  fill(255);
  textAlign(CENTER, CENTER);
  textFont('Monaco');
  textSize(40);
  text('Game Over', width/2, height/2 - 40);
  
  fill(255);
  textFont('Monaco');
  textSize(18);
  text(`Coins Collected: ${coinsCollected}`, width/2, height/2 + 10);
  text(`Level Reached: ${level}`, width/2, height/2 + 35);
  text('Click to Restart', width/2, height/2 + 65);
}

function nextLevel() {
  level++;
  updateUI();
  generateWorld();
  player.reset(width/2, height - 100);
}

function gameOver() {
  gameState = 'gameOver';
  updateUI();
}

// =============================================================================
// UI AND RENDERING FUNCTIONS
// =============================================================================

function drawGameUI() {
  push();
  
  // UI background - bottom right with padding
  let uiWidth = 180;
  let uiHeight = 110;
  let padding = 15;
  let uiX = width - uiWidth - padding;
  let uiY = height - uiHeight - padding;
  
  fill(0, 0, 0, 180);
  noStroke();
  rect(uiX, uiY, uiWidth, uiHeight);
  
  // Determine text color - flash red when taking damage
  let textColor;
  if (damageFlashTimer > 0) {
    // Flash between red and white
    if (damageFlashTimer % 10 < 5) {
      textColor = color(255, 50, 50); // Red
    } else {
      textColor = color(255); // White
    }
  } else {
    textColor = color(255); // White
  }
  
  // UI text
  fill(textColor);
  textAlign(LEFT, TOP);
  textSize(14);
  textFont('Monaco');
  
  text(`Coins: ${coinsCollected}`, uiX + 10, uiY + 10);
  text(`Total: ${totalCoinsEver}`, uiX + 10, uiY + 30);
  text(`Lives: ${lives}/${maxLives}`, uiX + 10, uiY + 50);
  text(`Level: ${level}`, uiX + 10, uiY + 70);
  text(`Dash: ${player.canDash ? 'YES' : 'NO'}`, uiX + 10, uiY + 90);
  
  pop();
}

function drawTopIndicator() {
  push();
  
  // Straight line at top with color oscillating via sin curve
  let lineY = BORDER_THICKNESS + 5;
  
  // Color oscillates between gold and white using sin
  let colorLerp = (sin(frameCount * 0.05) + 1) / 2;
  let lineColor = lerpColor(color(255, 215, 0), color(255, 255, 255), colorLerp);
  
  stroke(lineColor);
  strokeWeight(4);
  line(BORDER_THICKNESS, lineY, width - BORDER_THICKNESS, lineY);
  
  pop();
}

function drawWorld() {
  // Brighter background for better contrast
  for (let i = 0; i < height; i++) {
    let inter = map(i, 0, height, 0, 1);
    let c = lerpColor(color(100, 100, 120), color(140, 140, 160), inter);
    stroke(c);
    line(0, i, width, i);
  }
  
  // Draw borders (walls)
  fill(40, 40, 50);
  stroke(20, 20, 30);
  strokeWeight(3);
  rect(0, 0, BORDER_THICKNESS, height); // Left
  rect(width - BORDER_THICKNESS, 0, BORDER_THICKNESS, height); // Right
  rect(0, 0, width, BORDER_THICKNESS); // Top
  rect(0, height - BORDER_THICKNESS, width, BORDER_THICKNESS); // Bottom
  
  strokeWeight(1);
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function initPlayer() {
  player = new Player(width/2, height - 100);
}

function updateUI() {
  // UI is now drawn directly on canvas, no HTML updates needed
  // This function kept for compatibility
}

// Calculate ghost count based on level and difficulty
function calculateGhostCount(lvl, diff) {
  // Peaceful mode: no ghosts on level 1
  if (diff === 'Peaceful' && lvl === 1) {
    return 0;
  }
  
  let baseGhosts = 1; // Start with 1 ghost
  
  // Define multiplier ranges for each difficulty
  let multiplierRanges = {
    'Peaceful': { min: 1.0, max: 1.1 },  // Very slow increase
    'Easy': { min: 1.1, max: 1.3 },      // Gentle increase
    'Medium': { min: 1.3, max: 1.6 },    // Moderate increase
    'Hard': { min: 1.5, max: 2.0 }       // Aggressive increase
  };
  
  let range = multiplierRanges[diff] || multiplierRanges['Medium'];
  
  // Calculate ghosts with random multiplier per level
  let ghostCount = baseGhosts;
  for (let i = 1; i < lvl; i++) {
    let multiplier = random(range.min, range.max);
    ghostCount *= multiplier;
  }
  
  // Round down and ensure at least 1 ghost (except peaceful level 1)
  return max(1, floor(ghostCount));
}

function generateWorld() {
  console.log("=== GENERATE WORLD START ===");
  
  try {
    platforms = [];
    enemies = [];
    collectibles = [];
    walls = [];
    
    console.log("Arrays cleared");
    
    const MIN_VERTICAL_SPACING = 100; // Minimum vertical space between platforms
    const MIN_HORIZONTAL_GAP = 80; // Minimum gap when platforms overlap vertically
    
    // Helper function to check if a platform position is valid
    function isPlatformPositionValid(newX, newY, newW, newH) {
      for (let p of platforms) {
        // Check vertical overlap
        let verticalOverlap = !(newY > p.y + p.h + MIN_VERTICAL_SPACING || 
                                 newY + newH < p.y - MIN_VERTICAL_SPACING);
        
        if (verticalOverlap) {
          // If platforms are on similar Y levels, ensure horizontal spacing
          let horizontalOverlap = !(newX > p.x + p.w + MIN_HORIZONTAL_GAP || 
                                     newX + newW < p.x - MIN_HORIZONTAL_GAP);
          if (horizontalOverlap) {
            return false;
          }
        }
        
        // Ensure enough vertical clearance when directly above/below
        let horizontalOverlap = !(newX > p.x + p.w || newX + newW < p.x);
        if (horizontalOverlap) {
          let tooClose = Math.abs(newY - p.y) < MIN_VERTICAL_SPACING;
          if (tooClose) {
            return false;
          }
        }
      }
      return true;
    }
    
    // Tower generation with spacing rules
    let numFloors = 5;
    let baseFloorSpacing = 150;
    
    for (let floor = 0; floor < numFloors; floor++) {
      let floorY = height - 150 - (floor * baseFloorSpacing);
      
      // Alternate between left, center, and right
      let layoutType = floor % 3;
      
      if (layoutType === 0) {
        // Left platform
        platforms.push(new Platform(50, floorY, 160, 15));
        
        // Add wall only if it won't overlap borders
        let wallY = floorY - 80;
        let wallHeight = 95;
        if (wallY >= BORDER_THICKNESS && wallY + wallHeight <= height - BORDER_THICKNESS) {
          walls.push(new Wall(210, wallY, 15, wallHeight));
        }
        
        // Connecting platform to right (with spacing check)
        let connectY = floorY - 70;
        if (isPlatformPositionValid(340, connectY, 100, 15)) {
          platforms.push(new Platform(340, connectY, 100, 15));
        }
      } else if (layoutType === 1) {
        // Right platform
        platforms.push(new Platform(390, floorY, 160, 15));
        
        // Add wall only if it won't overlap borders
        let wallY = floorY - 80;
        let wallHeight = 95;
        if (wallY >= BORDER_THICKNESS && wallY + wallHeight <= height - BORDER_THICKNESS) {
          walls.push(new Wall(375, wallY, 15, wallHeight));
        }
        
        // Connecting platform to left (with spacing check)
        let connectY = floorY - 70;
        if (isPlatformPositionValid(160, connectY, 100, 15)) {
          platforms.push(new Platform(160, connectY, 100, 15));
        }
      } else {
        // Center platform
        platforms.push(new Platform(220, floorY, 160, 15));
        
        // Add walls only if they won't overlap borders
        let wallY = floorY - 80;
        let wallHeight = 95;
        if (wallY >= BORDER_THICKNESS && wallY + wallHeight <= height - BORDER_THICKNESS) {
          walls.push(new Wall(205, wallY, 15, wallHeight));
          walls.push(new Wall(380, wallY, 15, wallHeight));
        }
        
        // Side escape platforms (with spacing check)
        let sideY = floorY - 80;
        if (isPlatformPositionValid(60, sideY, 90, 15)) {
          platforms.push(new Platform(60, sideY, 90, 15));
        }
        if (isPlatformPositionValid(450, sideY, 90, 15)) {
          platforms.push(new Platform(450, sideY, 90, 15));
        }
      }
    }
    
    // Add strategic traversal platforms
    let extraPlatforms = [
      {x: 300, y: 180, w: 100, h: 15},
      {x: 130, y: 320, w: 100, h: 15},
      {x: 420, y: 470, w: 100, h: 15}
    ];
    
    for (let plat of extraPlatforms) {
      if (isPlatformPositionValid(plat.x, plat.y, plat.w, plat.h)) {
        platforms.push(new Platform(plat.x, plat.y, plat.w, plat.h));
      }
    }
    
    // Generate ghosts based on difficulty and level
    let numGhosts = calculateGhostCount(level, difficulty);
    console.log(`Level ${level}, Difficulty ${difficulty}: ${numGhosts} ghosts`);
    
    for (let i = 0; i < numGhosts; i++) {
      let x = random(BORDER_THICKNESS + 50, width - BORDER_THICKNESS - 50);
      let y = random(150, height - 250);
      enemies.push(new Enemy(x, y));
    }
    
    // Generate collectibles
    for (let i = 0; i < 5 + level; i++) {
      let x = 80 + (i * 95) % 460;
      let y = 140 + (i % 4) * 140;
      collectibles.push(new Collectible(x, y));
    }
    
    console.log("=== GENERATION COMPLETE ===");
    console.log("Final counts - Platforms: " + platforms.length + ", Walls: " + walls.length + ", Ghosts: " + enemies.length + ", Coins: " + collectibles.length);
    
  } catch (error) {
    console.error("Error in generateWorld:", error);
  }
}

// =============================================================================
// HTML INTERACTION FUNCTIONS
// =============================================================================

function setupButtons() {
    //all of this code is for the functionality in html
  // Sound toggle
  document.getElementById('sound-toggle').addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    document.getElementById('sound-toggle').textContent = soundEnabled ? 'Sound: ON' : 'Sound: OFF';
  });
  
  // Restart button
  document.getElementById('restart-btn').addEventListener('click', () => {
    if (gameState === 'playing') {
      gameState = 'start';
      enableDifficultyButtons(); // Re-enable difficulty buttons
    }
  });
  
  // Difficulty buttons
  document.querySelectorAll('.difficulty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      // Only allow changing difficulty if not playing
      if (gameState === 'playing') return;
      
      difficulty = btn.dataset.difficulty;
      // Update active state
      document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

function enableDifficultyButtons() {
  document.querySelectorAll('.difficulty-btn').forEach(btn => {
    btn.disabled = false;
    btn.style.cursor = 'pointer';
    // Restore opacity for non-active buttons
    if (!btn.classList.contains('active')) {
      btn.style.opacity = '1';
    }
  });
}

function disableDifficultyButtons() {
  document.querySelectorAll('.difficulty-btn').forEach(btn => {
    btn.disabled = true;
    btn.style.cursor = 'default';
    // Gray out non-active buttons, keep active one visible
    if (!btn.classList.contains('active')) {
      btn.style.opacity = '0.3';
    } else {
      btn.style.opacity = '1';
    }
  });
}

// =============================================================================
// AUDIO FUNCTIONS
// =============================================================================

// Handle dash input - called every frame to allow Shift then direction
function checkDash() {
  if (gameState === 'playing' && keyIsDown(SHIFT)) {
    let dx = 0;
    let dy = 0;
    
    // Check horizontal direction
    if (keyIsDown(65)) { // A (left)
      dx = -1;
    }
    if (keyIsDown(68)) { // D (right)
      dx = 1;
    }
    
    // Check vertical direction (separate from horizontal)
    if (keyIsDown(87) || keyIsDown(32)) { // W or Space (up)
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

// Audio functions (simple oscillator-based sounds)
function playJumpSound() {
  if (!soundEnabled) return;
  jumpSound.freq(400);
  jumpSound.amp(0.1);
  jumpSound.start();
  setTimeout(() => jumpSound.stop(), 100);
}

function playDashSound() {
  if (!soundEnabled) return;
  dashSound.freq(200);
  dashSound.amp(0.15);
  dashSound.start();
  setTimeout(() => dashSound.stop(), 150);
}

function playCoinSound() {
  if (!soundEnabled) return;
  coinSound.freq(800);
  coinSound.amp(0.1);
  coinSound.start();
  setTimeout(() => coinSound.stop(), 100);
}

function playHurtSound() {
  if (!soundEnabled) return;
  hurtSound.freq(150);
  hurtSound.amp(0.15);
  hurtSound.start();
  setTimeout(() => hurtSound.stop(), 200);
}