import assert from 'node:assert/strict';
import { makeEnemy, makePlayer, makeProjectile, makeWorld } from './fixtures/index.js';
import { createRunner } from './helpers/testRunner.js';

const { test, summary } = createRunner('최종 결과');

let getRegisteredBehaviorIds;
let getWeaponDataById;
let laserBeam;
let groundZone;
let targetProjectile;
let ricochetProjectile;
let boomerang;
let omnidirectional;
let ProjectileSystem;
let createCollisionSystem;

try {
  ({ getRegisteredBehaviorIds } = await import('../src/behaviors/weaponBehaviorRegistry.js'));
  ({ getWeaponDataById } = await import('../src/data/weaponDataHelpers.js'));
  ({ laserBeam } = await import('../src/behaviors/weaponBehaviors/laserBeam.js'));
  ({ groundZone } = await import('../src/behaviors/weaponBehaviors/groundZone.js'));
  ({ targetProjectile } = await import('../src/behaviors/weaponBehaviors/targetProjectile.js'));
  ({ ricochetProjectile } = await import('../src/behaviors/weaponBehaviors/ricochetProjectile.js'));
  ({ boomerang } = await import('../src/behaviors/weaponBehaviors/boomerangWeapon.js'));
  ({ omnidirectional } = await import('../src/behaviors/weaponBehaviors/omnidirectional.js'));
  ({ ProjectileSystem } = await import('../src/systems/combat/ProjectileSystem.js'));
  ({ createCollisionSystem } = await import('../src/systems/combat/CollisionSystem.js'));
} catch (error) {
  console.warn('[테스트] 신규 무기 behavior import 실패:', error.message);
  process.exit(1);
}

console.log('\n[WeaponBehaviorExpansion]');

function distanceFromRayToTarget(projectileConfig, player, target) {
  const dx = projectileConfig.dirX ?? 0;
  const dy = projectileConfig.dirY ?? 0;
  const px = target.x - player.x;
  const py = target.y - player.y;
  const cross = Math.abs(px * dy - py * dx);
  return cross / (Math.hypot(dx, dy) || 1);
}

function staysWithinHitRadius(projectileConfig, player, target) {
  return distanceFromRayToTarget(projectileConfig, player, target)
    <= (target.radius ?? 0) + (projectileConfig.radius ?? 0);
}

function runUntilHit(projectileConfigs, player, target, maxSteps = 120) {
  const collisionSystem = createCollisionSystem();
  const projectiles = projectileConfigs.map((config) => makeProjectile(config));
  const world = makeWorld({
    entities: {
      player,
      enemies: [target],
      projectiles,
      pickups: [],
    },
    presentation: {
      camera: { x: -320, y: -240, width: 1280, height: 720 },
    },
    runtime: {
      deltaTime: 0.016,
    },
  });

  for (let step = 0; step < maxSteps; step++) {
    ProjectileSystem.update({ world });
    collisionSystem.update({ world });
    if (world.queues.events.hits.length > 0) {
      return world.queues.events.hits;
    }
  }

  return world.queues.events.hits;
}

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

test('piercing_spear와 astral_pike는 sprite projectile/effect 식별자를 노출한다', () => {
  const piercingSpear = getWeaponDataById('piercing_spear');
  const astralPike = getWeaponDataById('astral_pike');

  assert.equal(piercingSpear?.projectileVisualId, 'fire_bolt', 'piercing_spear projectileVisualId 불일치');
  assert.equal(piercingSpear?.impactEffectType, 'fire_bolt_impact', 'piercing_spear impactEffectType 불일치');
  assert.equal(astralPike?.projectileVisualId, 'fire_bolt_upgrade', 'astral_pike projectileVisualId 불일치');
  assert.equal(astralPike?.impactEffectType, 'fire_bolt_upgrade_impact', 'astral_pike impactEffectType 불일치');
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
  assert.deepEqual(
    spawnQueue[0].config.behaviorState,
    { ricochetHitCount: 0 },
    'ricochetProjectile이 명시 behaviorState를 초기화하지 않음',
  );
});

