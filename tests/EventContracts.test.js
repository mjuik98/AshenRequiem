import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';

console.log('\n[EventContracts]');

const { test, summary } = createRunner('EventContracts');

test('event type 목록은 payload contract에서 파생된다', async () => {
  const { EVENT_TYPES, PLAY_EVENT_CONTRACTS, getPlayEventContract } = await import('../src/data/constants/events.js');

  assert.deepEqual(EVENT_TYPES, Object.keys(PLAY_EVENT_CONTRACTS));
  EVENT_TYPES.forEach((eventType) => {
    const contract = getPlayEventContract(eventType);
    assert.equal(typeof contract?.description, 'string', `${eventType} contract description이 없음`);
    assert.equal(Array.isArray(contract?.required), true, `${eventType} contract required field 목록이 없음`);
  });
});

summary();
