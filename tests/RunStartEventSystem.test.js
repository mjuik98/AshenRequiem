import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { createPlayWorld as createWorld } from '../src/domain/play/state/createPlayWorld.js';
import { PendingEventPumpSystem } from '../src/systems/event/PendingEventPumpSystem.js';

console.log('\n[PendingEventPumpSystem]');

const { test, summary } = createRunner('PendingEventPumpSystem');

test('PendingEventPumpSystem은 generic pending event queue를 프레임 이벤트 큐로 주입한다', () => {
  const world = createWorld();
  world.queues.events.weaponAcquired.push({ weaponId: 'stale' });
  world.progression.pendingEventQueue = [
    { type: 'weaponAcquired', payload: { weaponId: 'magic_bolt' } },
    { type: 'accessoryAcquired', payload: { accessoryId: 'iron_heart' } },
  ];

  PendingEventPumpSystem.update({ world });

  assert.deepEqual(world.queues.events.weaponAcquired, [{ weaponId: 'stale' }, { weaponId: 'magic_bolt' }], '시작 무기 이벤트가 전용 시스템에서 주입되지 않음');
  assert.deepEqual(world.queues.events.accessoryAcquired, [{ accessoryId: 'iron_heart' }], '시작 장신구 이벤트가 전용 시스템에서 주입되지 않음');
  assert.equal(world.progression.pendingEventQueue, null, 'pending event queue가 전용 시스템에서 소비되지 않음');
});

summary();