test('targetProjectile은 짝수 발사 수여도 모든 투사체가 타겟 반경 안을 지나간다', () => {
  const player = makePlayer({ x: 0, y: 0, bonusProjectileCount: 0 });
  const target = makeEnemy({ x: 320, y: 0, radius: 6 });
  const spawnQueue = [];
  const weapon = {
    id: 'piercing_spear',
    behaviorId: 'targetProjectile',
    damage: 9,
    range: 540,
    radius: 7,
    projectileSpeed: 440,
    projectileCount: 2,
    aimSpread: 0.2,
    projectileColor: '#d4a373',
  };

  const fired = targetProjectile({ weapon, player, enemies: [target], spawnQueue });
  assert.equal(fired, true, 'targetProjectile 발동 실패');
  assert.equal(spawnQueue.length, 2, '짝수 발사 spawn 수 불일치');
  assert.equal(
    spawnQueue.every(({ config }) => staysWithinHitRadius(config, player, target)),
    true,
    '짝수 발사 투사체가 타겟 반경을 벗어남',
  );
});

test('targetProjectile은 플레이어와 타겟이 겹치면 facing 방향 기반의 유효한 방향으로 발사한다', () => {
  const player = makePlayer({ x: 0, y: 0, facingX: 0, facingY: -1, bonusProjectileCount: 0 });
  const target = makeEnemy({ x: 0, y: 0, radius: 12 });
  const spawnQueue = [];
  const weapon = {
    id: 'magic_bolt',
    behaviorId: 'targetProjectile',
    damage: 4,
    range: 240,
    radius: 5,
    projectileSpeed: 350,
    projectileCount: 2,
  };

  const fired = targetProjectile({ weapon, player, enemies: [target], spawnQueue });
  assert.equal(fired, true, '겹침 상태에서 targetProjectile 발동 실패');
  assert.equal(
    spawnQueue.every(({ config }) => Number.isFinite(config.dirX) && Number.isFinite(config.dirY)),
    true,
    '겹침 상태에서 유효하지 않은 방향 벡터 생성',
  );
  assert.equal(
    spawnQueue.every(({ config }) => Math.hypot(config.dirX, config.dirY) > 0.9),
    true,
    '겹침 상태에서 0 벡터에 가까운 방향 생성',
  );
  assert.equal(
    spawnQueue.every(({ config }) => config.dirY < -0.5),
    true,
    '겹침 상태에서 facing 방향을 따르지 않음',
  );
});

test('magic_bolt은 targetProjectile spawn에 projectileVisualId와 impact effect ids를 실어 보낸다', () => {
  const player = makePlayer({ x: 0, y: 0, bonusProjectileCount: 0 });
  const target = makeEnemy({ x: 240, y: 0, radius: 12 });
  const spawnQueue = [];
  const weapon = {
    id: 'magic_bolt',
    behaviorId: 'targetProjectile',
    damage: 4,
    range: 320,
    radius: 5,
    projectileSpeed: 350,
    projectileCount: 1,
    projectileVisualId: 'magic_bolt',
    impactEffectType: 'magic_bolt_impact',
    impactEffectVisualId: 'magic_bolt_impact',
  };

  const fired = targetProjectile({ weapon, player, enemies: [target], spawnQueue });
  assert.equal(fired, true, 'magic_bolt targetProjectile 발동 실패');
  assert.equal(spawnQueue.length, 1, 'magic_bolt spawn 수 불일치');
  assert.equal(spawnQueue[0].config.projectileVisualId, 'magic_bolt', 'magic_bolt projectileVisualId 누락');
  assert.equal(spawnQueue[0].config.impactEffectType, 'magic_bolt_impact', 'magic_bolt impactEffectType 누락');
  assert.equal(spawnQueue[0].config.impactEffectVisualId, 'magic_bolt_impact', 'magic_bolt impactEffectVisualId 누락');
});

