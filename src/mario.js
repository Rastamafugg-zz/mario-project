// import Config from "./config"
import { Animation, Assets, Direction, Item, Physics } from "./config"
// import Phaser from "phaser"
const Mario = function(game, startLocation) {
  const ANIMATIONS = [
      {name: Animation.Mario.WALK, frames: [1, 2, 3]},
      {name: Animation.Mario.WAIT, frames: [0]},
      {name: Animation.Mario.REVERSE, frames: [4]},
      {name: Animation.Mario.JUMP, frames: [5]},
      {name: Animation.Mario.CROUCH, frames: [6]},
      {name: Animation.Mario.SHOOT, frames: [16]},
  ];

  let mario = game.add.sprite(startLocation.x, startLocation.y, Assets.SpriteSheets.MARIO_SMALL);
  mario.anchor.x = 0.5;
  mario.anchor.y = 0.5;

  game.physics.enable(mario);
  mario.body.bounce.y = 0;
  // mario.body.damping = 1;
  mario.body.collideWorldBounds = true;

  ANIMATIONS.map(animation => mario.animations.add(animation.name, animation.frames, 10, true));
  // mario.animations.add(Animation.Mario.WALK, [1, 2, 3], 10, true);
  // mario.animations.add(Animation.Mario.WAIT, [0], 10, true);
  // mario.animations.add(Animation.Mario.REVERSE, [4], 10, true);
  // mario.animations.add(Animation.Mario.JUMP, [5], 10, true);
  // mario.animations.add(Animation.Mario.CROUCH, [6], 10, true);
  // mario.animations.add(Animation.Mario.SHOOT, [16], 10, true);
  mario.body.onWorldBounds = new Phaser.Signal();
  mario.body.onWorldBounds.add(function(sprite, up, down, left, right) {
    if (down && !mario.state.isDead) {
      game.camera.fade(0x000000, Phaser.Timer.Quarter, false);
      mario.state.isDead = true;
      mario.collideWorldBounds = false;
      game.time.events.add(Phaser.Timer.HALF, function() {
        game.camera.flash(0x000000, Phaser.Timer.Quarter, false);
        mario.x = mario.state.startLocation.x;
        mario.y = mario.state.startLocation.y;
        mario.state.isDead = false;
        mario.collideWorldBounds = true;
      }, this);
    }
  });
  mario.body.fixedRotation = true;

  game.camera.follow(mario);
  let cursors = game.input.keyboard.createCursorKeys();
  let shootButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
  let runButton = game.input.keyboard.addKey(Phaser.Keyboard.SHIFT);

  let processLeftRight = function(newDirection) {
    let onGround = mario.body.onFloor() || mario.body.touching.down;
    let xVelocity = mario.body.velocity.x;
    let currentAnimation = mario.animations.currentAnim.name;
    let newAnimation = currentAnimation;
    let directionMultiplier = (newDirection === Direction.LEFT) ? -1 : 1;
    if (mario.state.direction != newDirection) {
      mario.scale.x *= -1;
      if (onGround) {
        if (xVelocity !== 0) {
          newAnimation = Animation.Mario.REVERSE;
        } else {
          newAnimation = Animation.Mario.WALK;
        }
      }
    } else {
      if (onGround) {
        if ((xVelocity < 0 && newDirection === Direction.RIGHT) ||
            (xVelocity > 0 && newDirection === Direction.LEFT)) {
          newAnimation = Animation.Mario.REVERSE;
          xVelocity += directionMultiplier * Physics.Mario.ACCELERATION;
        } else {
          newAnimation = Animation.Mario.WALK;
          let accelerate = function(topSpeed) {
            if (Math.abs(xVelocity) < topSpeed) {
              xVelocity += directionMultiplier * Physics.Mario.ACCELERATION;
            } else {
              xVelocity = directionMultiplier * topSpeed;
            }
          };
          if (runButton.isDown) {
            accelerate(Physics.Mario.MAX_RUN);
          } else {
            accelerate(Physics.Mario.MAX_WALK);
          }
        }
      } else {
        let accelerate = function(topSpeed) {
          if (Math.abs(xVelocity) < topSpeed) {
            xVelocity += directionMultiplier * Physics.Mario.ACCELERATION;
          } else {
            xVelocity = directionMultiplier * topSpeed;
          }
        };
        if (runButton.isDown) {
          accelerate(Physics.Mario.MAX_RUN);
        } else {
          accelerate(Physics.Mario.MAX_WALK);
        }
      }
    }
    mario.body.velocity.x = xVelocity;
    mario.state.direction = newDirection;
    mario.state.doNothing = false;
    if (onGround && currentAnimation != newAnimation) {
      mario.animations.play(newAnimation);
    }
  };
  let generateFrameData = function(frames, offset) {
    let index, x, y = 32 * offset, width = 16, height = 32, name = "";
    let frameData = new Phaser.FrameData();
    for (let a = 0; a < frames.length; a++) {
      index = frames[a];
      x = index * 16;
      frameData.addFrame(new Phaser.Frame(index + (offset * 21), x, y, width, height, name));
    }
    return frameData;
  };

  mario.state = {
    direction: Direction.RIGHT,
    doNothing: true,
    isInvincible: false,
    isDead: false,
    isJumping: false,
    stopJumping: true,
    item: Item.NONE,
    startLocation,
    processControls: () => {
      this.doNothing = true;
      if (cursors.down.isDown) {
        if (mario.body.onFloor() || mario.body.touching.down) {
          if (this.item === Item.MUSHROOM || this.item === Item.FLOWER) {
            mario.animations.play(Animation.Mario.CROUCH);
          } else {
            mario.animations.play(Animation.Mario.WAIT);
          }
          if (mario.body.velocity.x > 0) {
            mario.body.velocity.x -= Physics.Mario.ACCELERATION;
          } else if (mario.body.velocity.x < 0) {
            mario.body.velocity.x += Physics.Mario.ACCELERATION;
          }
        }
        this.doNothing = false;
      } else if (cursors.left.isDown) {
        processLeftRight(Direction.LEFT);
      } else if (cursors.right.isDown) {
        processLeftRight(Direction.RIGHT);
      }
      if (cursors.up.isDown) {
        if (cursors.up.justDown && !this.isJumping) {
          if (mario.body.onFloor() || mario.body.touching.down) {
            // debugger
            mario.body.velocity.y = Physics.Mario.MIN_JUMP;
            mario.animations.play(Animation.Mario.JUMP);
            game.time.events.add(Physics.Mario.JUMP_TIME, function() {
              this.stopJumping = true;
            }, this);
            this.stopJumping = false;
            this.isJumping = true;
          }
        } else {
          if (this.stopJumping) {
            mario.body.gravity.y = 0;
            if (this.isJumping) {
              this.isJumping = false;
            }
          } else {
            // debugger;
            mario.animations.play(Animation.Mario.JUMP);
            mario.body.gravity.y = Physics.GRAVITY * -1;
          }
        }
      } else {
        mario.body.gravity.y = 0;
        if (this.isJumping) {
          this.isJumping = false;
          if (!this.stopJumping) {
            this.stopJumping = true;
          }
        }
      }
      if (shootButton.justDown && this.item === Item.FLOWER) {
        mario.animations.play(Animation.Mario.SHOOT);
        this.doNothing = false;
        let fireball = game.add.sprite((this.direction === Direction.RIGHT) ? mario.right : mario.left - 8, mario.top + mario.body.halfHeight, Animation.Level.FIREBALL);
        fireball.animations.add(Animation.Level.FIREBALL, [0, 1, 2, 3], 4, true);
        fireball.animations.play(Animation.Level.FIREBALL);
        fireball.autoCull = true;
        fireball.outOfCameraBoundsKill  = true;
        game.physics.enable(fireball);
        fireball.enableBody = true;
        fireball.body.bounce.y = 1;
        fireball.body.bounce.x = 1;
        fireball.body.collideWorldBounds = true;
        fireball.body.velocity.x = (this.direction === Direction.RIGHT) ? 200 : -200;
        fireball.body.velocity.y = 0;
        items.add(fireball);
      }
      if (this.doNothing) {
        if (mario.body.velocity.x > 10) {
          mario.body.velocity.x -= 10;
        } else if (mario.body.velocity.x < -10) {
          mario.body.velocity.x += 10;
        } else {
          mario.body.velocity.x = 0;
        }
        if (mario.body.onFloor() || mario.body.touching.down) {
          mario.animations.play(Animation.Mario.WAIT);
        }
      }
    },
    collectItem: function(item) {
      if (item.key === Item.MUSHROOM) {
        if (mario.key === Assets.SpriteSheets.MARIO_SMALL) {
          mario.loadTexture(Assets.SpriteSheets.MARIO_BIG);
          mario.body.setSize(16, 32);
          mario.state.item = Item.MUSHROOM;
        }
      } else if (item.key === Item.FLOWER) {
        if (mario.key === Assets.SpriteSheets.MARIO_SMALL) {
          mario.loadTexture(Assets.SpriteSheets.MARIO_BIG);
          mario.body.setSize(16, 32);
          mario.state.item = Item.MUSHROOM;
        } else {
          let offset = 2;
          for (let index=0; index<ANIMATIONS.length; index++) {
            let frameData = generateFrameData(ANIMATIONS[index].frames, offset);
            let animation = mario.animations.getAnimation(ANIMATIONS[index].name);
            animation.updateFrameData(frameData);
          }

          mario.state.item = Item.FLOWER;
        }
      }
    },
    takeHit: function() {
      if (mario.state.isInvincible) return;
      if (mario.state.item === Item.FLOWER) {
        let offset = 0;
        for (let index = 0; index < ANIMATIONS.length; index++) {
          let frameData = generateFrameData(ANIMATIONS[index].frames, offset);
          let animation = mario.animations.getAnimation(ANIMATIONS[index].name);
          animation.updateFrameData(frameData);
        }

        mario.state.item = Item.MUSHROOM;
        mario.state.isInvincible = true;
        game.time.events.add(Phaser.Timer.HALF, () => mario.state.isInvicible = false, this);
      } else if (mario.state.item === Item.MUSHROOM) {
        mario.loadTexture(Assets.SpriteSheets.MARIO_SMALL);
        mario.body.setSize(16, 16);
        mario.y = mario.y + 16;
        mario.state.item = Item.NONE;
        mario.state.isInvincible = true;
        game.time.events.add(Phaser.Timer.HALF, () => mario.state.isInvicible = false, this);
      } else {
        game.camera.fade(0x000000, Phaser.Timer.Quarter, false);
        mario.state.isDead = true;
        mario.collideWorldBounds = false;
        game.time.events.add(Phaser.Timer.HALF, () => {
          game.camera.flash(0x000000, Phaser.Timer.Quarter, false);
          mario.x = mario.state.startLocation.x;
          mario.y = mario.state.startLocation.y;
          mario.state.isDead = false;
          mario.collideWorldBounds = true;
        }, this);
      }
    }
  };
  return mario;
};

export default Mario
