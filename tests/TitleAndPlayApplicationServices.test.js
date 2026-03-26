import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { makeSessionState, makeWorld } from './fixtures/index.js';

console.log('\n[TitleAndPlayApplicationServices]');

const { test, summary } = createRunner('TitleAndPlayApplicationServices');

test('title loadout application service는 시작 무기 저장과 씬 생성을 함께 조립한다', async () => {
  const { startTitleRun, createTitleLoadoutApplicationService } = await import('../src/app/title/titleLoadoutApplicationService.js');

  const game = {
    session: makeSessionState(),
    gameData: { weaponData: [{ id: 'magic_bolt', isEvolved: false }] },
  };

  const direct = startTitleRun(game, 'magic_bolt', {
    commitSelectionImpl: () => ({ saved: true, selectedWeaponId: 'magic_bolt' }),
    createPlaySceneImpl: () => ({ id: 'play-scene' }),
  });
  assert.deepEqual(
    direct,
    { saved: true, selectedWeaponId: 'magic_bolt', nextScene: { id: 'play-scene' } },
    'startTitleRun이 저장과 다음 씬 조립 결과를 함께 반환하지 않음',
  );

  const service = createTitleLoadoutApplicationService(game, {
    commitSelectionImpl: () => ({ saved: false, selectedWeaponId: 'magic_bolt' }),
    createPlaySceneImpl: () => ({ id: 'play-scene' }),
  });
  const result = service.startRun('magic_bolt');
  assert.equal(result.saved, false, 'service.startRun이 commit 결과를 그대로 전달하지 않음');
  assert.equal(result.nextScene, null, '저장 실패 시 nextScene이 생성되면 안 됨');
});

test('play result application service는 세션 기준 runtime snapshot을 캡처해 결과 처리를 수행한다', async () => {
  const {
    capturePlayResultRuntimeState,
    createPlayResultApplicationService,
  } = await import('../src/app/play/playResultApplicationService.js');

  const session = makeSessionState({
    best: { kills: 12, survivalTime: 90, level: 3 },
    meta: { currency: 40, totalRuns: 2 },
  });
  const world = makeWorld({
    run: { killCount: 20, elapsedTime: 150, runCurrencyEarned: 5, runOutcome: { type: 'victory' } },
    entities: { player: { level: 4, weapons: [{ id: 'magic_bolt', level: 2 }] } },
  });

  const runtimeState = capturePlayResultRuntimeState(session);
  assert.deepEqual(
    runtimeState,
    {
      startCurrency: 40,
      prevBestTime: 90,
      prevBestLevel: 3,
      prevBestKills: 12,
    },
    'play result runtime snapshot이 세션 기반 최고 기록과 시작 재화를 캡처하지 않음',
  );

  const service = createPlayResultApplicationService(session);
  const result = service.process(world);
  assert.equal(result.outcome, 'victory');
  assert.equal(result.bestTime, 90);
  assert.equal(result.currencyEarned, 5);
  assert.equal(session.meta.totalRuns, 3, 'service.process가 세션 커밋을 수행하지 않음');
});

summary();