test('holy/ice bolt 계열 4종은 targetProjectile 기반의 시각/진화 계약을 가진다', () => {
  const expectations = [
    ['holy_bolt', { projectileVisualId: 'holy_bolt', impactEffectType: 'holy_bolt_impact', impactEffectVisualId: 'holy_bolt_impact', isEvolved: false }],
    ['holy_bolt_upgrade', { projectileVisualId: 'holy_bolt_upgrade', impactEffectType: 'holy_bolt_upgrade_impact', impactEffectVisualId: 'holy_bolt_upgrade_impact', isEvolved: true }],
    ['ice_bolt', { projectileVisualId: 'ice_bolt', impactEffectType: 'ice_bolt_impact', impactEffectVisualId: 'ice_bolt_impact', statusEffectId: 'slow', isEvolved: false }],
    ['ice_bolt_upgrade', {
      projectileVisualId: 'ice_bolt_upgrade',
      impactEffectType: 'ice_bolt_upgrade_impact',
      impactEffectVisualId: 'ice_bolt_upgrade_impact',
      statusEffectId: 'slow',
      impactBurstRadius: 96,
      isEvolved: true,
    }],
  ];

  for (const [weaponId, expected] of expectations) {
    const weapon = getWeaponDataById(weaponId);
    assert.ok(weapon, `${weaponId} 데이터 없음`);
    assert.equal(weapon.behaviorId, 'targetProjectile', `${weaponId} behaviorId가 targetProjectile이 아님`);
    assert.equal(weapon.projectileVisualId, expected.projectileVisualId, `${weaponId} projectileVisualId 불일치`);
    assert.equal(weapon.impactEffectType, expected.impactEffectType, `${weaponId} impactEffectType 불일치`);
    assert.equal(weapon.impactEffectVisualId, expected.impactEffectVisualId, `${weaponId} impactEffectVisualId 불일치`);
    assert.equal(weapon.isEvolved ?? false, expected.isEvolved, `${weaponId} isEvolved 불일치`);
    if (expected.statusEffectId) {
      assert.equal(weapon.statusEffectId, expected.statusEffectId, `${weaponId} statusEffectId 불일치`);
    }
    if (expected.impactBurstRadius) {
      assert.equal(weapon.impactBurst?.radius, expected.impactBurstRadius, `${weaponId} impactBurst 반경 누락`);
      assert.equal(weapon.impactBurst?.excludePrimaryTarget, true, `${weaponId} impactBurst primary target 제외 누락`);
    }
  }
});

test('ice_bolt_upgrade는 targetProjectile spawn에 impactBurst 계약을 실어 보낸다', () => {
  const player = makePlayer({ x: 0, y: 0, bonusProjectileCount: 0 });
  const target = makeEnemy({ x: 240, y: 0, radius: 12 });
  const spawnQueue = [];
  const weapon = {
    id: 'ice_bolt_upgrade',
    behaviorId: 'targetProjectile',
    damage: 5,
    range: 420,
    radius: 7,
    projectileSpeed: 380,
    projectileCount: 1,
    projectileVisualId: 'ice_bolt_upgrade',
    impactEffectType: 'ice_bolt_upgrade_impact',
    impactEffectVisualId: 'ice_bolt_upgrade_impact',
    statusEffectId: 'slow',
    statusEffectChance: 1.0,
    impactBurst: {
      radius: 96,
      damage: 2,
      statusEffectId: 'slow',
      statusEffectChance: 1.0,
      excludePrimaryTarget: true,
    },
  };

  const fired = targetProjectile({ weapon, player, enemies: [target], spawnQueue });
  assert.equal(fired, true, 'ice_bolt_upgrade targetProjectile 발동 실패');
  assert.equal(spawnQueue.length, 1, 'ice_bolt_upgrade spawn 수 불일치');
  assert.deepEqual(
    spawnQueue[0].config.impactBurst,
    {
      radius: 96,
      damage: 2,
      statusEffectId: 'slow',
      statusEffectChance: 1.0,
      excludePrimaryTarget: true,
    },
    'ice_bolt_upgrade impactBurst 계약 누락',
  );
  assert.equal(
    spawnQueue[0].config.impactEffectVisualId,
    'ice_bolt_upgrade_impact',
    'ice_bolt_upgrade impactEffectVisualId 계약 누락',
  );
});

test('piercing_spear는 targetProjectile spawn에 fire_bolt sprite ids를 실어 보낸다', () => {
  const player = makePlayer({ x: 0, y: 0, bonusProjectileCount: 0 });
  const target = makeEnemy({ x: 240, y: 0, radius: 12 });
  const spawnQueue = [];
  const weapon = {
    id: 'piercing_spear',
    behaviorId: 'targetProjectile',
    damage: 9,
    range: 540,
    radius: 7,
    projectileSpeed: 440,
    projectileCount: 1,
    projectileVisualId: 'fire_bolt',
    impactEffectType: 'fire_bolt_impact',
    impactEffectVisualId: 'fire_bolt_impact',
  };

  const fired = targetProjectile({ weapon, player, enemies: [target], spawnQueue });
  assert.equal(fired, true, 'piercing_spear targetProjectile 발동 실패');
  assert.equal(spawnQueue.length, 1, 'piercing_spear spawn 수 불일치');
  assert.equal(spawnQueue[0].config.projectileVisualId, 'fire_bolt', 'piercing_spear projectileVisualId 누락');
  assert.equal(spawnQueue[0].config.impactEffectType, 'fire_bolt_impact', 'piercing_spear impactEffectType 누락');
  assert.equal(spawnQueue[0].config.impactEffectVisualId, 'fire_bolt_impact', 'piercing_spear impactEffectVisualId 누락');
});

