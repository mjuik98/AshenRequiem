import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { readProjectSource } from './helpers/sourceInspection.js';

console.log('\n[TitleSceneApplicationService]');

const { test, summary } = createRunner('TitleSceneApplicationService');

let serviceModule = null;

try {
  serviceModule = await import('../src/app/title/titleSceneApplicationService.js');
} catch (error) {
  serviceModule = { error };
}

function getServiceModule() {
  assert.ok(
    !serviceModule.error,
    serviceModule.error?.message ?? 'src/app/title/titleSceneApplicationService.js가 아직 없음',
  );
  return serviceModule;
}

test('title scene application service는 scene-facing title action handler를 노출한다', () => {
  const source = readProjectSource('../src/app/title/titleSceneApplicationService.js');
  const service = getServiceModule();

  assert.equal(typeof service.createTitleSceneApplicationService, 'function', 'createTitleSceneApplicationService helper가 없음');
  assert.equal(source.includes("from '../../utils/runtimeIssue.js'"), true, 'title scene application service가 shared runtime issue helper를 사용하지 않음');
  assert.equal(source.includes("from '../../utils/runtimeLogger.js'"), true, 'title scene application service가 shared runtime logger를 사용하지 않음');
  assert.equal(source.includes("from '../../scenes/title/titleSceneStatus.js'"), false, 'title scene application service가 scene runtime helper를 직접 import하면 안 됨');
  assert.equal(source.includes("from '../../scenes/title/titleSceneRuntimeState.js'"), false, 'title scene application service가 scene runtime state에 직접 결합하면 안 됨');
});

test('title scene application service는 title 액션 orchestration을 scene 경계에서 조립한다', async () => {
  const { createTitleSceneApplicationService } = getServiceModule();
  const messages = [];
  const flashes = [];
  const transitions = [];
  const closeCalls = [];
  const errors = [];
  const warns = [];

  const service = createTitleSceneApplicationService({
    pulseFlash: () => {
      flashes.push('flash');
    },
    setMessage: (message) => {
      messages.push(message);
    },
    changeScene: (nextScene) => {
      transitions.push(nextScene);
    },
    changeWithGuard: async (commit, onError) => {
      try {
        await commit();
      } catch (error) {
        onError?.(error);
      }
    },
    openStartLoadout: () => {
      messages.push('start-loadout-opened');
      return 'start-open';
    },
    createMetaShopScene: async () => ({ sceneId: 'MetaShopScene' }),
    createCodexScene: async () => {
      throw new TypeError('Failed to fetch dynamically imported module: http://127.0.0.1:4177/assets/CodexScene.js');
    },
    createSettingsScene: async () => ({ sceneId: 'SettingsScene' }),
    attemptWindowClose: ({ windowRef, setMessage, onError }) => {
      closeCalls.push(windowRef);
      setMessage('게임을 종료하는 중…');
      onError?.(new Error('blocked'));
    },
    windowRef: { id: 'window-ref' },
    logRuntimeErrorImpl: (...args) => {
      errors.push(args);
    },
    logRuntimeWarnImpl: (...args) => {
      warns.push(args);
    },
  });

  const startResult = await service.runAction('start');
  assert.equal(startResult, 'start-open', 'start action이 injected loadout opener를 호출하지 않음');
  assert.equal(flashes.length, 1, 'start action이 flash를 발생시키지 않음');
  assert.equal(messages.at(-2), '시작 무기 선택 중…', 'start action이 상태 메시지를 갱신하지 않음');
  assert.equal(messages.at(-1), 'start-loadout-opened', 'start action이 loadout opener를 실행하지 않음');

  await service.runAction('shop');
  assert.deepEqual(transitions.at(-1), { sceneId: 'MetaShopScene' }, 'shop action이 scene transition을 수행하지 않음');

  await service.runAction('codex');
  assert.equal(
    messages.at(-1),
    'Codex 화면을 불러오지 못했습니다. 개발 서버가 중지되었을 수 있습니다. 서버를 다시 켜고 새로고침한 뒤 다시 시도해주세요.',
    'codex load failure가 공통 runtime issue 안내로 매핑되지 않음',
  );
  assert.equal(errors.length, 1, 'codex load failure가 runtime logger를 통해 기록되지 않음');

  await service.runAction('quit');
  assert.deepEqual(closeCalls, [{ id: 'window-ref' }], 'quit action이 injected window close seam을 사용하지 않음');
  assert.equal(warns.length, 1, 'quit action 실패가 runtime warn logger를 통해 기록되지 않음');
});

test('title scene application service는 loadout overlay가 열려 있으면 배경 액션을 차단한다', async () => {
  const { createTitleSceneApplicationService } = getServiceModule();
  const transitions = [];
  const service = createTitleSceneApplicationService({
    isStartLoadoutOpen: () => true,
    changeScene: (nextScene) => transitions.push(nextScene),
    changeWithGuard: async (commit) => commit(),
    openStartLoadout: () => {
      throw new Error('overlay open 상태에서 start가 열리면 안 됨');
    },
    createMetaShopScene: async () => ({ sceneId: 'MetaShopScene' }),
  });

  const result = await service.runAction('shop');
  assert.equal(result, false, 'overlay open 상태에서 action은 false를 반환해야 함');
  assert.deepEqual(transitions, [], 'overlay open 상태에서 scene transition이 발생하면 안 됨');
});

summary();
