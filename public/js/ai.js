// AI Controller for CPU opponent
class AIController {
  constructor(difficulty = 'medium') {
    this.difficulty = difficulty;
    this.actionCooldown = 0;
    this.decisionTimer = 0;
    this.currentAction = null;

    // Difficulty settings
    this.settings = {
      easy: {
        reactionTime: 45,
        aggressiveness: 0.3,
        blockChance: 0.2,
        specialChance: 0.1
      },
      medium: {
        reactionTime: 25,
        aggressiveness: 0.5,
        blockChance: 0.4,
        specialChance: 0.2
      },
      hard: {
        reactionTime: 10,
        aggressiveness: 0.7,
        blockChance: 0.6,
        specialChance: 0.35
      }
    };

    this.config = this.settings[difficulty];
  }

  update(fighter, opponent) {
    if (this.actionCooldown > 0) {
      this.actionCooldown--;
      return this.executeCurrentAction(fighter);
    }

    this.decisionTimer++;
    if (this.decisionTimer < this.config.reactionTime) {
      return this.executeCurrentAction(fighter);
    }

    this.decisionTimer = 0;
    this.makeDecision(fighter, opponent);
    return this.executeCurrentAction(fighter);
  }

  makeDecision(fighter, opponent) {
    const distance = Math.abs(fighter.x - opponent.x);
    const isOpponentAttacking = opponent.isAttacking;

    // Reset actions
    this.currentAction = {
      left: false,
      right: false,
      jump: false,
      punch: false,
      kick: false,
      special: false,
      block: false
    };

    // Block if opponent is attacking and close
    if (isOpponentAttacking && distance < 100) {
      if (Math.random() < this.config.blockChance) {
        this.currentAction.block = true;
        this.actionCooldown = 30;
        return;
      }
    }

    // Close range combat
    if (distance < 80) {
      if (Math.random() < this.config.aggressiveness) {
        // Attack
        const attackRoll = Math.random();
        if (attackRoll < this.config.specialChance && fighter.specialCooldown <= 0) {
          this.currentAction.special = true;
        } else if (attackRoll < 0.5) {
          this.currentAction.punch = true;
        } else {
          this.currentAction.kick = true;
        }
        this.actionCooldown = 20;
      } else {
        // Back away
        if (fighter.x < opponent.x) {
          this.currentAction.left = true;
        } else {
          this.currentAction.right = true;
        }
        this.actionCooldown = 15;
      }
      return;
    }

    // Medium range - approach or use special
    if (distance < 200) {
      if (Math.random() < this.config.specialChance && fighter.specialCooldown <= 0) {
        this.currentAction.special = true;
        this.actionCooldown = 30;
        return;
      }

      // Jump attack occasionally
      if (Math.random() < 0.2) {
        this.currentAction.jump = true;
        if (fighter.x < opponent.x) {
          this.currentAction.right = true;
        } else {
          this.currentAction.left = true;
        }
        this.actionCooldown = 25;
        return;
      }
    }

    // Far range - approach
    if (Math.random() < this.config.aggressiveness) {
      if (fighter.x < opponent.x) {
        this.currentAction.right = true;
      } else {
        this.currentAction.left = true;
      }

      // Sometimes jump while approaching
      if (Math.random() < 0.15) {
        this.currentAction.jump = true;
      }
    }

    this.actionCooldown = 10;
  }

  executeCurrentAction(fighter) {
    if (!this.currentAction) return;

    // Movement
    if (this.currentAction.left) {
      fighter.moveLeft();
    } else if (this.currentAction.right) {
      fighter.moveRight();
    } else {
      fighter.stop();
    }

    // Actions
    if (this.currentAction.jump) {
      fighter.jump();
      this.currentAction.jump = false; // Single jump
    }

    if (this.currentAction.punch) {
      fighter.punch();
      this.currentAction.punch = false;
    }

    if (this.currentAction.kick) {
      fighter.kick();
      this.currentAction.kick = false;
    }

    if (this.currentAction.special) {
      fighter.special();
      this.currentAction.special = false;
    }

    fighter.block(this.currentAction.block);
  }

  setDifficulty(difficulty) {
    this.difficulty = difficulty;
    this.config = this.settings[difficulty];
  }
}
