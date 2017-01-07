import {Animation, Assets, Direction, Enemy, Item, Physics} from "./config"

const Goomba = function (game, startLocation) {
  let goomba = game.add.sprite(startLocation.x, startLocation.y, Enemy.GOOMBA);

  game.physics.enable(goomba);
  goomba.body.bounce.y = 0;
  goomba.body.bounce.x = 1;
  goomba.body.damping = 1;

  goomba.animations.add('walk', [0, 1], 6, true);
  goomba.play('walk');
  goomba.body.velocity.x = -40;

  goomba.state = {
    checkFacing() {
    },
    resolveEnemyCollision(mario, enemies) {
      if (goomba.body.position.y === mario.body.position.y + mario.body.height) {
        mario.body.velocity.y = Physics.Mario.ENEMY_BOUNCE;
        goomba.body.enable = false;
        //Kill goomba
        var anim = goomba.animations.add('die', [2], 6, false);
        anim.onComplete.add(function () {
          enemies.remove(goomba);
          goomba.kill();
        }, this);
        anim.play();
      } else {
        mario.state.takeHit();
      }
    }
  };
  return goomba;
};

export default Goomba
