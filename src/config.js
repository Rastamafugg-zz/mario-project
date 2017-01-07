export const Physics = {
  GRAVITY: 1400,
  Mario: {
    ACCELERATION: 10,
    MIN_WALK: 60,
    MAX_WALK: 120,
    MIN_RUN: 100,
    MAX_RUN: 200,
    JUMP_TIME: 300,
    MIN_JUMP: -250,
    MAX_JUMP: -450,
    ENEMY_BOUNCE: -150,
  }
};
export const Assets = {
  TileMap: {
    MAP: 'map1-1',
    TILESET: 'overworld',
    SECRET_MAP: 'map1-1-secret',
    SECRET_TILESET: 'tiles'
  },
  SpriteSheets: {
    MARIO_SMALL: 'marioSmall',
    MARIO_BIG: 'marioBig'
  },
};
export const Item = {
  NONE: 'none',
  FLOWER: 'flower',
  MUSHROOM: 'mushroom',
  ONE_UP: "1-Up",
  STAR: "Star",
  BLOCK_COIN: "block-coin"
};
export const Block = {
  BLOCK: "Block",
  BLOCK_PIECE: "Block-Piece",
  ITEM_BLOCK: "Item-Block",
  HIDDEN_BLOCK: "Hidden-Block",
  ITEM_BLOCK_USED: "Item-Block-Used",
};
export const BlockType = {
  ONE_UP: "1-Up",
  POWER_UP: "Power-Up",
  COIN: "Coin",
  MULTI_COIN: "Multi-Coin"
};
export const Enemy = {
  GOOMBA: "Goomba",
  GREEN_KOOPA: "Koopa",
  RED_KOOPA: "red-koopa",
  FLY_KOOPA: "fly-koopa"
};
export const Animation = {
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
export const Direction = {
  UP: "up",
  DOWN: "down",
  LEFT: "left",
  RIGHT: "right"
};
