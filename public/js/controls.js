// Input Controller for keyboard and touch
class InputController {
  constructor() {
    this.keys = {};
    this.touchActions = {
      p1: { left: false, right: false, jump: false, punch: false, kick: false, special: false },
      p2: { left: false, right: false, jump: false, punch: false, kick: false, special: false }
    };

    this.isMobile = this.checkMobile();
    this.setupKeyboard();

    if (this.isMobile) {
      this.setupTouch();
    }
  }

  checkMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.innerWidth <= 1024 && 'ontouchstart' in window);
  }

  setupKeyboard() {
    document.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      // Prevent scrolling with arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    });

    document.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  setupTouch() {
    const touchControls = document.getElementById('touch-controls');
    if (touchControls) {
      touchControls.classList.remove('hidden');
    }

    const buttons = document.querySelectorAll('.touch-btn');
    buttons.forEach(btn => {
      const action = btn.dataset.action;

      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.touchActions.p1[action] = true;
        btn.classList.add('active');
      }, { passive: false });

      btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.touchActions.p1[action] = false;
        btn.classList.remove('active');
      }, { passive: false });

      btn.addEventListener('touchcancel', (e) => {
        this.touchActions.p1[action] = false;
        btn.classList.remove('active');
      });
    });
  }

  // Player 1 controls (WASD + F/G)
  getP1Input() {
    const input = {
      left: this.keys['KeyA'] || this.touchActions.p1.left,
      right: this.keys['KeyD'] || this.touchActions.p1.right,
      jump: this.keys['KeyW'] || this.keys['Space'] || this.touchActions.p1.jump,
      punch: this.keys['KeyF'] || this.touchActions.p1.punch,
      kick: this.keys['KeyG'] || this.touchActions.p1.kick,
      special: this.keys['KeyH'] || this.touchActions.p1.special,
      block: this.keys['KeyS']
    };

    // Reset one-shot actions
    if (input.punch) this.touchActions.p1.punch = false;
    if (input.kick) this.touchActions.p1.kick = false;
    if (input.special) this.touchActions.p1.special = false;
    if (input.jump) this.touchActions.p1.jump = false;

    return input;
  }

  // Player 2 controls (Arrow keys + K/L)
  getP2Input() {
    return {
      left: this.keys['ArrowLeft'],
      right: this.keys['ArrowRight'],
      jump: this.keys['ArrowUp'],
      punch: this.keys['KeyK'],
      kick: this.keys['KeyL'],
      special: this.keys['Semicolon'],
      block: this.keys['ArrowDown']
    };
  }

  // Check for one-shot inputs (like punch/kick)
  wasPressed(code) {
    const was = this.keys[code];
    this.keys[code] = false;
    return was;
  }

  showMobileControls() {
    const touchControls = document.getElementById('touch-controls');
    if (touchControls && this.isMobile) {
      touchControls.classList.remove('hidden');
    }
  }

  hideMobileControls() {
    const touchControls = document.getElementById('touch-controls');
    if (touchControls) {
      touchControls.classList.add('hidden');
    }
  }
}
