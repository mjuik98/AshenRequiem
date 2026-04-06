import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { readProjectSource } from './helpers/sourceInspection.js';

console.log('\n[TitleLoadoutSceneApplicationService]');

const { test, summary } = createRunner('TitleLoadoutSceneApplicationService');

let serviceModule = null;

try {
  serviceModule = await import('../src/app/title/titleLoadoutSceneApplicationService.js');
} catch (error) {
  serviceModule = { error };
}

function getServiceModule() {
  assert.ok(
    !serviceModule.error,
    serviceModule.error?.message ?? 'src/app/title/titleLoadoutSceneApplicationService.js가 아직 없음',
  );
  return serviceModule;
}

test('title loadout scene application service는 scene-facing loadout handler를 노출한다', () => {
  const source = readProjectSource('../src/app/title/titleLoadoutSceneApplicationService.js');
  const service = getServiceModule();

  assert.equal(typeof service.createTitleLoadoutSceneApplicationService, 'function', 'createTitleLoadoutSceneApplicationService helper가 없음');
  assert.equal(source.includes("from './titleLoadoutApplicationService.js'"), true, 'title loadout scene service가 low-level application service를 사용하지 않음');
  assert.equal(source.includes("from './titleLoadoutQueryService.js'"), true, 'title loadout scene service가 query service를 사용하지 않음');
  assert.equal(source.includes("from '../../scenes/title/titleLoadoutFlow.js'"), false, 'title loadout scene service가 scene helper를 직접 import하면 안 됨');
  assert.equal(source.includes("from '../../ui/title/StartLoadoutView.js'"), false, 'title loadout scene service가 view 구현을 직접 import하면 안 됨');
});

test('title loadout scene application service는 view payload와 시작 콜백을 조립한다', async () => {
  const { createTitleLoadoutSceneApplicationService } = getServiceModule();
  const messages = [];
  const flashes = [];
  const saves = [];
  const transitions = [];
  const shownConfigs = [];

  const service = createTitleLoadoutSceneApplicationService({
    game: {
      gameData: { weaponData: [{ id: 'magic_bolt', isEvolved: false }] },
      session: { meta: { unlockedWeapons: ['magic_bolt'], selectedStartWeaponId: 'magic_bolt' } },
    },
    setMessage: (message) => {
      messages.push(message);
    },
    pulseFlash: () => {
      flashes.push('flash');
    },
    changeScene: (nextScene) => {
      transitions.push(nextScene);
    },
    buildTitleLoadoutConfigImpl: (_gameData, _session, callbacks) => ({
      weapons: [{ id: 'magic_bolt' }],
      selectedWeaponId: 'magic_bolt',
      canStart: true,
      onCancel: callbacks.onCancel,
      onStart: callbacks.onStart,
    }),
    createTitleLoadoutServiceImpl: () => ({
      startRun: (...args) => {
        saves.push(args);
        return { saved: true, selectedWeaponId: 'magic_bolt', nextScene: { id: 'play-scene' } };
      },
    }),
    setTimeoutFn: (callback) => {
      callback();
      return 1;
    },
  });

  const config = service.showLoadoutView({
    show(nextConfig) {
      shownConfigs.push(nextConfig);
    },
  });

  assert.equal(shownConfigs.length, 1, 'scene-facing service가 loadout view.show를 호출하지 않음');
  config.onCancel();
  assert.equal(messages.at(-1), '게임 시작 입력을 기다리는 중입니다.', 'cancel callback이 대기 메시지를 갱신하지 않음');

  config.onStart('magic_bolt', {
    ascensionLevel: 3,
    startAccessoryId: 'ring_of_speed',
    stageId: 'ember_hollow',
  });

  assert.deepEqual(saves, [['magic_bolt', {
    ascensionLevel: 3,
    startAccessoryId: 'ring_of_speed',
    stageId: 'ember_hollow',
  }]], 'scene-facing service가 startRun 인수를 조립하지 않음');
  assert.deepEqual(flashes, ['flash'], 'start 성공 시 pulseFlash가 호출되지 않음');
  assert.equal(messages.at(-1), '씬 전환 중…', 'start 성공 시 transition 메시지가 갱신되지 않음');
  assert.deepEqual(transitions, [{ id: 'play-scene' }], 'start 성공 시 다음 씬 전환이 발생하지 않음');
});

test('title loadout scene application service는 시작 불가 상태와 async scene resolution을 처리한다', async () => {
  const { createTitleLoadoutSceneApplicationService } = getServiceModule();
  const messages = [];
  const saves = [];
  const transitions = [];

  const blockedService = createTitleLoadoutSceneApplicationService({
    game: {
      gameData: { weaponData: [] },
      session: { meta: { unlockedWeapons: ['magic_bolt'], selectedStartWeaponId: 'magic_bolt' } },
    },
    setMessage: (message) => {
      messages.push(message);
    },
    buildTitleLoadoutConfigImpl: (_gameData, _session, callbacks) => ({
      weapons: [],
      selectedWeaponId: null,
      canStart: false,
      onCancel: callbacks.onCancel,
      onStart: callbacks.onStart,
    }),
    createTitleLoadoutServiceImpl: () => ({
      startRun: (...args) => {
        saves.push(args);
        return { saved: false, nextScene: null };
      },
    }),
  });

  const blockedConfig = blockedService.buildViewConfig();
  blockedConfig.onStart('magic_bolt');
  assert.deepEqual(saves, [], '시작 불가 상태에서 startRun이 호출되면 안 됨');
  assert.equal(messages.at(-1), '시작 가능한 기본 무기가 없습니다.', '시작 불가 메시지가 누락됨');

  const asyncService = createTitleLoadoutSceneApplicationService({
    game: {
      gameData: { weaponData: [{ id: 'magic_bolt', isEvolved: false }] },
      session: { meta: { unlockedWeapons: ['magic_bolt'], selectedStartWeaponId: 'magic_bolt' } },
    },
    setMessage: () => {},
    changeScene: (nextScene) => {
      transitions.push(nextScene);
    },
    buildTitleLoadoutConfigImpl: (_gameData, _session, callbacks) => ({
      weapons: [{ id: 'magic_bolt' }],
      selectedWeaponId: 'magic_bolt',
      canStart: true,
      onCancel: callbacks.onCancel,
      onStart: callbacks.onStart,
    }),
    createTitleLoadoutServiceImpl: () => ({
      startRun: () => ({
        saved: true,
        nextScene: Promise.resolve({ id: 'async-play-scene' }),
      }),
    }),
    setTimeoutFn: (callback) => {
      callback();
      return 1;
    },
  });

  asyncService.buildViewConfig().onStart('magic_bolt');
  await Promise.resolve();
  await Promise.resolve();
  assert.deepEqual(transitions, [{ id: 'async-play-scene' }], 'nextScene promise가 resolve된 뒤 씬 전환이 이뤄져야 함');
});

summary();
