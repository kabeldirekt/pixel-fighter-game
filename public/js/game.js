// Main Game Controller
class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    // Game state
    this.state = 'menu'; // menu, playing, roundEnd, gameOver
    this.mode = null; // 'cpu' or 'player'
    this.difficulty = 'medium';

    // Round system
    this.round = 1;
    this.maxRounds = 3;
    this.p1Wins = 0;
    this.p2Wins = 0;
    this.winsNeeded = 2;

    // Timing
    this.messageTimer = 0;
    this.roundStartDelay = 0;

    // Ground position
    this.groundY = 0;

    // Controllers
    this.input = new InputController();
    this.ai = new AIController(this.difficulty);

    // Fighters
    this.player1 = null;
    this.player2 = null;

    // Initialize
    this.setupCanvas();
    this.setupUI();
    this.loop();
  }

  setupCanvas() {
    const resize = () => {
      const maxWidth = window.innerWidth;
      const maxHeight = window.innerHeight;

      // 16:9 aspect ratio preference
      let width = maxWidth;
      let height = maxWidth * 9 / 16;

      if (height > maxHeight) {
        height = maxHeight;
        width = maxHeight * 16 / 9;
      }

      // Limit size for better pixel art look
      width = Math.min(width, 800);
      height = Math.min(height, 450);

      this.canvas.width = width;
      this.canvas.height = height;
      this.groundY = height * 0.85;
    };

    resize();
    window.addEventListener('resize', resize);
  }

  setupUI() {
    // Menu buttons
    document.getElementById('btn-vs-cpu').addEventListener('click', () => {
      this.mode = 'cpu';
      document.getElementById('difficulty-select').classList.remove('hidden');
    });

    document.getElementById('btn-vs-player').addEventListener('click', () => {
      this.mode = 'player';
      this.startGame();
    });

    // Difficulty buttons
    document.querySelectorAll('.diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.difficulty = btn.dataset.diff;
        this.ai.setDifficulty(this.difficulty);
        this.startGame();
      });
    });

    // Game over buttons
    document.getElementById('btn-rematch').addEventListener('click', () => {
      this.resetGame();
      this.startGame();
    });

    document.getElementById('btn-menu').addEventListener('click', () => {
      this.resetGame();
      this.showScreen('menu');
    });
  }

  showScreen(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screen === 'game' ? 'game-screen' : screen).classList.add('active');

    if (screen === 'game') {
      this.input.showMobileControls();
    } else {
      this.input.hideMobileControls();
    }
  }

  startGame() {
    this.showScreen('game');
    this.state = 'playing';

    // Create fighters
    const startX1 = this.canvas.width * 0.2;
    const startX2 = this.canvas.width * 0.7;
    const startY = this.groundY - 100;

    this.player1 = new Fighter(startX1, startY, true, CHARACTERS.blaze);
    this.player2 = new Fighter(startX2, startY, false, CHARACTERS.frost);

    this.showMessage('ROUND 1', 90);
    this.roundStartDelay = 90;
    this.updateHUD();
  }

  resetGame() {
    this.round = 1;
    this.p1Wins = 0;
    this.p2Wins = 0;
    this.state = 'menu';
    this.mode = null;
    document.getElementById('difficulty-select').classList.add('hidden');
  }

  resetRound() {
    const startX1 = this.canvas.width * 0.2;
    const startX2 = this.canvas.width * 0.7;
    const startY = this.groundY - 100;

    this.player1.reset(startX1, startY);
    this.player2.reset(startX2, startY);
    this.player1.facingRight = true;
    this.player2.facingRight = false;
  }

  showMessage(text, duration) {
    const overlay = document.getElementById('message-overlay');
    const messageText = document.getElementById('message-text');
    overlay.classList.remove('hidden');
    messageText.textContent = text;
    this.messageTimer = duration;
  }

  hideMessage() {
    document.getElementById('message-overlay').classList.add('hidden');
  }

  updateHUD() {
    const p1Health = document.getElementById('p1-health');
    const p2Health = document.getElementById('p2-health');

    if (this.player1 && this.player2) {
      const p1Percent = (this.player1.health / this.player1.maxHealth) * 100;
      const p2Percent = (this.player2.health / this.player2.maxHealth) * 100;

      p1Health.style.width = p1Percent + '%';
      p2Health.style.width = p2Percent + '%';

      // Low health warning
      p1Health.classList.toggle('low', p1Percent < 25);
      p2Health.classList.toggle('low', p2Percent < 25);
    }

    document.getElementById('p1-wins').textContent = this.p1Wins;
    document.getElementById('p2-wins').textContent = this.p2Wins;
    document.getElementById('round-display').textContent = `ROUND ${this.round}`;
  }

  handleInput() {
    if (this.state !== 'playing' || this.roundStartDelay > 0) return;

    // Player 1
    const p1Input = this.input.getP1Input();

    if (p1Input.left) {
      this.player1.moveLeft();
    } else if (p1Input.right) {
      this.player1.moveRight();
    } else {
      this.player1.stop();
    }

    if (p1Input.jump) this.player1.jump();
    if (p1Input.punch) this.player1.punch();
    if (p1Input.kick) this.player1.kick();
    if (p1Input.special) this.player1.special();
    this.player1.block(p1Input.block);

    // Player 2 (or AI)
    if (this.mode === 'player') {
      const p2Input = this.input.getP2Input();

      if (p2Input.left) {
        this.player2.moveLeft();
      } else if (p2Input.right) {
        this.player2.moveRight();
      } else {
        this.player2.stop();
      }

      if (p2Input.jump) this.player2.jump();
      if (p2Input.punch) this.player2.punch();
      if (p2Input.kick) this.player2.kick();
      if (p2Input.special) this.player2.special();
      this.player2.block(p2Input.block);
    } else {
      // AI control
      this.ai.update(this.player2, this.player1);
    }
  }

  checkCollision() {
    if (this.state !== 'playing') return;

    // Check if fighters should face each other
    if (this.player1.x < this.player2.x) {
      this.player1.facingRight = true;
      this.player2.facingRight = false;
    } else {
      this.player1.facingRight = false;
      this.player2.facingRight = true;
    }

    // Check attacks
    if (this.player1.isAttackActive()) {
      if (this.boxCollision(this.player1.attackBox, this.player2)) {
        this.player2.takeDamage(this.player1.getDamage(), this.player1.getKnockback());
      }
    }

    if (this.player2.isAttackActive()) {
      if (this.boxCollision(this.player2.attackBox, this.player1)) {
        this.player1.takeDamage(this.player2.getDamage(), this.player2.getKnockback());
      }
    }
  }

  boxCollision(box, fighter) {
    return box.x < fighter.x + fighter.width &&
           box.x + box.width > fighter.x &&
           box.y < fighter.y + fighter.height &&
           box.y + box.height > fighter.y;
  }

  checkRoundEnd() {
    if (this.state !== 'playing') return;

    let winner = null;

    if (this.player1.health <= 0) {
      winner = 2;
      this.p2Wins++;
    } else if (this.player2.health <= 0) {
      winner = 1;
      this.p1Wins++;
    }

    if (winner) {
      this.state = 'roundEnd';
      this.updateHUD();

      // Check for game winner
      if (this.p1Wins >= this.winsNeeded) {
        this.showMessage('BLAZE GEWINNT!', 120);
        setTimeout(() => this.endGame('BLAZE'), 2000);
      } else if (this.p2Wins >= this.winsNeeded) {
        this.showMessage('FROST GEWINNT!', 120);
        setTimeout(() => this.endGame('FROST'), 2000);
      } else {
        // Next round
        this.showMessage(winner === 1 ? 'K.O.!' : 'K.O.!', 90);
        setTimeout(() => this.startNextRound(), 1500);
      }
    }
  }

  startNextRound() {
    this.round++;
    this.resetRound();
    this.state = 'playing';
    this.showMessage(`ROUND ${this.round}`, 90);
    this.roundStartDelay = 90;
    this.updateHUD();
  }

  endGame(winner) {
    this.state = 'gameOver';
    document.getElementById('winner-text').textContent = `${winner} GEWINNT!`;
    this.showScreen('gameover');
    this.hideMessage();
  }

  update() {
    if (this.messageTimer > 0) {
      this.messageTimer--;
      if (this.messageTimer <= 0) {
        this.hideMessage();
      }
    }

    if (this.roundStartDelay > 0) {
      this.roundStartDelay--;
    }

    if (this.state === 'playing') {
      this.handleInput();

      this.player1.update(this.groundY, this.canvas.width);
      this.player2.update(this.groundY, this.canvas.width);

      this.checkCollision();
      this.checkRoundEnd();
      this.updateHUD();
    }
  }

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, w, h);

    if (this.state === 'menu' || this.state === 'gameOver') return;

    // Draw background
    this.drawBackground();

    // Draw fighters
    if (this.player1 && this.player2) {
      this.player1.draw(ctx);
      this.player2.draw(ctx);
    }
  }

  drawBackground() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, this.groundY);
    skyGradient.addColorStop(0, '#1a1a2e');
    skyGradient.addColorStop(0.5, '#4a1942');
    skyGradient.addColorStop(1, '#c0392b');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, w, this.groundY);

    // Stars
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 30; i++) {
      const x = (i * 37 + 10) % w;
      const y = (i * 23 + 5) % (this.groundY * 0.5);
      ctx.fillRect(x, y, 2, 2);
    }

    // Moon
    ctx.fillStyle = '#ecf0f1';
    ctx.beginPath();
    ctx.arc(w * 0.8, h * 0.15, 30, 0, Math.PI * 2);
    ctx.fill();

    // City silhouette
    ctx.fillStyle = '#0d0d1a';
    const buildings = [
      { x: 0, w: 60, h: 80 },
      { x: 50, w: 40, h: 120 },
      { x: 80, w: 50, h: 90 },
      { x: 140, w: 70, h: 150 },
      { x: 200, w: 45, h: 100 },
      { x: 240, w: 80, h: 130 },
      { x: 310, w: 50, h: 85 },
      { x: 350, w: 60, h: 110 },
      { x: 400, w: 90, h: 140 },
      { x: 480, w: 55, h: 95 },
      { x: 530, w: 70, h: 125 },
      { x: 590, w: 45, h: 80 },
      { x: 630, w: 80, h: 100 },
      { x: 700, w: 60, h: 130 },
      { x: 750, w: 50, h: 90 }
    ];

    buildings.forEach(b => {
      const scale = w / 800;
      ctx.fillRect(b.x * scale, this.groundY - b.h * scale * 0.8, b.w * scale, b.h * scale * 0.8);

      // Windows
      ctx.fillStyle = '#f39c12';
      for (let wy = this.groundY - b.h * scale * 0.75; wy < this.groundY - 10; wy += 15) {
        for (let wx = b.x * scale + 5; wx < b.x * scale + b.w * scale - 5; wx += 12) {
          if (Math.random() > 0.3) {
            ctx.fillRect(wx, wy, 6, 8);
          }
        }
      }
      ctx.fillStyle = '#0d0d1a';
    });

    // Ground
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, this.groundY, w, h - this.groundY);

    // Ground detail
    ctx.fillStyle = '#34495e';
    for (let i = 0; i < w; i += 20) {
      ctx.fillRect(i, this.groundY, 15, 3);
    }
  }

  loop() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.loop());
  }
}

// Start game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new Game();
});
