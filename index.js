let width = 800;
let height = 600;
let bg;
let alienSprite;
let playerSprite;
let asteroidSprite;
let healthPackSprite;
let decoySprite;
let player;
let aliens;
let asteroids;
let decoy;
let scoreboard;
let healthPack;
let game;

class Game {
  constructor() {
    this.gameOver = false;
    this.pauseGame = false;
  }
  endGame() {
    this.gameOver = true;
    textSize(120);
    textAlign(CENTER, CENTER);
    fill("white");
    text("GAME OVER", width / 2, height / 2);
    textSize(50);
    text("Click to play again", width / 2, height / 2 + 100);
    noLoop();
  }
  resetGame() {
    health.value += 100;
    scoreboard.resetScore();
    decoy = undefined;
    this.gameOver = false;
    createCharacters();
    loop();
  }
}

class Character {
  constructor(x, y, image, radius, speed) {
    Object.assign(this, { x, y, image, radius, speed });
  }
  draw() {
    image(
      this.image,
      this.x - this.radius,
      this.y - this.radius,
      this.radius * 2,
      this.radius * 2
    );
  }
  move(target) {
    this.x += (target.x - this.x) * this.speed;
    this.y += (target.y - this.y) * this.speed;
  }
  checkBounds() {
    if (this.x < 0) {
      this.x = 0;
    } else if (this.x > width) {
      this.x = width;
    }
    if (this.y < 0) {
      this.y = 0;
    } else if (this.y > height) {
      this.y = height;
    }
  }
  hasCollidedWith(sprite2) {
    return (
      this.x < sprite2.x + sprite2.radius * 2 &&
      this.x + this.radius * 2 > sprite2.x &&
      this.y < sprite2.y + sprite2.radius * 2 &&
      this.radius * 2 + this.y > sprite2.y
    );
  }
}

class Asteroid {
  constructor(x, y, image, radius, xVel, yVel) {
    Object.assign(this, { x, y, image, radius, xVel, yVel });
  }

  draw() {
    image(
      this.image,
      this.x - this.radius,
      this.y - this.radius,
      this.radius * 2,
      this.radius * 2
    );
  }
  move() {
    this.x += this.xVel;
    this.y += this.yVel;
  }
}

class Scoreboard {
  constructor() {
    this.score = 0;
    this.highScore = 0;
    this.scoreMiliseconds = 0;
    this.scoreText = document.getElementById("score");
    this.highScoreText = document.getElementById("highscore");
  }
  storeScore() {
    if (typeof Storage !== "undefined") {
      localStorage.setItem("highscore", this.highScore);
    }
  }
  retrieveScore() {
    if (typeof Storage !== "undefined") {
      if (
        localStorage.getItem("highscore") === undefined ||
        localStorage.getItem("highscore") === null
      ) {
        this.highScoreText.innerHTML = 0;
      }
      this.highScoreText.innerHTML = localStorage.getItem("highscore");
      this.highScore = localStorage.getItem("highscore");
    }
  }
  resetScore() {
    this.scoreMilliseconds = 0;
    scoreboard.retrieveScore();
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.highScoreText.innerHTML = this.highScore;
      scoreboard.storeScore();
    }
    this.score = 0;
    this.scoreText.innerHTML = 0;
  }
  updateScore() {
    this.scoreMillisenconds++;
    if (this.scoreMiliseconds % 100 === 0) {
      this.score++;
    }
    this.scoreText.innerHTML = this.score;
  }
  raiseDifficulty() {
    if (this.scoreText.innerHTML % 1000 === 0) {
      asteroids.push(new Asteroid(400, 0, asteroidSprite, 20, -4, 8));
      asteroids.push(new Asteroid(400, 0, asteroidSprite, 20, 4, 8));
    }
  }
}

class Healthpack {
  constructor(x, y, radius) {
    this.image = healthPackSprite;
    this.onGround = false;
    this.healthValue = 30;
    Object.assign(this, { x, y, radius });
  }
  checkPackCollision() {
    if (player.hasCollidedWith(health)) {
      healthSound.play();
      healthBar.value += this.healthValue;
      this.onGround = false;
    }
  }
  checkForPack() {
    if (scoreboard.scoreText.innerHTML % 500 === 0) {
      if (!healthPack.onGround) {
        healthPack.draw();
        healthPack.onGround = true;
      }
    }
  }
  draw() {
    image(
      this.image,
      this.x - this.radius,
      this.y - this.radius,
      this.radius * 2,
      this.radius * 2
    );
  }
}

