import assert from 'node:assert/strict';
import { makeEnemy, makePlayer, makeProjectile } from './fixtures/index.js';
import { createRunner } from './helpers/testRunner.js';

const { test, summary } = createRunner('최종 결과');

let getRegisteredBehaviorIds;
let getWeaponDataById;
let laserBeam;
let groundZone;
let ricochetProjectile;
let boomerang;
let ProjectileSystem;

try {
  ({ getRegisteredBehaviorIds } = await import('../src/behaviors/weaponBehaviorRegistry.js'));
  ({ getWeaponDataById } = await import('../src/data/weaponDataHelpers.js'));
  ({ laserBeam } = await import('../src/behaviors/weaponBehaviors/laserBeam.js'));
  ({ groundZone } = await import('../src/behaviors/weaponBehaviors/groundZone.js'));
  ({ ricochetProjectile } = await import('../src/behaviors/weaponBehaviors/ricochetProjectile.js'));
  ({ boomerang } = await import('../src/behaviors/weaponBehaviors/boomerangWeapon.js'));
  ({ ProjectileSystem } = await import('../src/systems/combat/ProjectileSystem.js'));
} catch (error) {
  console.warn('[테스트] 신규 무기 behavior import 실패:', error.message);
  process.exit(1);
}

console.log('\n[WeaponBehaviorExpansion]');

test('신규 weapon behavior가 레지스트리에 등록된다', () => {
  const ids = getRegisteredBehaviorIds();
  assert.equal(ids.has('laserBeam'), true, 'laserBeam 미등록');
  assert.equal(ids.has('groundZone'), true, 'groundZone 미등록');
  assert.equal(ids.has('ricochetProjectile'), true, 'ricochetProjectile 미등록');
});

test('신규 무기 6종이 의도한 behavior와 maxLevel 7을 가진다', () => {
  const expectations = [
    ['solar_ray', 'laserBeam'],
    ['piercing_spear', 'targetProjectile'],
    ['flame_zone', 'groundZone'],
    ['venom_bog', 'groundZone'],
    ['crystal_shard', 'ricochetProjectile'],
    ['radiant_orb', 'ricochetProjectile'],
  ];
  for (const [weaponId, behaviorId] of expectations) {
    const weapon = getWeaponDataById(weaponId);
    assert.ok(weapon, `${weaponId} 데이터 없음`);
    assert.equal(weapon.behaviorId, behaviorId, `${weaponId} behaviorId 불일치`);
    assert.equal(weapon.maxLevel, 7, `${weaponId} maxLevel이 7이 아님`);
  }
});

test('laserBeam은 직선 구간을 따라 복수의 beam segment를 생성한다', () => {
  const player = makePlayer({ x: 0, y: 0, bonusProjectileCount: 3 });
  const enemies = [makeEnemy({ x: 120, y: 0 })];
  const spawnQueue = [];
  const weapon = {
    id: 'solar_ray',
    behaviorId: 'laserBeam',
    damage: 5,
    range: 320,
    radius: 14,
    beamLength: 240,
    beamSegments: 4,
    beamLifetime: 0.12,
    projectileColor: '#ffd166',
  };

  const fired = laserBeam({ weapon, player, enemies, spawnQueue });
  assert.equal(fired, true, 'laserBeam 발동 실패');
  assert.equal(spawnQueue.length, 4, `beam segment 수 불일치 (실제: ${spawnQueue.length})`);
  assert.equal(spawnQueue.every((item) => item.config.behaviorId === 'laserBeam'), true, 'laserBeam segment behaviorId 불일치');
  assert.equal(spawnQueue.length, weapon.beamSegments, 'laserBeam이 bonusProjectileCount에 의해 segment 수가 바뀌면 안 됨');
});

