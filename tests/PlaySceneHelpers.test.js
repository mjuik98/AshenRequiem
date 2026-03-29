import assert from 'node:assert/strict';
import { makePlayer, makeWorld } from './fixtures/index.js';

console.log('\n[PlaySceneHelpers]');

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed += 1;
  } catch (error) {
    console.error(`  ✗ ${name}`);
    console.error(`    [ERROR] ${error.message}`);
    failed += 1;
  }
}

await test('run state helper는 session 메타 기반 런 상태를 world에 적용한다', async () => {
  const runtime = await import('../src/scenes/play/playSceneRuntime.js');
  const world = makeWorld({ entities: { player: makePlayer() } });
  runtime.applyRunSessionState(world, {
    meta: {
      permanentUpgrades: {
        reroll_charge: 2,
        banish_charge: 1,
      },
    },
  });

  assert.equal(world.progression.runRerollsRemaining, 2);
  assert.equal(world.progression.runBanishesRemaining, 1);
  assert.deepEqual(world.progression.banishedUpgradeIds, []);
  assert.equal(world.progression.levelUpActionMode, 'select');
});

await test('play scene runtime helper는 시작 장비를 generic pending event queue로 큐잉한다', async () => {
  const runtime = await import('../src/scenes/play/playSceneRuntime.js');
  const player = makePlayer({
    weapons: [{ id: 'magic_bolt' }],
    accessories: [{ id: 'iron_heart' }],
  });
  const world = makeWorld({ entities: { player } });

  runtime.queueRunStartEvents(world, player);

  assert.deepEqual(world.progression.pendingEventQueue, [
    { type: 'weaponAcquired', payload: { weaponId: 'magic_bolt' } },
    { type: 'accessoryAcquired', payload: { accessoryId: 'iron_heart' } },
  ]);
  assert.deepEqual(world.queues.events.weaponAcquired, []);
  assert.deepEqual(world.queues.events.accessoryAcquired, []);
});

await test('play scene runtime helper는 초기 world state 생성 계약을 제공한다', async () => {
  const bootstrap = await import('../src/scenes/play/playSceneBootstrap.js');
  const world = bootstrap.createPlaySceneWorldState({
    session: {
      meta: {
        permanentUpgrades: {
          reroll_charge: 1,
          banish_charge: 2,
        },
      },
    },
    gameData: {
      weaponData: [
        { id: 'magic_bolt', damage: 10, cooldown: 1, behaviorId: 'targetProjectile', isEvolved: false },
      ],
    },
  });

  assert.equal(Boolean(world.entities.player), true, 'bootstrap helper가 player를 생성하지 않음');
  assert.equal(world.progression.runRerollsRemaining, 1);
  assert.equal(world.progression.runBanishesRemaining, 2);
  assert.deepEqual(world.progression.pendingEventQueue?.[0], { type: 'weaponAcquired', payload: { weaponId: world.entities.player.weapons[0]?.id } }, '시작 무기 이벤트가 generic queue에 적재되지 않음');
});

await test('pause overlay helper는 resume/forfeit 콜백을 구성한다', async () => {
  const overlays = await import('../src/scenes/play/playSceneOverlays.js');
  const world = makeWorld({ run: { playMode: 'playing' } });
  const transitions = [];
  let pauseHidden = 0;
  let pausePressConsumed = 0;

  const config = overlays.createPauseOverlayConfig({
    world,
    data: { weaponData: [] },
    session: { meta: {} },
    isBlocked: () => false,
    transitionPlayMode: (_, mode) => {
      transitions.push(mode);
      world.run.playMode = mode;
    },
    hidePause: () => {
      pauseHidden += 1;
    },
    consumePausePress: () => {
      pausePressConsumed += 1;
    },
    onOptionsChange: () => {},
  });

  config.onResume();
  assert.equal(pausePressConsumed, 1);
  assert.equal(transitions.at(-1), 'playing');
  assert.equal(pauseHidden, 1);

  config.onForfeit();
  assert.equal(world.run.runOutcome.type, 'defeat');
  assert.equal(transitions.at(-1), 'dead');
});

await test('result action helper는 blocked 상태에서 중복 씬 전환을 막는다', async () => {
  const overlays = await import('../src/scenes/play/playSceneOverlays.js');
  const changedScenes = [];
  let blocked = false;

  const actions = overlays.createResultSceneActions({
    isBlocked: () => blocked,
    setBlocked: (value) => {
      blocked = value;
    },
    restart: () => changedScenes.push('restart'),
    goToTitle: () => changedScenes.push('title'),
  });

  actions.onRestart();
  actions.onTitle();

  assert.deepEqual(changedScenes, ['restart']);
  assert.equal(blocked, true);
});

console.log(`\nPlaySceneHelpers: ${passed}개 통과, ${failed}개 실패`);
if (failed > 0) process.exit(1);