function preload() {
  bg = loadImage("gameover.jpg");
  alienSprite = loadImage("UFO.png");
  playerSprite = loadImage("spaceShip.png");
  asteroidSprite = loadImage("asteroidSprite.png");
  decoySprite = loadImage("decoy.png");
  healthPackSprite = loadImage("healthPack.png");
}

function setup() {
  const canvas = createCanvas(800, 600);
  canvas.parent("sketch");
  createCharacters();
  noStroke();
}

function draw() {
  background(bg);
  scoreboard.raiseDifficulty();
  player.draw();
  player.move({ x: mouseX, y: mouseY });
  player.checkBounds();
  aliens.forEach(alien => alien.draw());
  aliens.forEach(alien => alien.move(decoy || player));
  adjust();
  asteroids.forEach(asteroid => asteroid.draw());
  asteroids.forEach(asteroid => asteroid.move());
  checkAsteroidOutOfBounds();
  if (decoy) {
    decoy.draw();
    decoy.ttl--;
    if (decoy.ttl < 0) {
      decoy = undefined;
    }
  }
  adjust();
  if (health.value > 0) {
    scoreboard.updateScore();
  }
  scoreboard.retrieveScore();
  if (health.value === 0) {
    game.endGame();
  }
  healthPack.checkForPack();
  healthPack.checkPackCollision();
}

function adjust() {
  const characters = [player, ...aliens, ...asteroids];
  for (let i = 0; i < characters.length; i++) {
    for (let j = i + 1; j < characters.length; j++) {
      pushOff(characters[i], characters[j], i === 0);
    }
  }
}

function pushOff(c1, c2, isPlayer) {
  let [dx, dy] = [c2.x - c1.x, c2.y - c1.y];
  const distance = Math.hypot(dx, dy);
  let overlap = c1.radius + c2.radius - distance;
  if (overlap > 0) {
    if (isPlayer) {
      health.value -= 1;
    }
    const adjustX = overlap / 2 * (dx / distance);
    const adjustY = overlap / 2 * (dy / distance);
    c1.x -= adjustX;
    c1.y -= adjustY;
    c2.x += adjustX;
    c2.y += adjustY;
  }
}

function mouseClicked() {
  if (!decoy && !game.gameOver) {
    decoy = new Character(player.x, player.y, decoySprite, 10, 0);
    decoy.ttl = frameRate() * 5;
  }
  if (game.gameOver) {
    game.resetGame();
  }
}

function checkAsteroidOutOfBounds() {
  for (let i = 0; i < asteroids.length; i++) {
    if (
      asteroids[i].x - asteroids[i].radius > width ||
      asteroids[i].x + asteroids[i].radius < 0 ||
      asteroids[i].y + asteroids[i].radius < 0 ||
      asteroids[i].y - asteroids[i].radius > height
    ) {
      asteroids.splice(i, 1);
      let newAsteroid = new Asteroid(
        Math.random() * width,
        0,
        asteroidSprite,
        20,
        Math.pow(-1, Math.floor(1 + Math.random() * 2)) *
          (1 + Math.random() * 8),
        1 + Math.random() * 8
      );
      asteroids.push(newAsteroid);
    }
  }
}

function createCharacters() {
  player = new Character(400, 300, playerSprite, 25, 0.05);
  aliens = [
    new Character(0, 0, alienSprite, 25, 0.01),
    new Character(800, 0, alienSprite, 25, 0.04),
    new Character(0, 600, alienSprite, 25, 0.03),
    new Character(800, 600, alienSprite, 25, 0.02)
  ];
  asteroids = [
    new Asteroid(600, 0, asteroidSprite, 20, -3, 1),
    new Asteroid(200, 0, asteroidSprite, 20, 8, 8),
    new Asteroid(0, 0, asteroidSprite, 20, 2, 8),
    new Asteroid(800, 0, asteroidSprite, 20, -8, 5),
    new Asteroid(400, 0, asteroidSprite, 20, 3, 5)
  ];
  scoreboard = new Scoreboard();
  healthPack = new Healthpack(400, 300, 20, 10);
  game = new Game();
}