test('targetProjectile은 aimPattern=wide-spread 일 때 기존 팬 아웃을 유지한다', () => {
  const player = makePlayer({ x: 0, y: 0, bonusProjectileCount: 0 });
  const target = makeEnemy({ x: 320, y: 0, radius: 6 });
  const spawnQueue = [];
  const weapon = {
    id: 'astral_pike',
    behaviorId: 'targetProjectile',
    damage: 14,
    range: 640,
    radius: 9,
    projectileSpeed: 520,
    projectileCount: 2,
    aimPattern: 'wide-spread',
    aimSpread: 0.2,
    projectileColor: '#f4a261',
  };

  const fired = targetProjectile({ weapon, player, enemies: [target], spawnQueue });
  assert.equal(fired, true, 'wide-spread targetProjectile 발동 실패');
  assert.equal(spawnQueue.length, 2, 'wide-spread spawn 수 불일치');
  assert.equal(
    spawnQueue.some(({ config }) => !staysWithinHitRadius(config, player, target)),
    true,
    'wide-spread가 짝수 발사에서도 강제 명중 형태로 압축됨',
  );
});

test('targetProjectile의 guaranteed-hit 짝수 발사는 실제 충돌 시스템에서도 hit 이벤트를 만든다', () => {
  const player = makePlayer({ x: 0, y: 0, bonusProjectileCount: 0 });
  const target = makeEnemy({ x: 160, y: 0, radius: 6 });
  const spawnQueue = [];
  const weapon = {
    id: 'magic_bolt',
    behaviorId: 'targetProjectile',
    damage: 4,
    range: 320,
    radius: 5,
    projectileSpeed: 350,
    projectileCount: 2,
  };

  const fired = targetProjectile({ weapon, player, enemies: [target], spawnQueue });
  assert.equal(fired, true, 'guaranteed-hit targetProjectile 발동 실패');

  const hits = runUntilHit(
    spawnQueue.map(({ config }) => config),
    player,
    target,
  );

  assert.equal(hits.length >= 1, true, '실제 충돌 시스템에서 hit 이벤트가 발생하지 않음');
});

test('arcane_nova의 omnidirectional 투사체는 projectileVisualId와 impact effect ids를 유지한다', () => {
  const player = makePlayer({ x: 32, y: 48, bonusProjectileCount: 0 });
  const spawnQueue = [];
  const weapon = {
    id: 'arcane_nova',
    behaviorId: 'omnidirectional',
    damage: 8,
    projectileSpeed: 340,
    range: 460,
    radius: 7,
    pierce: 2,
    projectileCount: 8,
    projectileColor: '#e040fb',
    projectileVisualId: 'arcane_nova',
    impactEffectType: 'arcane_nova_impact',
    impactEffectVisualId: 'arcane_nova_impact',
  };

  const fired = omnidirectional({ weapon, player, spawnQueue });
  assert.equal(fired, true, 'arcane_nova omnidirectional 발동 실패');
  assert.equal(spawnQueue.length, 8, 'arcane_nova spawn 수 불일치');
  assert.equal(
    spawnQueue.every(({ config }) => config.projectileVisualId === 'arcane_nova'),
    true,
    'arcane_nova projectileVisualId가 모든 투사체에 유지되지 않음',
  );
  assert.equal(
    spawnQueue.every(({ config }) => config.impactEffectType === 'arcane_nova_impact'),
    true,
    'arcane_nova impactEffectType가 모든 투사체에 유지되지 않음',
  );
  assert.equal(
    spawnQueue.every(({ config }) => config.impactEffectVisualId === 'arcane_nova_impact'),
    true,
    'arcane_nova impactEffectVisualId가 모든 투사체에 유지되지 않음',
  );
});

