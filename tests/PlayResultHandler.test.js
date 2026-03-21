import assert from 'node:assert/strict';
import { makePlayer, makeSessionState, makeWorld } from './fixtures/index.js';
import { test, summary } from './helpers/testRunner.js';
import { PlayResultHandler } from '../src/scenes/play/PlayResultHandler.js';

console.log('\n[PlayResultHandler]');

test('런 종료 시 신규 해금을 세션 메타에 반영한다', () => {
  const session = makeSessionState({
    meta: {
      enemyKills: { zombie: 1200, skeleton: 400 },
      killedBosses: ['boss_lich', 'boss_warden'],
      weaponsUsedAll: ['magic_bolt', 'holy_aura', 'boomerang'],
      evolvedWeapons: ['arcane_nova'],
      unlockedWeapons: ['magic_bolt'],
      unlockedAccessories: [],
      completedUnlocks: [],
      currency: 0,
    },
  });
  const world = makeWorld({
    killCount: 42,
    elapsedTime: 650,
    runOutcome: { type: 'victory' },
    player: makePlayer({
      level: 7,
      weapons: [
        { id: 'magic_bolt', level: 3, currentCooldown: 0 },
        { id: 'holy_aura', level: 1, currentCooldown: 0 },
      ],
    }),
  });

  const handler = new PlayResultHandler(session);
  const result = handler.process(world);

  assert.deepEqual(
    session.meta.completedUnlocks.sort(),
    [
      'unlock_arcane_prism',
      'unlock_boomerang',
      'unlock_chain_lightning',
      'unlock_coin_pendant',
      'unlock_crystal_shard',
      'unlock_flame_zone',
      'unlock_lightning_ring',
      'unlock_persistence_charm',
      'unlock_piercing_spear',
      'unlock_solar_ray',
      'unlock_wind_crystal',
    ].sort(),
    '달성한 해금 ID가 세션에 반영되지 않음',
  );
  assert.deepEqual(
    session.meta.unlockedWeapons.sort(),
    [
      'magic_bolt',
      'boomerang',
      'lightning_ring',
      'chain_lightning',
      'solar_ray',
      'piercing_spear',
      'flame_zone',
      'crystal_shard',
    ].sort(),
    '무기 해금 보상이 세션에 반영되지 않음',
  );
  assert.deepEqual(
    session.meta.unlockedAccessories.sort(),
    ['arcane_prism', 'coin_pendant', 'persistence_charm', 'wind_crystal'].sort(),
    '장신구 해금 보상이 세션에 반영되지 않음',
  );
  assert.equal(result.outcome, 'victory', '런 결과 반환값이 유지되지 않음');
  assert.equal(session.last.kills, 42, '기존 결과 저장 경로가 끊김');
});

summary();
