"use strict";

(function () {
  const Physics = {
    GRAVITY: 1400,
    Mario: {
      ACCELERATION: 10,
      MIN_WALK: 60,
      MAX_WALK: 120,
      MIN_RUN: 100,
      MAX_RUN: 200,
      JUMP: -520,
    }
  };
  const Assets = {
    TileMap: {
      MAP: 'map1-1',
      TILESET: 'overworld'
    },
    SpriteSheets: {
      MARIO_SMALL: 'marioSmall',
      MARIO_BIG: 'marioBig'
    },
  };
  const Item = {
    NONE: 'none',
    FLOWER: 'flower',
    MUSHROOM: 'mushroom',
    ONE_UP: "1-Up",
    STAR: "Star",
    BLOCK_COIN: "block-coin"
  };
  const Block = {
    BLOCK: "Block",
    BLOCK_PIECE: "Block-Piece",
    ITEM_BLOCK: "Item-Block",
    HIDDEN_BLOCK: "Hidden-Block",
    ITEM_BLOCK_USED: "Item-Block-Used",
  };
  const BlockType = {
    ONE_UP: "1-Up",
    POWER_UP: "Power-Up",
    COIN: "Coin",
    MULTI_COIN: "Multi-Coin"
  };
  const Animation = {
    Mario: {
      WALK: "walk",
      WAIT: "wait",
      REVERSE: "reverse",
      JUMP: "jump",
      CROUCH: "crouch",
      SHOOT: "shoot",
    },
    Level: {
      BLOCK_PIECE: "block-piece",
      FIREBALL: "fireball"
    }
  };
  const Direction = {
    UP: "up",
    DOWN: "down",
    LEFT: "left",
    RIGHT: "right"
  };
  const MarioState = function(sprite, cursors, shootButton, runButton) {
    let processLeftRight = function(newDirection) {
      let onGround = sprite.body.onFloor() || sprite.body.touching.down;
      let xVelocity = sprite.body.velocity.x;
      let currentAnimation = sprite.animations.currentAnim.name;
      let newAnimation = currentAnimation;
      let directionMultiplier = (newDirection === Direction.LEFT) ? -1 : 1;
      if (state.direction != newDirection) {
        sprite.scale.x *= -1;
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
        }
      }
      sprite.body.velocity.x = xVelocity;
      state.direction = newDirection;
      state.doNothing = false;
      if (onGround && sprite.animations.currentAnim.name != newAnimation) {
        sprite.animations.play(newAnimation);
      }
    };
    let state = {
      direction: Direction.RIGHT,
      doNothing: true,
      item: Item.NONE,
      processControls: function () {
        this.doNothing = true;
        if (cursors.down.isDown && (this.item === Item.MUSHROOM || this.item === Item.FLOWER)) {
          sprite.animations.play(Animation.Mario.CROUCH);
          this.doNothing = false;
        } else if (cursors.left.isDown) {
          processLeftRight(Direction.LEFT);
        } else if (cursors.right.isDown) {
          processLeftRight(Direction.RIGHT);
        }
        if (cursors.up.justDown) {
          if (sprite.body.onFloor() || sprite.body.touching.down) {
            sprite.body.velocity.y = Physics.Mario.JUMP;
            sprite.animations.play(Animation.Mario.JUMP);
            this.doNothing = false;
          }
        }
        if (shootButton.justDown && this.item === Item.FLOWER) {
          sprite.animations.play(Animation.Mario.SHOOT);
          this.doNothing = false;
          let fireball = game.add.sprite((this.direction === Direction.RIGHT) ? sprite.right : sprite.left - 8, sprite.top + sprite.body.halfHeight, Animation.Level.FIREBALL);
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
          if (sprite.body.velocity.x > 10) {
            sprite.body.velocity.x -= 10;
          } else if (sprite.body.velocity.x < -10) {
            sprite.body.velocity.x += 10;
          } else {
            sprite.body.velocity.x = 0;
          }
          if (sprite.body.onFloor() || sprite.body.touching.down) {
            sprite.animations.play(Animation.Mario.WAIT);
          }
        }
      }
    };
    return state;
  };

  let map;
  let layer;
  let blocks;
  let items;

  let mario;

  const game = new Phaser.Game(512, 256, Phaser.AUTO, 'game', {
    preload: preload,
    create: create,
    update: update,
    render: render
  });

  function preload() {
    game.load.tilemap(Assets.TileMap.MAP, `assets/${Assets.TileMap.MAP}.json`, null, Phaser.Tilemap.TILED_JSON);
    game.load.image(Assets.TileMap.TILESET, `assets/${Assets.TileMap.TILESET}.png`);
    game.load.image(Block.BLOCK, 'assets/sprites/block.png');
    game.load.image(Block.HIDDEN_BLOCK, 'assets/sprites/hidden-block.png');
    game.load.image(Block.ITEM_BLOCK_USED, 'assets/sprites/item-block-used.png');
    game.load.image(Item.MUSHROOM, 'assets/sprites/mushroom.png');
    game.load.image(Item.ONE_UP, 'assets/sprites/1-up.png');

    game.load.spritesheet(Item.FLOWER, 'assets/sprites/flower.png', 16, 16);
    game.load.spritesheet(Assets.SpriteSheets.MARIO_SMALL, 'assets/marioSmall.png', 16, 16);
    game.load.spritesheet(Assets.SpriteSheets.MARIO_BIG, 'assets/marioBig.png', 16, 32);
    game.load.spritesheet(Item.BLOCK_COIN, 'assets/sprites/coin-animation.png', 16, 16);
    game.load.spritesheet(Block.BLOCK_PIECE, 'assets/sprites/block-piece.png', 8, 8);
    game.load.spritesheet(Animation.Level.FIREBALL, 'assets/sprites/fireball.png', 8, 8);
    game.load.spritesheet(Block.ITEM_BLOCK, 'assets/sprites/item-block.png', 16, 16);
  }

  function create() {
    let x, y;

    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.physics.arcade.gravity.y = Physics.GRAVITY;

    game.stage.backgroundColor = '#5C94FC';
    game.fpsProblemNotifier.add(function(param) {
      console.log("fps:" + param);
    });

    map = game.add.tilemap(Assets.TileMap.MAP);
    map.addTilesetImage(Assets.TileMap.TILESET, Assets.TileMap.TILESET);
    layer = map.createLayer('World 1-1');
    layer.resizeWorld();
    layer.wrap = true;
    map.setCollision([1, 33, 65, 66, 97, 98]);

    items = game.add.group();
    // items.enableBody = true;

    blocks = game.add.group();
    blocks.enableBody = true;
    map.createFromObjects("Blocks", Block.BLOCK, Block.BLOCK, undefined, true, false, blocks);
    map.createFromObjects("Item-Blocks", Block.ITEM_BLOCK, Block.ITEM_BLOCK, undefined, true, false, blocks);
    map.createFromObjects("Hidden-Blocks", Block.HIDDEN_BLOCK, Block.HIDDEN_BLOCK, undefined, true, false, blocks);
    for (x = 0; x < blocks.children.length; x++) {
      let currentBlock = blocks.children[x];
      currentBlock.body.immovable = true;
      currentBlock.body.allowGravity = false;
      currentBlock.body.setSize(12, 16, 2, 0);
      if (currentBlock.key === Block.ITEM_BLOCK) {
        currentBlock.animations.add(Block.ITEM_BLOCK, [0, 1, 2], 3, true);
        currentBlock.animations.play(Block.ITEM_BLOCK);
      }
    }

    mario = game.add.sprite(50, 50, Assets.SpriteSheets.MARIO_SMALL);
    mario.anchor.x = 0.5;
    mario.anchor.y = 0.5;

    game.physics.enable(mario);
    mario.body.bounce.y = 0;
    // mario.body.linearDamping = 1;
    mario.body.collideWorldBounds = true;

    mario.animations.add(Animation.Mario.WALK, [1, 2, 3], 10, true);
    mario.animations.add(Animation.Mario.WAIT, [0], 10, true);
    mario.animations.add(Animation.Mario.REVERSE, [4], 10, true);
    mario.animations.add(Animation.Mario.JUMP, [5], 10, true);
    mario.animations.add(Animation.Mario.CROUCH, [6], 10, true);
    mario.animations.add(Animation.Mario.SHOOT, [16], 10, true);

    mario.body.fixedRotation = true;

    game.camera.follow(mario);
    let cursors = game.input.keyboard.createCursorKeys();
    let shootButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    let runButton = game.input.keyboard.addKey(Phaser.Keyboard.SHIFT);

    mario.state = MarioState(mario, cursors, shootButton, runButton);
  }


  function update() {
    game.physics.arcade.collide(mario, layer, resolveCollision);
    game.physics.arcade.collide(mario, blocks, resolveBlocksCollision);
    game.physics.arcade.collide(mario, items, resolveItemsCollision);
    game.physics.arcade.collide(items, layer);
    game.physics.arcade.collide(items, blocks);
    mario.state.processControls();
  }

  function render() {
    // game.debug.bodyInfo(mario, 32, 32);
    // game.debug.body(mario);
  }

  function resolveCollision(mario, object) {
    if (object.index === 40) {
      //ground
    } else if (object.index === 21 || object.index === 22 || object.index === 27 || object.index === 28) {
      //pipe
    } else if (object.index === 16) {
      //non-destructible block
    } else if (object.index === 5 || object.index === 9 || object.index === 10 || object.index === 17) {
      //level flag
    } else {
      if (mario.body.blocked.up) {
        // debugger
        // object.alpha = 0.2;
        object.index = 41;
        layer.dirty = true;
      }
    }
  }

  function resolveBlocksCollision(mario, block) {
    let x;
    let marioX = mario.body.position.x;
    let marioY = mario.body.position.y;
    let marioWidth = mario.body.width;
    let targetBlock = block;
    let collisionBlocks = [];

    if (marioY === (block.body.position.y + block.body.height)) {
      for (x = 0; x < blocks.children.length; x++) {
        // debugger
        if (blocks.children[x].body.position.y + blocks.children[x].body.height === marioY
            && blocks.children[x].body.position.x <= marioX + marioWidth
            && blocks.children[x].body.position.x + blocks.children[x].body.width >= marioX) {
          collisionBlocks.push(blocks.children[x]);
        }
      }

      if (collisionBlocks.length === 1) {
        targetBlock = collisionBlocks[0];
      } else {
        for (x = 0; x < collisionBlocks.length; x++) {
          if (collisionBlocks[x].body.position.x <= marioX + marioWidth / 2
              && collisionBlocks[x].body.position.x + collisionBlocks[x].body.width >= marioX + marioWidth / 2) {
            targetBlock = collisionBlocks[x];
          }
        }
      }

      if (targetBlock.key === Block.ITEM_BLOCK_USED) {
        //Used Blocks are treated as non-movable
        return;
      }
      //Bounce hit block sprite in response to being hit
      let initialY = block.y;
      let bounce = game.add.tween(targetBlock);
      bounce.to({y: initialY - 5}, 100);
      let bounceReturn = game.add.tween(targetBlock);
      bounceReturn.to({y: initialY}, 100);
      bounce.chain(bounceReturn);
      bounce.start();

      if (targetBlock.key === Block.ITEM_BLOCK || targetBlock.key === Block.HIDDEN_BLOCK) {
        targetBlock.loadTexture(Block.ITEM_BLOCK_USED);
      }
      // Destroy non-multi-coin blocks
      if (targetBlock.key === Block.BLOCK
          && targetBlock.contents !== BlockType.MULTI_COIN
          && (mario.state.item === Item.MUSHROOM || mario.state.item === Item.FLOWER)) {
        let createBlockPiece = function(x, y, velocityX, velocityY) {
          let blockPiece = game.add.sprite(x, y, Block.BLOCK_PIECE);
          blockPiece.animations.add(Item.BLOCK_PIECE, [0, 1], 4, true);
          blockPiece.animations.play(Item.BLOCK_PIECE);
          blockPiece.autoCull = true;
          blockPiece.outOfCameraBoundsKill  = true;

          game.physics.enable(blockPiece);
          blockPiece.enableBody = true;
          blockPiece.body.velocity.x = velocityX;
          blockPiece.body.velocity.y = velocityY;
        };
        createBlockPiece(targetBlock.x, targetBlock.y, -100, -100);
        createBlockPiece(targetBlock.x + 8, targetBlock.y, 100, -100);
        createBlockPiece(targetBlock.x, targetBlock.y + 8, -100, 0);
        createBlockPiece(targetBlock.x + 8, targetBlock.y + 8, 100, 0);

        blocks.remove(targetBlock);
        targetBlock.kill();
      } else if (targetBlock.contents === BlockType.MULTI_COIN) {
        if (!targetBlock.blockActivated) {
          game.time.events.add(Phaser.Timer.SECOND * 6, function() {
            targetBlock.loadTexture(Block.ITEM_BLOCK_USED);
          }, this);
          targetBlock.blockActivated = true;
        }
        let startX = targetBlock.x, startY = targetBlock.y - 16;
        let blockCoin = game.add.sprite(startX, startY, Item.BLOCK_COIN);
        blockCoin.animations.add(Item.BLOCK_COIN, [0, 1, 2, 3], 10, true);
        blockCoin.animations.play(Item.BLOCK_COIN);
        let bounce = game.add.tween(blockCoin);
        bounce.to({y: startY - 32}, 200);
        let bounceReturn = game.add.tween(blockCoin);
        bounceReturn.to({y: startY}, 200);
        bounce.chain(bounceReturn);
        bounceReturn.onComplete.add(function () {
          blockCoin.kill();
        }, this);
        bounce.start();
      }
      if (targetBlock.contents === BlockType.POWER_UP) {
        if (mario.key === Assets.SpriteSheets.MARIO_SMALL) {
          let mushroom = game.add.sprite(targetBlock.x, targetBlock.y, Item.MUSHROOM);
          let group = game.add.group();
          group.add(mushroom);
          group.add(targetBlock);
          let spawn = game.add.tween(mushroom);
          spawn.to({y: initialY - 16}, 1000);
          spawn.onComplete.add(function () {
            group.remove(mushroom);
            group.remove(targetBlock);
            blocks.add(targetBlock);
            game.physics.enable(mushroom);
            items.add(mushroom);
            mushroom.enableBody = true;
            mushroom.body.bounce.y = 0;
            mushroom.body.bounce.x = 1;
            mushroom.body.linearDamping = 1;
            mushroom.body.collideWorldBounds = true;
            mushroom.body.velocity.x = 60;
          }, this);
          spawn.start();
        } else {
          let flower = game.add.sprite(targetBlock.x, targetBlock.y, Item.FLOWER);
          flower.animations.add(Item.FLOWER, [0, 1, 2, 3], 10, true);
          flower.animations.play(Item.FLOWER);
          let group = game.add.group();
          group.add(flower);
          group.add(targetBlock);
          let spawn = game.add.tween(flower);
          spawn.to({y: initialY - 16}, 1000);
          spawn.onComplete.add(function () {
            game.physics.enable(flower);
            group.remove(flower);
            group.remove(targetBlock);
            blocks.add(targetBlock);
            items.add(flower);
            flower.enableBody = true;
            flower.body.bounce.y = 0;
            flower.body.bounce.x = 1;
            flower.body.linearDamping = 1;
            flower.body.collideWorldBounds = true;
            flower.body.velocity.x = 0;
            // for (x = 0; x < blocks.children.length; x++) {
            //   // debugger
            //   if (blocks.children[x].body.position.y + blocks.children[x].body.height === marioY
            //       && blocks.children[x].body.position.x <= marioX + marioWidth
            //       && blocks.children[x].body.position.x + blocks.children[x].body.width >= marioX) {
            //     collisionBlocks.push(blocks.children[x]);
            //   }
            // }
          }, this);
          spawn.start();
        }
      } else if (targetBlock.contents === BlockType.ONE_UP) {
        let mushroom = game.add.sprite(targetBlock.x, targetBlock.y, Item.ONE_UP);
        let group = game.add.group();
        group.add(mushroom);
        group.add(targetBlock);
        let spawn = game.add.tween(mushroom);
        spawn.to({y: initialY - 16}, 1000);
        spawn.onComplete.add(function () {
          group.remove(mushroom);
          group.remove(targetBlock);
          blocks.add(targetBlock);
          game.physics.enable(mushroom);
          items.add(mushroom);
          mushroom.enableBody = true;
          mushroom.body.bounce.y = 0;
          mushroom.body.bounce.x = 1;
          mushroom.body.linearDamping = 1;
          mushroom.body.collideWorldBounds = true;
          mushroom.body.velocity.x = 60;
        }, this);
        spawn.start();
      } else if (targetBlock.contents === BlockType.COIN) {
        let startX = targetBlock.x, startY = targetBlock.y - 16;
        let blockCoin = game.add.sprite(startX, startY, Item.BLOCK_COIN);
        blockCoin.animations.add(Item.BLOCK_COIN, [0, 1, 2, 3], 10, true);
        blockCoin.animations.play(Item.BLOCK_COIN);
        let bounce = game.add.tween(blockCoin);
        bounce.to({y: startY - 32}, 200);
        let bounceReturn = game.add.tween(blockCoin);
        bounceReturn.to({y: startY}, 200);
        bounce.chain(bounceReturn);
        bounceReturn.onComplete.add(function () {
          blockCoin.kill();
        }, this);
        bounce.start();
      }

    }
  }

  function generateFrameData(frames, offset) {
    let index, x, y = 32 * offset, width = 16, height = 32, name = "";
    let frameData = new Phaser.FrameData();
    for (let a = 0; a < frames.length; a++) {
      index = frames[a];
      x = index * 16;
      frameData.addFrame(new Phaser.Frame(index + (offset * 21), x, y, width, height, name));
    }
    return frameData;
  }

  function resolveItemsCollision(mario, item) {
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
        let frameData = generateFrameData([1, 2, 3], 2);
        let animation = mario.animations.getAnimation(Animation.Mario.WALK);
        animation.updateFrameData(frameData);

        frameData = generateFrameData([0], 2);
        animation = mario.animations.getAnimation(Animation.Mario.WAIT);
        animation.updateFrameData(frameData);

        frameData = generateFrameData([5], 2);
        animation = mario.animations.getAnimation(Animation.Mario.JUMP);
        animation.updateFrameData(frameData);

        frameData = generateFrameData([6], 2);
        animation = mario.animations.getAnimation(Animation.Mario.CROUCH);
        animation.updateFrameData(frameData);

        frameData = generateFrameData([16], 2);
        animation = mario.animations.getAnimation(Animation.Mario.SHOOT);
        animation.updateFrameData(frameData);

        mario.state.item = Item.FLOWER;
      }
    }
    item.kill();
    items.remove(item);
  }

})();