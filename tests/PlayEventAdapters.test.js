import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { readProjectSource } from './helpers/sourceInspection.js';

console.log('\n[PlayEventAdapters]');

const { test, summary } = createRunner('PlayEventAdapters');

let adapterApi = null;
const eventHandlerRegistrySource = readProjectSource('../src/systems/event/eventHandlerRegistry.js');
const playEventRegistrationSource = readProjectSource('../src/app/play/playEventRegistrationService.js');

try {
  adapterApi = await import('../src/adapters/play/playEventAdapters.js');
} catch (error) {
  adapterApi = { error };
}

test('play event adapter 모듈은 handler group을 계층별로 노출한다', () => {
  assert.ok(!adapterApi.error, adapterApi.error?.message ?? 'playEventAdapters.js가 아직 없음');
  assert.equal(Array.isArray(adapterApi.PLAY_WORLD_EVENT_ADAPTERS), true);
  assert.equal(Array.isArray(adapterApi.PLAY_SOUND_EVENT_ADAPTERS), true);
  assert.equal(Array.isArray(adapterApi.PLAY_SESSION_EVENT_ADAPTERS), true);
  assert.equal(Array.isArray(adapterApi.PLAY_PRESENTATION_EVENT_ADAPTERS), true);
  assert.equal(Array.isArray(adapterApi.PLAY_DEFAULT_EVENT_ADAPTERS), true);
  assert.equal(adapterApi.PLAY_DEFAULT_EVENT_ADAPTERS.length >= 6, true);
});

test('event handler registry는 adapter group을 조합하는 얇은 facade로 유지된다', () => {
  assert.equal(eventHandlerRegistrySource.includes("from '../../adapters/play/playEventAdapters.js'"), false, 'event handler registry가 play adapter group 소유권을 가지면 안 됨');
  assert.equal(eventHandlerRegistrySource.includes('registerBossAnnouncementHandler'), false, 'event handler registry가 개별 adapter 구현을 직접 import하면 안 됨');
  assert.equal(eventHandlerRegistrySource.includes('registerCurrencyHandler'), false, 'event handler registry가 개별 adapter 구현을 직접 import하면 안 됨');
});

test('play event registration service는 adapter group 조합을 app 계층에서 소유한다', async () => {
  const registrationApi = await import('../src/app/play/playEventRegistrationService.js');

  assert.equal(Array.isArray(registrationApi.PLAY_DEFAULT_EVENT_HANDLER_REGISTRATIONS), true);
  assert.equal(typeof registrationApi.registerPlayEventHandlers, 'function');
  assert.equal(playEventRegistrationSource.includes("from '../../adapters/play/playEventAdapters.js'"), true, 'app/play helper가 adapter group을 import해야 함');
  assert.equal(playEventRegistrationSource.includes("from '../../systems/event/eventHandlerRegistry.js'"), true, 'app/play helper가 공용 register helper를 사용해야 함');
});

summary();
