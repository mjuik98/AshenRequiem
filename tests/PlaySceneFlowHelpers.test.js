import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { makePlayer, makeSessionState, makeWorld } from './fixtures/index.js';
import { PlayMode } from '../src/state/PlayMode.js';
import {
  persistPauseSceneOptions,
  runPlaySceneFrame,
  showPlaySceneResult,
  syncPlaySceneDevicePixelRatio,
  togglePlayScenePause,
} from '../src/scenes/play/playSceneFlow.js';

const { test, summary } = createRunner('PlaySceneFlowHelpers');

console.log('\n[PlaySceneFlowHelpers]');

test('play scene flow helper는 DPR 변경만 반영한다', () => {
  const unchanged = syncPlaySceneDevicePixelRatio({
    sessionOptions: { useDevicePixelRatio: true },
    currentDpr: 2,
    devicePixelRatio: 2,
    defaultUseDevicePixelRatio: true,
  });
  assert.equal(unchanged.changed, false);
  assert.equal(unchanged.dpr, 2);

  const downgraded = syncPlaySceneDevicePixelRatio({
    sessionOptions: { useDevicePixelRatio: false },
    currentDpr: 2,
    devicePixelRatio: 2,
    defaultUseDevicePixelRatio: true,
  });
  assert.equal(downgraded.changed, true);
  assert.equal(downgraded.dpr, 1);
});

test('play scene flow helper는 pipeline frame 업데이트를 한 곳에서 처리한다', () => {
  const world = makeWorld({ player: makePlayer() });
  const pipelineCtx = { dt: 0, dpr: 1 };
  const pipelineRuns = [];
  const uiUpdates = [];

  const ran = runPlaySceneFrame({
    world,
    pipeline: {
      run(ctx) {
        pipelineRuns.push({ ...ctx });
      },
    },
    pipelineCtx,
    ui: {
      update(nextWorld) {
        uiUpdates.push(nextWorld);
      },
    },
    dt: 0.25,
    dpr: 1.5,
  });

  assert.equal(ran, true);
  assert.equal(world.deltaTime, 0.25);
  assert.equal(pipelineCtx.dt, 0.25);
  assert.equal(pipelineCtx.dpr, 1.5);
  assert.equal(pipelineRuns.length, 1);
  assert.equal(uiUpdates.at(-1), world);
});

test('play scene flow helper는 pause 오버레이 표시와 resume 전환을 캡슐화한다', () => {
  const world = makeWorld({ playMode: PlayMode.PLAYING });
  const transitions = [];
  const shownConfigs = [];
  let hiddenCount = 0;

  const paused = togglePlayScenePause({
    world,
    ui: {
      showPause(config) {
        shownConfigs.push(config);
      },
      hidePause() {
        hiddenCount += 1;
      },
    },
    data: { weaponData: [] },
    session: makeSessionState(),
    isBlocked: () => false,
    onOptionsChange: () => {},
    transition: (targetWorld, mode) => {
      transitions.push(mode);
      targetWorld.playMode = mode;
    },
  });

  assert.equal(paused, 'paused');
  assert.equal(transitions.at(-1), PlayMode.PAUSED);
  assert.equal(shownConfigs.length, 1);

  const resumed = togglePlayScenePause({
    world,
    ui: {
      hidePause() {
        hiddenCount += 1;
      },
    },
    isBlocked: () => false,
    transition: (targetWorld, mode) => {
      transitions.push(mode);
      targetWorld.playMode = mode;
    },
  });

  assert.equal(resumed, 'resumed');
  assert.equal(transitions.at(-1), PlayMode.PLAYING);
  assert.equal(hiddenCount, 1);
});

test('play scene flow helper는 pause 옵션 저장과 result overlay 구성을 위임한다', () => {
  const savedOptions = [];
  const runtimeUpdates = [];
  const session = makeSessionState();

  const mergedOptions = persistPauseSceneOptions(session, { showFps: true }, {
    updateSessionOptions(sessionState, nextOptions) {
      savedOptions.push({ sessionState, nextOptions });
      sessionState.options = { ...sessionState.options, ...nextOptions };
      return sessionState.options;
    },
    applyRuntimeOptions() {
      runtimeUpdates.push('applied');
    },
  });

  assert.equal(savedOptions.length, 1);
  assert.equal(mergedOptions.showFps, true);
  assert.deepEqual(runtimeUpdates, ['applied']);

  const resultCalls = [];
  const stats = showPlaySceneResult({
    world: makeWorld({ playMode: PlayMode.DEAD }),
    resultHandler: {
      process() {
        return { killCount: 12, outcome: 'defeat' };
      },
    },
    ui: {
      showResult(resultStats, onRestart, onTitle) {
        resultCalls.push({ resultStats, onRestart, onTitle });
      },
    },
    isBlocked: () => false,
    setBlocked: () => {},
    restart: () => {},
    goToTitle: () => {},
  });

  assert.deepEqual(stats, { killCount: 12, outcome: 'defeat' });
  assert.equal(resultCalls.length, 1);
  assert.equal(typeof resultCalls[0].onRestart, 'function');
  assert.equal(typeof resultCalls[0].onTitle, 'function');
});

summary();
