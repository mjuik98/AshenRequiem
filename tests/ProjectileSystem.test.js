import assert from 'assert';
import { ProjectileSystem } from '../src/systems/combat/ProjectileSystem.js';
import { createProjectile, resetProjectile } from '../src/entities/createProjectile.js';

function runTests() {
  console.log('--- ProjectileSystem.test.js ---');

  // Test 1: Boomerang reverse logic
  {
    const proj = createProjectile({
      x: 0, y: 0,
      dirX: 1, dirY: 0,
      speed: 100,
      maxRange: 100,
      behaviorId: 'boomerang',
      angle: 1.2,
    });

    const world = {
      entities: {
        projectiles: [proj],
        player: { x: 0, y: 0 },
      },
      runtime: {
        deltaTime: 0.4, // travel 40
      },
    };

    // 1st update: Distance = 40 (less than 50)
    ProjectileSystem.update({ world });
    assert.strictEqual(proj.x, 40, 'Should move forward by 40');
    assert.strictEqual(proj.distanceTraveled, 40);
    assert.strictEqual(proj._reversed, false);
    assert.strictEqual(proj.angle, 0, '부메랑 진행 방향 각도가 초기 이동 방향과 동기화되지 않음');

    // 2nd update: Distance = 80 (greater than 50, should reverse)
    ProjectileSystem.update({ world });
    // Since we added `p.distanceTraveled = p.maxRange / 2`, it should be 50.
    assert.strictEqual(proj.distanceTraveled, 50);
    assert.strictEqual(proj.x, 80, 'moves forward first, then reverses direction');
    // dirX is updated on the NEXT frame because _reversed is set at the end of this frame
    assert.strictEqual(proj.dirX, 1, 'Direction not yet updated in this frame');
    assert.strictEqual(proj._reversed, true, '_reversed flag should be true');
    assert.strictEqual(proj.angle, 0, '반전 직전 프레임에서 각도가 유지되지 않음');

    // 3rd update: Distance = 30 
    // Currently, proj.x is 80. It needs to move to < 20 to be destroyed by player.
    // Let's give it distance 70 to reach player.
    world.runtime.deltaTime = 0.7; // distance + 70
    ProjectileSystem.update({ world });
    // proj.x becomes 10. distSq = 100 < 400.
    // So it triggers the player catch condition: p.distanceTraveled = p.maxRange.
    // Wait, the catch condition checks before moving next frame. 
    // In THIS frame, p._reversed is true, so it updates direction. 
    // p.x=80, player=0 -> dx=-80, distSq=6400 -> Not < 400. 
    // THEN it moves: x = 80 - 70 = 10.
    // Next frame it will check and see it's caught.
    assert.strictEqual(proj.x, 10);
    assert.ok(Math.abs(proj.angle - Math.PI) < 0.001, '귀환 중 부메랑 각도가 플레이어 방향으로 갱신되지 않음');
    
    // 4th update: Catching the boomerang
    world.runtime.deltaTime = 0.01; 
    ProjectileSystem.update({ world });
    assert.strictEqual(proj.isAlive, false, 'Should be dead (caught by player)');
    assert.strictEqual(proj.pendingDestroy, true);
  }

  // Test 2: Boomerang angle is reset when pooled projectile is reused
  {
    const proj = createProjectile({
      behaviorId: 'boomerang',
      angle: 2.3,
    });
    resetProjectile(proj, {
      behaviorId: 'boomerang',
      dirX: 1,
      dirY: 0,
    });

    assert.strictEqual(proj.angle, 0, '재사용/생성된 부메랑 투사체에 이전 각도가 남아 있음');
  }

  console.log('OK: ProjectileSystem Boomerang Tests Passed');
}

try {
  runTests();
} catch (err) {
  console.error('FAIL: ProjectileSystem.test.js', err);
  process.exit(1);
}
