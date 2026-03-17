import assert from 'assert';
import { ProjectileSystem } from '../src/systems/combat/ProjectileSystem.js';
import { createProjectile } from '../src/entities/createProjectile.js';

function runTests() {
  console.log('--- ProjectileSystem.test.js ---');

  // Test 1: Boomerang reverse logic
  {
    const proj = createProjectile({
      x: 0, y: 0,
      dirX: 1, dirY: 0,
      speed: 100,
      maxRange: 100,
      behaviorId: 'boomerang'
    });

    const world = {
      projectiles: [proj],
      player: { x: 0, y: 0 },
      deltaTime: 0.4, // travel 40
    };

    // 1st update: Distance = 40 (less than 50)
    ProjectileSystem.update({ world });
    assert.strictEqual(proj.x, 40, 'Should move forward by 40');
    assert.strictEqual(proj.distanceTraveled, 40);
    assert.strictEqual(proj._reversed, false);

    // 2nd update: Distance = 80 (greater than 50, should reverse)
    ProjectileSystem.update({ world });
    // Since we added `p.distanceTraveled = p.maxRange / 2`, it should be 50.
    assert.strictEqual(proj.distanceTraveled, 50);
    assert.strictEqual(proj.x, 80, 'moves forward first, then reverses direction');
    assert.strictEqual(proj.dirX, -1, 'Direction should be pointing to player (0 - 80)');
    assert.strictEqual(proj._reversed, true, '_reversed flag should be true');

    // 3rd update: Distance = 30 
    // Currently, proj.x is 80. It needs to move to < 20 to be destroyed by player.
    // Let's give it distance 70 to reach player.
    world.deltaTime = 0.7; // distance + 70
    ProjectileSystem.update({ world });
    // proj.x becomes 10. distSq = 100 < 400.
    // So it triggers the player catch condition: p.distanceTraveled = p.maxRange.
    // Wait, the catch condition checks before moving next frame. 
    // In THIS frame, p._reversed is true, so it updates direction. 
    // p.x=80, player=0 -> dx=-80, distSq=6400 -> Not < 400. 
    // THEN it moves: x = 80 - 70 = 10.
    // Next frame it will check and see it's caught.
    assert.strictEqual(proj.x, 10);
    
    // 4th update: Catching the boomerang
    world.deltaTime = 0.01; 
    ProjectileSystem.update({ world });
    assert.strictEqual(proj.isAlive, false, 'Should be dead (caught by player)');
    assert.strictEqual(proj.pendingDestroy, true);
  }

  console.log('OK: ProjectileSystem Boomerang Tests Passed');
}

try {
  runTests();
} catch (err) {
  console.error('FAIL: ProjectileSystem.test.js', err);
  process.exit(1);
}
