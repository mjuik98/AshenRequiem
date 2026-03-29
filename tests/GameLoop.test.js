import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { GameLoop } from '../src/core/GameLoop.js';

console.log('\n[GameLoop]');

const { test, summary } = createRunner('GameLoop');

test('game loop는 주입된 clock을 start 시점 기준 시간으로 사용한다', () => {
  let requested = false;
  const previousRaf = globalThis.requestAnimationFrame;
  globalThis.requestAnimationFrame = () => {
    requested = true;
    return 1;
  };

  try {
    const loop = new GameLoop(() => {}, {
      getNowMs: () => 4321,
    });
    loop.start();

    assert.equal(loop._lastTime, 4321, '주입된 clock 값이 loop 시작 시간으로 기록되지 않음');
    assert.equal(requested, true, 'loop start가 requestAnimationFrame을 예약하지 않음');
  } finally {
    globalThis.requestAnimationFrame = previousRaf;
  }
});

summary();
