import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';

console.log('\n[SoundPolicyHelpers]');

const { test, summary } = createRunner('SoundPolicyHelpers');

let soundPlaybackPolicy = null;
let soundVoiceState = null;

try {
  soundPlaybackPolicy = await import('../src/systems/sound/soundPlaybackPolicy.js');
} catch (error) {
  soundPlaybackPolicy = { error };
}

try {
  soundVoiceState = await import('../src/systems/sound/soundVoiceState.js');
} catch (error) {
  soundVoiceState = { error };
}

function getPlaybackPolicy() {
  assert.ok(
    !soundPlaybackPolicy.error,
    soundPlaybackPolicy.error?.message ?? 'src/systems/sound/soundPlaybackPolicy.js가 아직 없음',
  );
  return soundPlaybackPolicy;
}

function getVoiceState() {
  assert.ok(
    !soundVoiceState.error,
    soundVoiceState.error?.message ?? 'src/systems/sound/soundVoiceState.js가 아직 없음',
  );
  return soundVoiceState;
}

test('sound helper modules expose playback policy and voice state helpers', () => {
  const playbackPolicy = getPlaybackPolicy();
  const voiceState = getVoiceState();

  assert.equal(typeof playbackPolicy.canPlaySoundType, 'function');
  assert.equal(typeof playbackPolicy.getBgmTargetVolume, 'function');
  assert.equal(typeof playbackPolicy.getSfxTargetVolume, 'function');
  assert.equal(typeof playbackPolicy.getDuckedBgmVolume, 'function');
  assert.equal(typeof voiceState.registerSoundVoice, 'function');
  assert.equal(typeof voiceState.unregisterSoundVoice, 'function');
});

test('playback policy helper는 cooldown/polyphony/max voices를 한 번에 판정한다', () => {
  const playbackPolicy = getPlaybackPolicy();
  const lastPlayAt = new Map([['hit', 10]]);
  const activeVoicesByType = new Map([['hit', 1]]);

  const allowed = playbackPolicy.canPlaySoundType('hit', {
    def: { cooldown: 0.1, maxPolyphony: 3 },
    nowSeconds: 10.2,
    lastPlayAt,
    activeVoicesByType,
    activeVoiceCount: 2,
    maxVoices: 8,
  });
  assert.equal(allowed, true);

  const blockedByCooldown = playbackPolicy.canPlaySoundType('hit', {
    def: { cooldown: 0.5, maxPolyphony: 3 },
    nowSeconds: 10.2,
    lastPlayAt,
    activeVoicesByType,
    activeVoiceCount: 2,
    maxVoices: 8,
  });
  assert.equal(blockedByCooldown, false);

  const blockedByPolyphony = playbackPolicy.canPlaySoundType('hit', {
    def: { cooldown: 0, maxPolyphony: 1 },
    nowSeconds: 11,
    lastPlayAt,
    activeVoicesByType,
    activeVoiceCount: 2,
    maxVoices: 8,
  });
  assert.equal(blockedByPolyphony, false);
});

test('voice state helper는 타입별 active voice count를 일관되게 관리한다', () => {
  const voiceState = getVoiceState();
  const activeVoices = new Set();
  const activeVoicesByType = new Map();

  voiceState.registerSoundVoice(activeVoices, activeVoicesByType, 'v1', 'laser');
  voiceState.registerSoundVoice(activeVoices, activeVoicesByType, 'v2', 'laser');
  assert.equal(activeVoices.size, 2);
  assert.equal(activeVoicesByType.get('laser'), 2);

  voiceState.unregisterSoundVoice(activeVoices, activeVoicesByType, 'v1', 'laser');
  assert.equal(activeVoices.size, 1);
  assert.equal(activeVoicesByType.get('laser'), 1);

  voiceState.unregisterSoundVoice(activeVoices, activeVoicesByType, 'v2', 'laser');
  assert.equal(activeVoices.size, 0);
  assert.equal(activeVoicesByType.has('laser'), false);
});

summary();
