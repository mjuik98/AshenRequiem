import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import {
  createTitleBackgroundState,
  resizeTitleBackgroundState,
} from '../src/scenes/title/titleBackgroundState.js';

console.log('\n[TitleBackgroundState]');

const { test, summary } = createRunner('TitleBackgroundState');

function createMockWindow() {
  return {
    innerWidth: 120,
    innerHeight: 90,
    devicePixelRatio: 1.5,
    matchMedia: () => ({ matches: false }),
  };
}

function createMockCanvas() {
  return {
    width: 0,
    height: 0,
    style: {},
  };
}

function createMockContext() {
  return {
    lastTransform: null,
    setTransform(...args) {
      this.lastTransform = args;
    },
  };
}

test('title background state는 주입된 rng로 별/비 레이어를 deterministic하게 생성한다', () => {
  const win = createMockWindow();
  const canvas = createMockCanvas();
  const ctx = createMockContext();
  const rng = () => 0.5;
  const state = createTitleBackgroundState(win, rng);

  resizeTitleBackgroundState(state, canvas, ctx, win);

  assert.equal(state.stars.length, 90, 'star count baseline이 바뀜');
  assert.equal(state.rain.length, 36, 'rain count baseline이 바뀜');
  assert.deepEqual(
    state.stars[0],
    {
      x: 60,
      y: 27.9,
      radius: 1.15,
      alpha: 0.5,
      speed: 0.95,
      phase: Math.PI,
      layer: 0.6,
    },
    'title background stars가 injected rng를 따르지 않음',
  );
  assert.deepEqual(
    state.rain[0],
    {
      x: 60,
      y: 45,
      length: 13,
      speed: 330,
      alpha: 0.12,
    },
    'title background rain이 injected rng를 따르지 않음',
  );
});

summary();
