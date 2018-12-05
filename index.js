let width = 800;
let height = 600;
let bg; 

class Game {
  constructor() {
    this.gameOver = false;
    this.pauseGame = false;
  }
  endGame() {
    this.gameOver = true;
    background(bg)
    textFont("Avenir");
    textSize(120);
    textAlign(CENTER, CENTER);
    fill("white");
    text("GAME OVER", width / 2, height / 2);
    textSize(50);
    text("Click to play again", width / 2, height / 2);
    textAlign(LEFT, LEFT);
  }
  resetGame() {
    health.value = 100;
    scoreboard.resetScore();
    this.gameOver = false;
  }
  loadPauseScreen() {
    ctx.font = "120px VT323";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2);
    ctx.font = "30px VT323";
  }
}

class Character {
  constructor(x, y, color, radius, speed) {
    Object.assign(this, { x, y, color, radius, speed });
  }
  draw() {
    fill(this.color);
    ellipse(this.x, this.y, this.radius * 2);
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
}

class Asteroid {
  constructor(x, y, color, radius, xVel, yVel) {
    Object.assign(this, { x, y, color, radius, xVel, yVel });
  }
  draw() {
    fill(this.color);
    ellipse(this.x, this.y, this.radius * 2);
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
    Powerup.checkPowerups();
    this.scoreText.innerHTML = this.score;
  }
}

class Powerup extends Character {
  static checkPowerups() {
    if (scoreboard.score % 5 === 0) {
      spaceStation.drawPowerup();
      spaceStation.onGround = true;
    }
  }
  drawPowerup() {
    this.x = Math.random * width;
    this.y = Math.random * height;
    this.draw();
  }
}

class SpaceStation extends Powerup {
  constructor(x, y, width, height) {
    super();
    this.color = "red";
    this.onGround = false;
    this.healthValue = 30;
    Object.assign(this, {
      x,
      y,
      width,
      height
    });
  }
  checkHealth() {
    this.draw();
    if (player.hasCollidedWith(health)) {
      healthSound.play();
      healthBar.value += this.healthValue;
      this.onGround = false;
    }
  }
}

const player = new Character(30, 30, "blue", 10, 0.05);
const aliens = [
  new Character(300, 0, "rgb(250,190,80)", 17, 0.01),
  new Character(300, 300, "rgb(190,80,250)", 17, 0.03),
  new Character(300, 200, "rgb(80,250,190)", 17, 0.02)
];
const asteroids = [
  new Asteroid(400, 0, "brown", 15, -3, 1),
  new Asteroid(300, 0, "brown", 15, 2, 8),
  new Asteroid(200, 0, "brown", 15, 3, 5)
];
let bomb;
let scoreboard = new Scoreboard();
let spaceStation = new SpaceStation(
  Math.random * width,
  Math.random * height,
  10,
  10
);
let game = new Game();
function setup() {
  bg = loadImage("gameover.jpg");
  createCanvas(width, height);
  noStroke();
}

function draw() {
  if (!game.gameOver){
  if(health.value > 0){
  background("black");
  player.draw();
  player.move({ x: mouseX, y: mouseY });
  player.checkBounds();
  aliens.forEach(alien => alien.draw());
  aliens.forEach(alien => alien.move(bomb || player));
  asteroids.forEach(asteroid => asteroid.draw());
  asteroids.forEach(asteroid => asteroid.move());
  if (bomb) {
    bomb.draw();
    bomb.ttl--;
    if (bomb.ttl < 0) {
      bomb = undefined;
    }
  }
  checkAsteroidOutOfBounds();
  adjust();
  if (health.value > 0) {
    scoreboard.updateScore();
  }
    scoreboard.retrieveScore();
  if (health.value === 0){
    game.endGame();
  }
  }
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
  if (!bomb) {
    bomb = new Character(player.x, player.y, "grey", 10, 0);
    bomb.ttl = frameRate() * 5;
  }
}

function checkAsteroidOutOfBounds() {
  for (let i = 0; i < asteroids.length; i++) {
    //console.log(asteroids[i].x);
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
        "brown",
        15,
        Math.pow(-1, Math.floor(1 + Math.random() * 2)) *
          (1 + Math.random() * 8),
        1 + Math.random() * 8
      );
      asteroids.push(newAsteroid);
    }
  }
}
}
function mouseClick(event) { //eslint-disable-line no-unused-vars
    if (gameOver) {
        resetGame();
    } else {
        if (game.pauseGame) {
            backgroundMusic.play();
            requestAnimationFrame(game.drawScene.bind(game));
        }
        game.pauseGame = !game.pauseGame;
    }
}

function resetGame(){
  health.value = 100;
}
