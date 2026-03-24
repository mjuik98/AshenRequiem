import assert from 'node:assert/strict';
import { EventRegistry } from '../src/systems/event/EventRegistry.js';
import { registerCurrencyHandler } from '../src/systems/event/currencyHandler.js';
import { makeSessionState, makeWorld } from './fixtures/index.js';
import { test, summary } from './helpers/testRunner.js';

console.log('\n[CurrencyHandler]');

test('currencyEarned 이벤트는 세션 재화와 런 중 획득 골드를 함께 누적한다', () => {
  const session = makeSessionState({ meta: { currency: 10 } });
  const registry = new EventRegistry();
  registerCurrencyHandler(session, registry);
  const world = makeWorld({ runCurrencyEarned: 0 });

  registry.processAll({
    ...world.events,
    currencyEarned: [{ amount: 7 }, { amount: 5 }],
  }, world);

  assert.equal(session.meta.currency, 22, '세션 재화가 누적되지 않음');
  assert.equal(world.runCurrencyEarned, 12, '런 중 획득 골드가 world에 누적되지 않음');
});

summary();
