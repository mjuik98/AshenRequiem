import assert from 'node:assert/strict';
import { EventRegistry } from '../src/systems/event/EventRegistry.js';
import { registerSoundEventHandlers } from '../src/systems/sound/soundEventHandler.js';
import { test, summary } from './helpers/testRunner.js';

console.log('\n[SoundEventHandler]');

test('death sound playback is throttled during kill bursts', () => {
  const plays = [];
  const soundSystem = {
    play(type) {
      plays.push(type);
    },
  };
  const registry = new EventRegistry();
  registerSoundEventHandlers(soundSystem, registry);

  const world = { elapsedTime: 12.0 };
  registry.processAll({
    hits: [],
    deaths: new Array(8).fill(0).map(() => ({ entity: { type: 'enemy' } })),
    pickupCollected: [],
    levelUpRequested: [],
    statusApplied: [],
    bossPhaseChanged: [],
    spawnRequested: [],
    currencyEarned: [],
    bossAnnounced: [],
    weaponEvolved: [],
  }, world);

  assert.ok(
    plays.length < 8,
    `death sound가 처치 수만큼 모두 재생됨 (실제: ${plays.length})`,
  );
});

summary();
