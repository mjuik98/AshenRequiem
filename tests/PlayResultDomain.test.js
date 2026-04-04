import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { makePlayer, makeWorld } from './fixtures/index.js';

console.log('\n[PlayResultDomain]');

const { test, summary } = createRunner('PlayResultDomain');

test('buildRecentRunEntry는 주입 가능한 clock seam으로 기록 시각을 계산한다', async () => {
  const { buildRunResult, buildRecentRunEntry } = await import('../src/domain/meta/progression/playResultDomain.js');
  const world = makeWorld({
    run: {
      elapsedTime: 321,
      stageId: 'ember_hollow',
      stage: { id: 'ember_hollow', name: 'Ember Hollow' },
      ascensionLevel: 2,
      runOutcome: { type: 'victory' },
      archetypeId: 'spellweaver',
      archetype: { id: 'spellweaver', name: 'Spellweaver' },
    },
    entities: {
      player: makePlayer({
        level: 7,
        curse: 3,
        weapons: [{ id: 'magic_bolt' }],
        accessories: [{ id: 'iron_heart' }],
      }),
    },
  });
  const runResult = buildRunResult(world);

  const entry = buildRecentRunEntry(world, runResult, {
    getNowMs: () => 987654,
  });

  assert.equal(entry.recordedAt, 987654, 'recent run entry가 주입된 clock seam을 사용하지 않음');
  assert.equal(entry.outcome, 'victory');
  assert.equal(entry.stageId, 'ember_hollow');
});

summary();