test('groundZone는 지속시간과 tick interval을 가진 장판을 생성한다', () => {
  const player = makePlayer({ x: 0, y: 0 });
  const enemies = [makeEnemy({ x: 80, y: 40 })];
  const spawnQueue = [];
  const weapon = {
    id: 'flame_zone',
    behaviorId: 'groundZone',
    damage: 3,
    range: 260,
    radius: 42,
    zoneDuration: 1.8,
    zoneTickInterval: 0.35,
    projectileColor: '#ff7043',
  };

  const fired = groundZone({ weapon, player, enemies, spawnQueue });
  assert.equal(fired, true, 'groundZone 발동 실패');
  assert.equal(spawnQueue.length, 1, '장판 spawn 수가 1이 아님');
  assert.equal(spawnQueue[0].config.behaviorId, 'groundZone', 'groundZone behaviorId 불일치');
  assert.equal(spawnQueue[0].config.tickInterval, 0.35, '장판 tickInterval 누락');
});

test('ricochetProjectile은 bounceRemaining을 가진 투사체를 생성한다', () => {
  const player = makePlayer({ x: 0, y: 0 });
  const enemies = [makeEnemy({ x: 140, y: 10 })];
  const spawnQueue = [];
  const weapon = {
    id: 'crystal_shard',
    behaviorId: 'ricochetProjectile',
    damage: 6,
    range: 360,
    radius: 6,
    projectileSpeed: 320,
    bounceCount: 3,
    projectileColor: '#8ecae6',
  };

  const fired = ricochetProjectile({ weapon, player, enemies, spawnQueue });
  assert.equal(fired, true, 'ricochetProjectile 발동 실패');
  assert.equal(spawnQueue.length, 1, '반사 투사체 spawn 수가 1이 아님');
  assert.equal(spawnQueue[0].config.behaviorId, 'ricochetProjectile', 'ricochet behaviorId 불일치');
  assert.equal(spawnQueue[0].config.bounceRemaining, 3, 'bounceRemaining 누락');
});

test('boomerang은 weapon.projectileCount 만큼 동시 투척한다', () => {
  const player = makePlayer({ x: 0, y: 0, bonusProjectileCount: 0 });
  const enemies = [makeEnemy({ x: 140, y: 10 })];
  const spawnQueue = [];
  const weapon = {
    id: 'boomerang',
    behaviorId: 'boomerang',
    damage: 8,
    range: 360,
    radius: 10,
    projectileSpeed: 280,
    projectileCount: 3,
    maxRange: 600,
    projectileColor: '#ffd54f',
  };

  const fired = boomerang({ weapon, player, enemies, spawnQueue });
  assert.equal(fired, true, 'boomerang 발동 실패');
  assert.equal(spawnQueue.length, 3, `boomerang 동시 투척 수 불일치 (실제: ${spawnQueue.length})`);
});

test('groundZone 투사체는 tick interval마다 hitTargets를 초기화한다', () => {
  const projectile = makeProjectile({
    behaviorId: 'groundZone',
    hitCount: 3,
    pierce: 999,
    tickInterval: 0.3,
    tickTimer: 0.29,
    maxLifetime: 1.5,
    lifetime: 0.4,
  });
  projectile.hitTargets.add('enemy_a');

  ProjectileSystem.update({
    world: {
      projectiles: [projectile],
      player: makePlayer(),
      enemies: [],
      deltaTime: 0.02,
    },
  });

  assert.equal(projectile.hitTargets.size, 0, 'groundZone hitTargets가 초기화되지 않음');
  assert.equal(projectile.hitCount, 0, 'groundZone hitCount가 초기화되지 않음');
});

test('ricochetProjectile은 적 명중 후 다음 적 방향으로 재조준한다', () => {
  const enemyA = makeEnemy({ id: 'enemy_a', x: 50, y: 0 });
  const enemyB = makeEnemy({ id: 'enemy_b', x: 120, y: 40 });
  const projectile = makeProjectile({
    x: 40,
    y: 0,
    dirX: 1,
    dirY: 0,
    speed: 300,
    behaviorId: 'ricochetProjectile',
    bounceRemaining: 2,
    hitCount: 1,
    _lastRicochetHitCount: 0,
  });
  projectile.hitTargets.add('enemy_a');

  ProjectileSystem.update({
    world: {
      projectiles: [projectile],
      player: makePlayer(),
      enemies: [enemyA, enemyB],
      deltaTime: 0.016,
    },
  });

  assert.equal(projectile.bounceRemaining, 1, '명중 후 bounceRemaining이 감소하지 않음');
  assert.notEqual(projectile.dirY, 0, '다음 적 방향으로 재조준되지 않음');
});

summary();
