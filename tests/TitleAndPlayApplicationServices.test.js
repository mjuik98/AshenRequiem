import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { makeSessionState, makeWorld } from './fixtures/index.js';

console.log('\n[TitleAndPlayApplicationServices]');

const { test, summary } = createRunner('TitleAndPlayApplicationServices');

test('title loadout application service는 시작 무기 저장과 씬 생성을 함께 조립한다', async () => {
  const { startTitleRun, createTitleLoadoutApplicationService } = await import('../src/app/title/titleLoadoutApplicationService.js');
  const titleLoadoutAppSource = await import('./helpers/sourceInspection.js').then(({ readProjectSource }) => readProjectSource('../src/app/title/titleLoadoutApplicationService.js'));

  assert.equal(
    titleLoadoutAppSource.includes("from './titleRunOptions.js'"),
    true,
    'titleLoadoutApplicationService가 run option helper를 사용하지 않음',
  );
  assert.equal(
    titleLoadoutAppSource.includes("from './titleRunSelectionCommit.js'"),
    true,
    'titleLoadoutApplicationService가 commit helper를 사용하지 않음',
  );
  assert.equal(
    titleLoadoutAppSource.includes("from './titleRunResult.js'"),
    true,
    'titleLoadoutApplicationService가 result helper를 사용하지 않음',
  );

  const game = {
    session: makeSessionState(),
    gameData: { weaponData: [{ id: 'magic_bolt', isEvolved: false }] },
  };

  const directCalls = [];
  const direct = startTitleRun(game, 'magic_bolt', {
    ascensionLevel: 4,
    startAccessoryId: 'ring_of_speed',
    archetypeId: 'spellweaver',
    riskRelicId: 'glass_censer',
    stageId: 'ember_hollow',
    seedMode: 'custom',
    seedText: 'ashen-seed',
    commitSelectionImpl: (...args) => {
      directCalls.push(args);
      return {
        saved: true,
        selectedWeaponId: 'magic_bolt',
        selectedAscensionLevel: 4,
        selectedStartAccessoryId: 'ring_of_speed',
        selectedArchetypeId: 'spellweaver',
        selectedRiskRelicId: 'glass_censer',
        selectedStageId: 'ember_hollow',
        selectedSeedMode: 'custom',
        selectedSeedText: 'ashen-seed',
      };
    },
    createPlaySceneImpl: () => ({ id: 'play-scene' }),
  });
  assert.deepEqual(
    direct,
    {
      saved: true,
      selectedWeaponId: 'magic_bolt',
      selectedAscensionLevel: 4,
      selectedStartAccessoryId: 'ring_of_speed',
      selectedArchetypeId: 'spellweaver',
      selectedRiskRelicId: 'glass_censer',
      selectedStageId: 'ember_hollow',
      selectedSeedMode: 'custom',
      selectedSeedText: 'ashen-seed',
      nextScene: { id: 'play-scene' },
    },
    'startTitleRun이 저장과 다음 씬 조립 결과를 함께 반환하지 않음',
  );
  assert.deepEqual(
    directCalls,
    [[game.session, 'magic_bolt', {
      ascensionLevel: 4,
      startAccessoryId: 'ring_of_speed',
      archetypeId: 'spellweaver',
      riskRelicId: 'glass_censer',
      stageId: 'ember_hollow',
      seedMode: 'custom',
      seedText: 'ashen-seed',
    }, game.gameData]],
    'startTitleRun이 확장된 런 설정을 commit 단계로 전달하지 않음',
  );

  const service = createTitleLoadoutApplicationService(game, {
    commitSelectionImpl: () => ({ saved: false, selectedWeaponId: 'magic_bolt' }),
    createPlaySceneImpl: () => ({ id: 'play-scene' }),
  });
  const result = service.startRun('magic_bolt');
  assert.equal(result.saved, false, 'service.startRun이 commit 결과를 그대로 전달하지 않음');
  assert.equal(result.nextScene, null, '저장 실패 시 nextScene이 생성되면 안 됨');
});

test('title loadout helpers는 run option normalization과 result shaping을 분리한다', async () => {
  const { normalizeTitleRunOptions, extractTitleRunDeps } = await import('../src/app/title/titleRunOptions.js');
  const { buildTitleRunResult } = await import('../src/app/title/titleRunResult.js');

  const normalized = normalizeTitleRunOptions({
    ascensionLevel: 3,
    startAccessoryId: 'ring_of_speed',
    archetypeId: 'spellweaver',
    riskRelicId: 'glass_censer',
    stageId: 'ember_hollow',
    seedMode: 'custom',
    seedText: 'ashen-seed',
  });
  assert.deepEqual(normalized, {
    ascensionLevel: 3,
    startAccessoryId: 'ring_of_speed',
    archetypeId: 'spellweaver',
    riskRelicId: 'glass_censer',
    stageId: 'ember_hollow',
    seedMode: 'custom',
    seedText: 'ashen-seed',
  });

  const deps = extractTitleRunDeps({
    commitSelectionImpl: () => 'commit',
    createPlaySceneImpl: () => 'scene',
  }, {
    commitSelectionImpl: () => 'fallback-commit',
    createPlaySceneImpl: () => 'fallback-scene',
  });
  assert.equal(typeof deps.commitSelectionImpl, 'function');
  assert.equal(typeof deps.createPlaySceneImpl, 'function');

  const built = buildTitleRunResult({
    saved: true,
    saveResult: {
      selectedWeaponId: 'magic_bolt',
      selectedAscensionLevel: 3,
      selectedStageId: 'ember_hollow',
      selectedSeedMode: 'custom',
      selectedSeedText: 'ashen-seed',
    },
    nextScene: { id: 'play-scene' },
  });
  assert.deepEqual(built, {
    saved: true,
    selectedWeaponId: 'magic_bolt',
    selectedAscensionLevel: 3,
    selectedStageId: 'ember_hollow',
    selectedSeedMode: 'custom',
    selectedSeedText: 'ashen-seed',
    nextScene: { id: 'play-scene' },
  });
});

test('title scene application service는 title runtime seam 위에 action orchestration을 조립한다', async () => {
  const { readProjectSource } = await import('./helpers/sourceInspection.js');
  const titleSceneAppSource = readProjectSource('../src/app/title/titleSceneApplicationService.js');
  const {
    createTitleSceneApplicationService,
  } = await import('../src/app/title/titleSceneApplicationService.js');

  assert.equal(
    titleSceneAppSource.includes("from '../../utils/runtimeIssue.js'"),
    true,
    'title scene application service가 runtime issue helper를 사용하지 않음',
  );
  assert.equal(
    titleSceneAppSource.includes("from '../../utils/runtimeLogger.js'"),
    true,
    'title scene application service가 runtime logger를 사용하지 않음',
  );
  assert.equal(
    titleSceneAppSource.includes("from '../../scenes/title/titleSceneStatus.js'"),
    false,
    'title scene application service가 scene runtime helper를 직접 import하면 안 됨',
  );

  const seen = [];
  const service = createTitleSceneApplicationService({
    openStartLoadout: () => {
      seen.push('start');
      return 'opened';
    },
    pulseFlash: () => {
      seen.push('flash');
    },
    setMessage: (message) => {
      seen.push(message);
    },
  });

  const result = await service.startGame();
  assert.equal(result, 'opened', 'title scene application service가 start action을 재사용하지 않음');
  assert.deepEqual(
    seen,
    ['flash', '시작 무기 선택 중…', 'start'],
    'title scene application service가 start action 상태 흐름을 조립하지 않음',
  );
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
