import assert from 'node:assert/strict';
import { drawPickup } from '../src/renderer/draw/drawPickup.js';
import { makePickup } from './fixtures/index.js';
import { test, summary } from './helpers/testRunner.js';

function createRecordingContext() {
  const calls = [];
  return {
    calls,
    save() { calls.push(['save']); },
    restore() { calls.push(['restore']); },
    beginPath() { calls.push(['beginPath']); },
    closePath() { calls.push(['closePath']); },
    moveTo(...args) { calls.push(['moveTo', ...args]); },
    lineTo(...args) { calls.push(['lineTo', ...args]); },
    arc(...args) { calls.push(['arc', ...args]); },
    fill() { calls.push(['fill']); },
    stroke() { calls.push(['stroke']); },
    fillRect(...args) { calls.push(['fillRect', ...args]); },
    translate(...args) { calls.push(['translate', ...args]); },
    rotate(...args) { calls.push(['rotate', ...args]); },
    scale(...args) { calls.push(['scale', ...args]); },
    setLineDash(...args) { calls.push(['setLineDash', ...args]); },
    fillText(...args) { calls.push(['fillText', ...args]); },
    quadraticCurveTo(...args) { calls.push(['quadraticCurveTo', ...args]); },
    set shadowColor(value) { calls.push(['shadowColor', value]); },
    set shadowBlur(value) { calls.push(['shadowBlur', value]); },
    set fillStyle(value) { calls.push(['fillStyle', value]); },
    set strokeStyle(value) { calls.push(['strokeStyle', value]); },
    set lineWidth(value) { calls.push(['lineWidth', value]); },
    set globalAlpha(value) { calls.push(['globalAlpha', value]); },
    set font(value) { calls.push(['font', value]); },
    set textAlign(value) { calls.push(['textAlign', value]); },
  };
}

console.log('\n[drawPickup]');

test('vacuumPulled XP는 일반 XP보다 추가 연출을 가진다', () => {
  const baseCtx = createRecordingContext();
  const vacuumCtx = createRecordingContext();
  const normalXp = makePickup({ pickupType: 'xp', x: 100, y: 80, radius: 8, vacuumPulled: false });
  const pulledXp = makePickup({ pickupType: 'xp', x: 100, y: 80, radius: 8, vacuumPulled: true });

  drawPickup(baseCtx, normalXp, { x: 0, y: 0 }, 1.2);
  drawPickup(vacuumCtx, pulledXp, { x: 0, y: 0 }, 1.2);

  assert.ok(
    vacuumCtx.calls.length > baseCtx.calls.length,
    'vacuumPulled XP가 일반 XP와 동일한 렌더 경로만 사용함',
  );
  assert.ok(
    vacuumCtx.calls.some((entry) => entry[0] === 'setLineDash' || entry[0] === 'scale' || entry[0] === 'rotate'),
    'vacuumPulled XP 전용 연출 호출이 없음',
  );
});

summary();
