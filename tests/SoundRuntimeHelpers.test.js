import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';

console.log('\n[SoundRuntimeHelpers]');

const { test, summary } = createRunner('SoundRuntimeHelpers');

let soundGraph = null;
let soundVoices = null;

try {
  soundGraph = await import('../src/systems/sound/soundGraph.js');
} catch (error) {
  soundGraph = { error };
}

try {
  soundVoices = await import('../src/systems/sound/soundVoices.js');
} catch (error) {
  soundVoices = { error };
}

function getSoundGraphApi() {
  assert.ok(
    !soundGraph.error,
    soundGraph.error?.message ?? 'src/systems/sound/soundGraph.js가 아직 없음',
  );
  return soundGraph;
}

function getSoundVoicesApi() {
  assert.ok(
    !soundVoices.error,
    soundVoices.error?.message ?? 'src/systems/sound/soundVoices.js가 아직 없음',
  );
  return soundVoices;
}

test('sound runtime helper modules expose graph and voice helpers', () => {
  const graphApi = getSoundGraphApi();
  const voicesApi = getSoundVoicesApi();

  assert.equal(typeof graphApi.createSoundGraph, 'function', 'createSoundGraph helper가 없음');
  assert.equal(typeof graphApi.disconnectSoundGraph, 'function', 'disconnectSoundGraph helper가 없음');
  assert.equal(typeof voicesApi.createBgmVoice, 'function', 'createBgmVoice helper가 없음');
  assert.equal(typeof voicesApi.scheduleBeepVoice, 'function', 'scheduleBeepVoice helper가 없음');
  assert.equal(typeof voicesApi.scheduleChordVoice, 'function', 'scheduleChordVoice helper가 없음');
});

summary();
