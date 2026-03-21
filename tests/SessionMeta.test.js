import assert from 'node:assert/strict';
import { test, summary } from './helpers/testRunner.js';

let ensureCodexMeta;
let appendUnique;

try {
  ({
    ensureCodexMeta,
    appendUnique,
  } = await import('../src/state/sessionMeta.js'));
} catch (e) {
  console.warn('[테스트] sessionMeta import 실패 — 스킵:', e.message);
  process.exit(1);
}

console.log('\n[SessionMeta]');

test('ensureCodexMeta()는 도감 메타 필드를 기본값으로 보완한다', () => {
  const session = { meta: { currency: 10 } };
  const meta = ensureCodexMeta(session);

  assert.equal(meta.currency, 10);
  assert.deepEqual(meta.enemyKills, {});
  assert.deepEqual(meta.enemiesEncountered, []);
  assert.deepEqual(meta.killedBosses, []);
  assert.deepEqual(meta.weaponsUsedAll, []);
  assert.deepEqual(meta.evolvedWeapons, []);
  assert.equal(meta.totalRuns, 0);
});

test('appendUnique()는 배열을 중복 없이 병합한다', () => {
  assert.deepEqual(
    appendUnique(['magic_bolt', 'holy_aura'], ['holy_aura', 'boomerang']),
    ['magic_bolt', 'holy_aura', 'boomerang'],
  );
});

summary();
