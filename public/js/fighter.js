// Pixel Art Fighter Class
class Fighter {
  constructor(x, y, facingRight, config) {
    this.x = x;
    this.y = y;
    this.width = 60;
    this.height = 100;
    this.facingRight = facingRight;

    // Physics
    this.velocityX = 0;
    this.velocityY = 0;
    this.speed = 5;
    this.jumpForce = -15;
    this.gravity = 0.8;
    this.grounded = false;

    // Combat
    this.health = 100;
    this.maxHealth = 100;
    this.isAttacking = false;
    this.attackType = null;
    this.attackFrame = 0;
    this.attackDuration = 20;
    this.hitCooldown = 0;
    this.specialCooldown = 0;
    this.isBlocking = false;
    this.isHit = false;
    this.hitStun = 0;

    // Animation
    this.animationFrame = 0;
    this.animationTimer = 0;
    this.state = 'idle';

    // Character config
    this.name = config.name;
    this.colors = config.colors;
    this.specialColor = config.specialColor;

    // Attack hitboxes
    this.attackBox = { x: 0, y: 0, width: 0, height: 0 };
  }

  update(groundY, canvasWidth) {
    // Apply gravity
    if (!this.grounded) {
      this.velocityY += this.gravity;
    }

    // Update position
    if (this.hitStun <= 0) {
      this.x += this.velocityX;
    }
    this.y += this.velocityY;

    // Ground collision
    if (this.y + this.height >= groundY) {
      this.y = groundY - this.height;
      this.velocityY = 0;
      this.grounded = true;
    } else {
      this.grounded = false;
    }

    // Screen bounds
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > canvasWidth) this.x = canvasWidth - this.width;

    // Update cooldowns
    if (this.hitCooldown > 0) this.hitCooldown--;
    if (this.specialCooldown > 0) this.specialCooldown--;
    if (this.hitStun > 0) this.hitStun--;

    // Update attack
    if (this.isAttacking) {
      this.attackFrame++;
      this.updateAttackBox();

      if (this.attackFrame >= this.attackDuration) {
        this.isAttacking = false;
        this.attackType = null;
        this.attackFrame = 0;
      }
    }

    // Update animation
    this.updateAnimation();

