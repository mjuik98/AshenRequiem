import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';

console.log('\n[PlayContextRuntime]');

const { test, summary } = createRunner('PlayContextRuntime');

let runtimeApi = null;

try {
  runtimeApi = await import('../src/core/playContextRuntime.js');
} catch (error) {
  runtimeApi = { error };
}

function getRuntimeApi() {
  assert.ok(
    !runtimeApi.error,
    runtimeApi.error?.message ?? 'src/core/playContextRuntime.js가 아직 없음',
  );
  return runtimeApi;
}

test('play context runtime helper는 runtime state와 services facade를 제공한다', () => {
  const api = getRuntimeApi();
  assert.equal(typeof api.createPlayContextRuntimeState, 'function', 'createPlayContextRuntimeState helper가 없음');
  assert.equal(typeof api.createPlayContextServices, 'function', 'createPlayContextServices helper가 없음');
});

test('createPlayContextServices는 PlayContext가 노출할 서비스 계약만 조합한다', () => {
  const { createPlayContextServices } = getRuntimeApi();
  const services = createPlayContextServices({
    projectilePool: 'projectiles',
    effectPool: 'effects',
    enemyPool: 'enemies',
    pickupPool: 'pickups',
    soundSystem: 'sound',
    canvas: 'canvas',
    renderer: 'renderer',
    nowSeconds: 'clock',
    bossAnnouncementView: 'boss-view',
    weaponEvolutionView: 'evo-view',
    session: 'should-not-leak',
  });

  assert.deepEqual(services, {
    projectilePool: 'projectiles',
    effectPool: 'effects',
    enemyPool: 'enemies',
    pickupPool: 'pickups',
    soundSystem: 'sound',
    canvas: 'canvas',
    renderer: 'renderer',
    nowSeconds: 'clock',
    bossAnnouncementView: 'boss-view',
    weaponEvolutionView: 'evo-view',
  });
  assert.equal('session' in services, false, 'session이 services에 다시 섞이면 안 됨');
});

test('createPlayContextRuntimeState는 주입된 runtime service를 sound runtime에 전달한다', () => {
  const { createPlayContextRuntimeState } = getRuntimeApi();
  const calls = [];
  const fakeSoundSystem = {
    init() {
      calls.push(['init']);
    },
  };
  const nowSeconds = () => 123;
  const createAudioContext = () => ({ id: 'audio' });

  const state = createPlayContextRuntimeState({
    canvas: { id: 'canvas' },
    renderer: { id: 'renderer' },
    nowSeconds,
    createAudioContext,
    createSoundSystemImpl(options) {
      calls.push(['create-sound', options]);
      return fakeSoundSystem;
    },
  });

  assert.equal(state.nowSeconds, nowSeconds, '주입된 clock service가 runtime state에 보존되지 않음');
  assert.equal(state.soundSystem, fakeSoundSystem, '주입된 sound system factory 결과를 사용하지 않음');
  assert.deepEqual(calls, [
    ['create-sound', {
      nowSeconds,
      createAudioContext,
    }],
    ['init'],
  ]);
});

summary();