test('astral_pike의 targetProjectile 투사체는 fire_bolt_upgrade sprite ids를 유지한다', () => {
  const player = makePlayer({ x: 32, y: 48, bonusProjectileCount: 0 });
  const target = makeEnemy({ x: 320, y: 0, radius: 8 });
  const spawnQueue = [];
  const weapon = {
    id: 'astral_pike',
    behaviorId: 'targetProjectile',
    damage: 14,
    projectileSpeed: 520,
    range: 640,
    radius: 9,
    pierce: 7,
    aimPattern: 'wide-spread',
    aimSpread: 0.06,
    projectileCount: 2,
    projectileColor: '#f4a261',
    projectileVisualId: 'fire_bolt_upgrade',
    impactEffectType: 'fire_bolt_upgrade_impact',
    impactEffectVisualId: 'fire_bolt_upgrade_impact',
  };

  const fired = targetProjectile({ weapon, player, enemies: [target], spawnQueue });
  assert.equal(fired, true, 'astral_pike targetProjectile 발동 실패');
  assert.equal(spawnQueue.length, 2, 'astral_pike spawn 수 불일치');
  assert.equal(
    spawnQueue.every(({ config }) => config.projectileVisualId === 'fire_bolt_upgrade'),
    true,
    'astral_pike projectileVisualId가 모든 투사체에 유지되지 않음',
  );
  assert.equal(
    spawnQueue.every(({ config }) => config.impactEffectType === 'fire_bolt_upgrade_impact'),
    true,
    'astral_pike impactEffectType가 모든 투사체에 유지되지 않음',
  );
  assert.equal(
    spawnQueue.every(({ config }) => config.impactEffectVisualId === 'fire_bolt_upgrade_impact'),
    true,
    'astral_pike impactEffectVisualId가 모든 투사체에 유지되지 않음',
  );
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
  assert.equal(
    spawnQueue.every(({ config }) => JSON.stringify(config.behaviorState) === JSON.stringify({ reversed: false })),
    true,
    'boomerang이 명시 behaviorState를 초기화하지 않음',
  );
});

test('boomerang은 짝수 발사 수여도 모든 투사체가 타겟 반경 안을 지나간다', () => {
  const player = makePlayer({ x: 0, y: 0, bonusProjectileCount: 0 });
  const target = makeEnemy({ x: 320, y: 0, radius: 6 });
  const spawnQueue = [];
  const weapon = {
    id: 'boomerang',
    behaviorId: 'boomerang',
    damage: 8,
    range: 360,
    radius: 10,
    projectileSpeed: 280,
    projectileCount: 2,
    maxRange: 600,
    projectileColor: '#ffd54f',
  };

  const fired = boomerang({ weapon, player, enemies: [target], spawnQueue });
  assert.equal(fired, true, 'boomerang 발동 실패');
  assert.equal(spawnQueue.length, 2, '짝수 boomerang spawn 수 불일치');
  assert.equal(
    spawnQueue.every(({ config }) => staysWithinHitRadius(config, player, target)),
    true,
    '짝수 boomerang 투사체가 타겟 반경을 벗어남',
  );
});

test('ricochetProjectile은 짝수 발사 수여도 모든 투사체가 타겟 반경 안을 지나간다', () => {
  const player = makePlayer({ x: 0, y: 0, bonusProjectileCount: 0 });
  const target = makeEnemy({ x: 320, y: 0, radius: 6 });
  const spawnQueue = [];
  const weapon = {
    id: 'prism_volley',
    behaviorId: 'ricochetProjectile',
    damage: 8,
    range: 440,
    radius: 7,
    projectileSpeed: 360,
    projectileCount: 2,
    aimSpread: 0.2,
    bounceCount: 5,
    projectileColor: '#90caf9',
  };

  const fired = ricochetProjectile({ weapon, player, enemies: [target], spawnQueue });
  assert.equal(fired, true, 'ricochetProjectile 발동 실패');
  assert.equal(spawnQueue.length, 2, '짝수 ricochet spawn 수 불일치');
  assert.equal(
    spawnQueue.every(({ config }) => staysWithinHitRadius(config, player, target)),
    true,
    '짝수 ricochet 투사체가 타겟 반경을 벗어남',
  );
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
      entities: {
        projectiles: [projectile],
        player: makePlayer(),
        enemies: [],
      },
      runtime: {
        deltaTime: 0.02,
      },
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
    behaviorState: { ricochetHitCount: 0 },
  });
  projectile.hitTargets.add('enemy_a');

  ProjectileSystem.update({
    world: {
      entities: {
        projectiles: [projectile],
        player: makePlayer(),
        enemies: [enemyA, enemyB],
      },
      runtime: {
        deltaTime: 0.016,
      },
    },
  });

  assert.equal(projectile.bounceRemaining, 1, '명중 후 bounceRemaining이 감소하지 않음');
  assert.deepEqual(projectile.behaviorState, { ricochetHitCount: 1 }, 'ricochetProjectile이 명시 behaviorState를 갱신하지 않음');
  assert.notEqual(projectile.dirY, 0, '다음 적 방향으로 재조준되지 않음');
});

summary();