    // Reset hit state
    if (this.hitStun <= 0) {
      this.isHit = false;
    }
  }

  updateAttackBox() {
    const offset = this.facingRight ? this.width : -50;

    switch (this.attackType) {
      case 'punch':
        this.attackBox = {
          x: this.x + offset,
          y: this.y + 20,
          width: 50,
          height: 30
        };
        break;
      case 'kick':
        this.attackBox = {
          x: this.x + offset,
          y: this.y + 50,
          width: 60,
          height: 40
        };
        break;
      case 'special':
        this.attackBox = {
          x: this.x + (this.facingRight ? this.width : -80),
          y: this.y + 10,
          width: 80,
          height: 60
        };
        break;
    }
  }

  updateAnimation() {
    this.animationTimer++;
    if (this.animationTimer >= 8) {
      this.animationTimer = 0;
      this.animationFrame = (this.animationFrame + 1) % 4;
    }

    // Update state
    if (this.isHit) {
      this.state = 'hit';
    } else if (this.isAttacking) {
      this.state = 'attack';
    } else if (!this.grounded) {
      this.state = 'jump';
    } else if (this.velocityX !== 0) {
      this.state = 'walk';
    } else if (this.isBlocking) {
      this.state = 'block';
    } else {
      this.state = 'idle';
    }
  }

  punch() {
    if (!this.isAttacking && this.hitStun <= 0) {
      this.isAttacking = true;
      this.attackType = 'punch';
      this.attackFrame = 0;
      this.attackDuration = 15;
    }
  }

  kick() {
    if (!this.isAttacking && this.hitStun <= 0) {
      this.isAttacking = true;
      this.attackType = 'kick';
      this.attackFrame = 0;
      this.attackDuration = 20;
    }
  }

  special() {
    if (!this.isAttacking && this.hitStun <= 0 && this.specialCooldown <= 0) {
      this.isAttacking = true;
      this.attackType = 'special';
      this.attackFrame = 0;
      this.attackDuration = 30;
      this.specialCooldown = 60;
    }
  }

  jump() {
    if (this.grounded && this.hitStun <= 0) {
      this.velocityY = this.jumpForce;
      this.grounded = false;
    }
  }

  moveLeft() {
    if (this.hitStun <= 0) {
      this.velocityX = -this.speed;
    }
  }

  moveRight() {
    if (this.hitStun <= 0) {
      this.velocityX = this.speed;
    }
  }

  stop() {
    this.velocityX = 0;
  }

  block(isBlocking) {
    this.isBlocking = isBlocking && this.grounded && !this.isAttacking;
  }

  takeDamage(amount, knockback) {
    if (this.hitCooldown > 0) return false;

    if (this.isBlocking) {
      this.health -= amount * 0.2;
      this.hitCooldown = 10;
      return true;
    }

    this.health -= amount;
    this.isHit = true;
    this.hitStun = 15;
    this.hitCooldown = 20;
    this.velocityX = knockback;

    if (this.health < 0) this.health = 0;
    return true;
  }

  getDamage() {
    switch (this.attackType) {
      case 'punch': return 8;
      case 'kick': return 12;
      case 'special': return 20;
      default: return 0;
    }
  }

  getKnockback() {
    const dir = this.facingRight ? 1 : -1;
    switch (this.attackType) {
      case 'punch': return dir * 5;
      case 'kick': return dir * 8;
      case 'special': return dir * 15;
      default: return 0;
    }
  }

  isAttackActive() {
    if (!this.isAttacking) return false;
    // Attack is active in the middle frames
    const startFrame = this.attackDuration * 0.3;
    const endFrame = this.attackDuration * 0.6;
    return this.attackFrame >= startFrame && this.attackFrame <= endFrame;
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.health = this.maxHealth;
    this.velocityX = 0;
    this.velocityY = 0;
    this.isAttacking = false;
    this.attackType = null;
    this.hitStun = 0;
    this.hitCooldown = 0;
    this.specialCooldown = 0;
    this.isHit = false;
    this.isBlocking = false;
  }

  draw(ctx) {
    ctx.save();

    // Flip if facing left
    if (!this.facingRight) {
      ctx.translate(this.x + this.width, 0);
      ctx.scale(-1, 1);
      ctx.translate(-this.x, 0);
    }

    const x = this.x;
    const y = this.y;

    // Flash when hit
    if (this.isHit && this.hitStun % 4 < 2) {
      ctx.globalAlpha = 0.5;
    }

    // Draw based on state
    switch (this.state) {
      case 'idle':
        this.drawIdle(ctx, x, y);
        break;
      case 'walk':
        this.drawWalk(ctx, x, y);
        break;
      case 'jump':
        this.drawJump(ctx, x, y);
        break;
      case 'attack':
        this.drawAttack(ctx, x, y);
        break;
      case 'hit':
        this.drawHit(ctx, x, y);
        break;
      case 'block':
        this.drawBlock(ctx, x, y);
        break;
    }

    ctx.restore();
  }

  drawIdle(ctx, x, y) {
    const bounce = Math.sin(this.animationFrame * Math.PI / 2) * 2;

    // Body
    ctx.fillStyle = this.colors.body;
    ctx.fillRect(x + 15, y + 30 + bounce, 30, 40);

    // Head
    ctx.fillStyle = this.colors.skin;
    ctx.fillRect(x + 18, y + 5 + bounce, 24, 24);

    // Hair
    ctx.fillStyle = this.colors.hair;
    ctx.fillRect(x + 18, y + 2 + bounce, 24, 8);

    // Eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(x + 22, y + 14 + bounce, 4, 4);
    ctx.fillRect(x + 34, y + 14 + bounce, 4, 4);

    // Arms
    ctx.fillStyle = this.colors.skin;
    ctx.fillRect(x + 5, y + 32 + bounce, 12, 25);
    ctx.fillRect(x + 43, y + 32 + bounce, 12, 25);

    // Legs
    ctx.fillStyle = this.colors.pants;
    ctx.fillRect(x + 18, y + 70 + bounce, 10, 30);
    ctx.fillRect(x + 32, y + 70 + bounce, 10, 30);

    // Feet
    ctx.fillStyle = this.colors.shoes;
    ctx.fillRect(x + 15, y + 95, 14, 5);
    ctx.fillRect(x + 31, y + 95, 14, 5);
  }

  drawWalk(ctx, x, y) {
    const step = this.animationFrame % 2 === 0 ? 5 : -5;
    this.drawIdle(ctx, x, y);

    // Animate legs
    ctx.fillStyle = this.colors.pants;
    ctx.fillRect(x + 18, y + 70, 10, 30 + step);
    ctx.fillRect(x + 32, y + 70, 10, 30 - step);
  }

  drawJump(ctx, x, y) {
    // Compact pose
    ctx.fillStyle = this.colors.body;
    ctx.fillRect(x + 15, y + 35, 30, 35);

    ctx.fillStyle = this.colors.skin;
    ctx.fillRect(x + 18, y + 10, 24, 24);

    ctx.fillStyle = this.colors.hair;
    ctx.fillRect(x + 18, y + 7, 24, 8);

    ctx.fillStyle = '#000';
    ctx.fillRect(x + 22, y + 19, 4, 4);
    ctx.fillRect(x + 34, y + 19, 4, 4);

    // Arms up
    ctx.fillStyle = this.colors.skin;
    ctx.fillRect(x + 5, y + 25, 12, 20);
    ctx.fillRect(x + 43, y + 25, 12, 20);

    // Legs tucked
    ctx.fillStyle = this.colors.pants;
    ctx.fillRect(x + 15, y + 70, 30, 20);

    ctx.fillStyle = this.colors.shoes;
    ctx.fillRect(x + 15, y + 85, 30, 8);
  }

  drawAttack(ctx, x, y) {
    const progress = this.attackFrame / this.attackDuration;

    // Body
    ctx.fillStyle = this.colors.body;
    ctx.fillRect(x + 15, y + 30, 30, 40);

    // Head
    ctx.fillStyle = this.colors.skin;
    ctx.fillRect(x + 18, y + 5, 24, 24);

    ctx.fillStyle = this.colors.hair;
    ctx.fillRect(x + 18, y + 2, 24, 8);

    // Angry eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(x + 22, y + 12, 6, 3);
    ctx.fillRect(x + 34, y + 12, 6, 3);

    // Attack arm extended
    ctx.fillStyle = this.colors.skin;

    if (this.attackType === 'punch') {
      const extend = progress < 0.5 ? progress * 2 * 30 : (1 - (progress - 0.5) * 2) * 30;
      ctx.fillRect(x + 45, y + 35, 15 + extend, 12);
      ctx.fillRect(x + 5, y + 35, 12, 20);
    } else if (this.attackType === 'kick') {
      const extend = progress < 0.5 ? progress * 2 * 35 : (1 - (progress - 0.5) * 2) * 35;
      ctx.fillRect(x + 5, y + 32, 12, 25);
      ctx.fillRect(x + 43, y + 32, 12, 25);
      ctx.fillStyle = this.colors.pants;
      ctx.fillRect(x + 40, y + 65, 20 + extend, 15);
      ctx.fillStyle = this.colors.shoes;
      ctx.fillRect(x + 55 + extend, y + 65, 10, 15);
    } else if (this.attackType === 'special') {
      ctx.fillRect(x + 5, y + 32, 12, 25);
      ctx.fillRect(x + 43, y + 20, 12, 15);

      // Energy effect
      const size = progress < 0.5 ? progress * 60 : 30;
      ctx.fillStyle = this.specialColor;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(x + 70 + size/2, y + 35, size/2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    if (this.attackType !== 'kick') {
      ctx.fillStyle = this.colors.pants;
      ctx.fillRect(x + 18, y + 70, 10, 30);
      ctx.fillRect(x + 32, y + 70, 10, 30);

      ctx.fillStyle = this.colors.shoes;
      ctx.fillRect(x + 15, y + 95, 14, 5);
      ctx.fillRect(x + 31, y + 95, 14, 5);
    } else {
      ctx.fillStyle = this.colors.pants;
      ctx.fillRect(x + 18, y + 70, 10, 30);
      ctx.fillStyle = this.colors.shoes;
      ctx.fillRect(x + 15, y + 95, 14, 5);
    }
  }

  drawHit(ctx, x, y) {
    // Knocked back pose
    ctx.fillStyle = this.colors.body;
    ctx.fillRect(x + 20, y + 35, 25, 35);

    ctx.fillStyle = this.colors.skin;
    ctx.fillRect(x + 23, y + 12, 20, 22);

    ctx.fillStyle = this.colors.hair;
    ctx.fillRect(x + 23, y + 9, 20, 8);

    // X eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(x + 26, y + 18, 4, 4);
    ctx.fillRect(x + 36, y + 18, 4, 4);

    // Arms flailing
    ctx.fillStyle = this.colors.skin;
    ctx.fillRect(x + 0, y + 40, 20, 10);
    ctx.fillRect(x + 40, y + 25, 15, 10);

    ctx.fillStyle = this.colors.pants;
    ctx.fillRect(x + 22, y + 70, 8, 28);
    ctx.fillRect(x + 34, y + 70, 8, 28);

    ctx.fillStyle = this.colors.shoes;
    ctx.fillRect(x + 20, y + 93, 12, 7);
    ctx.fillRect(x + 32, y + 93, 12, 7);
  }

  drawBlock(ctx, x, y) {
    // Defensive pose
    ctx.fillStyle = this.colors.body;
    ctx.fillRect(x + 18, y + 32, 28, 38);

    ctx.fillStyle = this.colors.skin;
    ctx.fillRect(x + 20, y + 8, 22, 22);

    ctx.fillStyle = this.colors.hair;
    ctx.fillRect(x + 20, y + 5, 22, 8);

    ctx.fillStyle = '#000';
    ctx.fillRect(x + 24, y + 16, 4, 4);
    ctx.fillRect(x + 34, y + 16, 4, 4);

    // Arms crossed in front
    ctx.fillStyle = this.colors.skin;
    ctx.fillRect(x + 10, y + 35, 40, 15);

    ctx.fillStyle = this.colors.pants;
    ctx.fillRect(x + 20, y + 70, 8, 28);
    ctx.fillRect(x + 32, y + 70, 8, 28);

    ctx.fillStyle = this.colors.shoes;
    ctx.fillRect(x + 18, y + 93, 12, 7);
    ctx.fillRect(x + 30, y + 93, 12, 7);
  }
}

// Character configurations
const CHARACTERS = {
  blaze: {
    name: 'BLAZE',
    colors: {
      body: '#e74c3c',
      skin: '#fdbf6f',
      hair: '#c0392b',
      pants: '#2c3e50',
      shoes: '#7f8c8d'
    },
    specialColor: '#f39c12'
  },
  frost: {
    name: 'FROST',
    colors: {
      body: '#3498db',
      skin: '#fdbf6f',
      hair: '#2980b9',
      pants: '#1a1a2e',
      shoes: '#34495e'
    },
    specialColor: '#00d4ff'
  }
};
