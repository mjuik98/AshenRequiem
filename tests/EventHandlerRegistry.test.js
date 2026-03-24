import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';

console.log('\n[EventHandlerRegistry]');

const { test, summary } = createRunner('EventHandlerRegistry');

test('event handler registry는 기본 등록 spec과 공용 register helper를 노출한다', async () => {
  const registryApi = await import('../src/systems/event/eventHandlerRegistry.js');

  assert.equal(Array.isArray(registryApi.DEFAULT_EVENT_HANDLER_REGISTRATIONS), true, '기본 이벤트 핸들러 등록 spec이 없음');
  assert.equal(typeof registryApi.registerEventHandlers, 'function', '공용 이벤트 핸들러 register helper가 없음');
  assert.equal(registryApi.DEFAULT_EVENT_HANDLER_REGISTRATIONS.length >= 6, true, '기본 이벤트 핸들러 등록 spec 수가 예상보다 적음');
  registryApi.DEFAULT_EVENT_HANDLER_REGISTRATIONS.forEach((entry, index) => {
    assert.equal(typeof entry.id, 'string', `등록 spec #${index}에 id가 없음`);
    assert.equal(typeof entry.register, 'function', `등록 spec #${index}에 register 함수가 없음`);
  });
});

test('공용 event handler register helper는 전달된 spec 순서대로 등록한다', async () => {
  const { registerEventHandlers } = await import('../src/systems/event/eventHandlerRegistry.js');
  const calls = [];
  const services = { soundSystem: { id: 'sound' } };
  const registry = { id: 'registry' };
  const session = { id: 'session' };

  registerEventHandlers([
    {
      id: 'first',
      register(context) {
        calls.push(['first', context.services, context.registry, context.session]);
      },
    },
    {
      id: 'second',
      register(context) {
        calls.push(['second', context.services, context.registry, context.session]);
      },
    },
  ], services, registry, session);

  assert.deepEqual(calls, [
    ['first', services, registry, session],
    ['second', services, registry, session],
  ]);
});

summary();
