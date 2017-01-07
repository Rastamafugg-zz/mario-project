import {Animation, Assets, Direction, Enemy, Item, Physics} from "./config"

const Koopa = function (game, startLocation) {
  let koopa = game.add.sprite(startLocation.x, startLocation.y - 16, Enemy.GREEN_KOOPA);
  koopa.anchor.x = 0.5;
  koopa.anchor.y = 0.5;

  game.physics.enable(koopa);
  koopa.body.bounce.y = 0;
  koopa.body.bounce.x = 1;
  koopa.body.damping = 1;
  koopa.animations.add('walk', [0, 1], 6, true);
  koopa.animations.add('shell', [4], 6, true);
  koopa.animations.add('waking', [4, 5], 12, true);
  koopa.play('walk');
  koopa.body.velocity.x = -40;
  koopa.state = {
    direction: Direction.LEFT,
    checkFacing() {
      if ((koopa.body.velocity.x > 0 && koopa.state.direction === Direction.LEFT)
          || (koopa.body.velocity.x < 0 && koopa.state.direction === Direction.RIGHT)) {
        koopa.scale.x *= -1;
        koopa.state.direction = (koopa.state.direction === Direction.LEFT)
            ? Direction.RIGHT : Direction.LEFT;
      }
    },
    resolveEnemyCollision(mario) {
      // debugger
      if (koopa.body.position.y === mario.body.position.y + mario.body.height) {
        mario.body.velocity.y = Physics.Mario.ENEMY_BOUNCE;
        if (koopa.animations.currentAnim.name === "walk") {
          koopa.body.velocity.x = 0;
          koopa.body.setSize(16, 16, 0, 16);
          koopa.animations.play("shell");
        } else if (koopa.animations.currentAnim.name === "shell") {
          if (Math.abs(koopa.body.velocity.x) === 200) {
            koopa.body.velocity.x = 0;
          } else if (mario.x + mario.width / 2 > koopa.x + koopa.width / 2) {
            koopa.body.velocity.x = 200;
          } else {
            koopa.body.velocity.x = -200;
          }
        }
      } else {
        if (koopa.animations.currentAnim.name === "shell") {
          // debugger
          if (Math.abs(koopa.body.velocity.x) === 200) {
            mario.state.takeHit();
          } else if (mario.x + mario.width / 2 < koopa.x + koopa.width / 2) {
            koopa.body.velocity.x = 200;
          } else {
            koopa.body.velocity.x = -200;
          }
        } else {
          mario.state.takeHit();
        }
      }
    }
  };

  return koopa;
};

export default Koopa
