"use strict";

import { Animation, Assets, Block, BlockType, Enemy, Item, Physics } from "./config"
import Mario from "./mario"
import Goomba from "./goomba"
import Koopa from "./koopa"

(function () {

  let map;
  let layer;
  let blocks;
  let items;
  let enemies;
  let gameObjects;

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
    game.load.tilemap(Assets.TileMap.SECRET_MAP, `assets/${Assets.TileMap.SECRET_MAP}.json`, null, Phaser.Tilemap.TILED_JSON);
    game.load.image(Assets.TileMap.SECRET_TILESET, `assets/${Assets.TileMap.SECRET_TILESET}.png`);
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
    game.load.spritesheet(Enemy.GOOMBA, 'assets/sprites/goomba.png', 16, 16);
    game.load.spritesheet(Enemy.GREEN_KOOPA, 'assets/sprites/koopa.png', 16, 32);
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
    enemies = game.add.group();

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

    // mario = game.add.sprite(50, 50, Assets.SpriteSheets.MARIO_SMALL);
    let levelStart = map.objects["Game-Objects"].find(current => current.name === "Level-Start");
    mario = Mario(game, levelStart);
  }

  function update() {
    game.physics.arcade.collide(mario, layer, resolveCollision);
    game.physics.arcade.collide(mario, blocks, resolveBlocksCollision);
    game.physics.arcade.collide(mario, items, resolveItemsCollision);
    game.physics.arcade.collide(items, layer);
    game.physics.arcade.collide(items, blocks);
    game.physics.arcade.collide(enemies, layer);
    game.physics.arcade.collide(enemies, blocks);
    game.physics.arcade.collide(mario, enemies, resolveEnemyCollision);
    game.physics.arcade.collide(mario, gameObjects, resolveGameObjectCollision);
    mario.state.processControls();

    let secretEntrance = map.objects["Game-Objects"].find(current => current.name === "Secret-Zone-1-Enter");
    if (checkMarioOverlap(mario, secretEntrance)) {
      resolveGameObjectCollision(mario, secretEntrance);
    }

    let enemySpawnPoints = map.objects["Enemy-Spawns"];
    for (let c=0; c<enemySpawnPoints.length; c++) {
      let currentSP = enemySpawnPoints[c];
      if (checkCameraOverlap(currentSP)) {
        if (!currentSP.hasSpawned) {
          if (currentSP.name === Enemy.GOOMBA) {
            currentSP.hasSpawned = true;
            let goomba = Goomba(game, currentSP);
            enemies.add(goomba);
          } else if (currentSP.name === Enemy.GREEN_KOOPA) {
            currentSP.hasSpawned = true;
            let koopa = Koopa(game, currentSP);
            enemies.add(koopa);
          }
        }
      }
    }

    enemies.children.map(enemy => enemy.state.checkFacing());

    function checkMarioOverlap(mario, object) {
      // debugger;
      let marioBounds = new Phaser.Rectangle(mario.x, mario.y, mario.width, mario.height);
      let objectBounds = new Phaser.Rectangle(object.x, object.y, object.width, object.height);
      return Phaser.Rectangle.intersects(marioBounds, objectBounds);
    }

    function checkCameraOverlap(object) {
      // debugger;
      let bounds = new Phaser.Rectangle(object.x, object.y, object.width, object.height);
      return Phaser.Rectangle.intersects(bounds, game.camera.view);
    }
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
            mushroom.body.damping = 1;
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
            flower.body.damping = 1;
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
          mushroom.body.damping = 1;
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

  function resolveItemsCollision(mario, item) {
    mario.state.collectItem(item);
    item.kill();
    items.remove(item);
  }

  function resolveEnemyCollision(mario, enemy) {
    enemy.state.resolveEnemyCollision(mario, enemies);
  }

  function resolveGameObjectCollision(mario, gameObject) {
    if (mario.y + mario.height === gameObject.y) {
      if (mario.x > gameObject.x && mario.x + mario.width < gameObject.x + gameObject.width) {
        if (cursors.down.isDown) {
          debugger;
        }
      }
    }
  }
})();