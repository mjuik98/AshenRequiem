import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';

console.log('\n[SoundRuntimeHelpers]');

const { test, summary } = createRunner('SoundRuntimeHelpers');

let soundGraph = null;
let soundVoices = null;
let soundBusRuntime = null;
let soundPlaybackRuntime = null;
let soundSystemState = null;
let soundSystemLifecycle = null;
let soundPlaybackController = null;
let soundBgmController = null;
let soundSfxController = null;

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

try {
  soundBusRuntime = await import('../src/systems/sound/soundBusRuntime.js');
} catch (error) {
  soundBusRuntime = { error };
}

try {
  soundPlaybackRuntime = await import('../src/systems/sound/soundPlaybackRuntime.js');
} catch (error) {
  soundPlaybackRuntime = { error };
}

try {
  soundSystemState = await import('../src/systems/sound/soundSystemState.js');
} catch (error) {
  soundSystemState = { error };
}

try {
  soundSystemLifecycle = await import('../src/systems/sound/soundSystemLifecycle.js');
} catch (error) {
  soundSystemLifecycle = { error };
}

try {
  soundPlaybackController = await import('../src/systems/sound/soundPlaybackController.js');
} catch (error) {
  soundPlaybackController = { error };
}

try {
  soundBgmController = await import('../src/systems/sound/soundBgmController.js');
} catch (error) {
  soundBgmController = { error };
}

try {
  soundSfxController = await import('../src/systems/sound/soundSfxController.js');
} catch (error) {
  soundSfxController = { error };
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

function getSoundBusRuntimeApi() {
  assert.ok(
    !soundBusRuntime.error,
    soundBusRuntime.error?.message ?? 'src/systems/sound/soundBusRuntime.js가 아직 없음',
  );
  return soundBusRuntime;
}

function getSoundPlaybackRuntimeApi() {
  assert.ok(
    !soundPlaybackRuntime.error,
    soundPlaybackRuntime.error?.message ?? 'src/systems/sound/soundPlaybackRuntime.js가 아직 없음',
  );
  return soundPlaybackRuntime;
}

function getSoundSystemStateApi() {
  assert.ok(
    !soundSystemState.error,
    soundSystemState.error?.message ?? 'src/systems/sound/soundSystemState.js가 아직 없음',
  );
  return soundSystemState;
}

function getSoundSystemLifecycleApi() {
  assert.ok(
    !soundSystemLifecycle.error,
    soundSystemLifecycle.error?.message ?? 'src/systems/sound/soundSystemLifecycle.js가 아직 없음',
  );
  return soundSystemLifecycle;
}

function getSoundPlaybackControllerApi() {
  assert.ok(
    !soundPlaybackController.error,
    soundPlaybackController.error?.message ?? 'src/systems/sound/soundPlaybackController.js가 아직 없음',
  );
  return soundPlaybackController;
}

function getSoundBgmControllerApi() {
  assert.ok(
    !soundBgmController.error,
    soundBgmController.error?.message ?? 'src/systems/sound/soundBgmController.js가 아직 없음',
  );
  return soundBgmController;
}

function getSoundSfxControllerApi() {
  assert.ok(
    !soundSfxController.error,
    soundSfxController.error?.message ?? 'src/systems/sound/soundSfxController.js가 아직 없음',
  );
  return soundSfxController;
}

test('sound runtime helper modules expose graph and voice helpers', () => {
  const graphApi = getSoundGraphApi();
  const voicesApi = getSoundVoicesApi();
  const busRuntimeApi = getSoundBusRuntimeApi();
  const playbackRuntimeApi = getSoundPlaybackRuntimeApi();
  const systemStateApi = getSoundSystemStateApi();
  const systemLifecycleApi = getSoundSystemLifecycleApi();
  const playbackControllerApi = getSoundPlaybackControllerApi();
  const bgmControllerApi = getSoundBgmControllerApi();
  const sfxControllerApi = getSoundSfxControllerApi();

  assert.equal(typeof graphApi.createSoundGraph, 'function', 'createSoundGraph helper가 없음');
  assert.equal(typeof graphApi.disconnectSoundGraph, 'function', 'disconnectSoundGraph helper가 없음');
  assert.equal(typeof voicesApi.createBgmVoice, 'function', 'createBgmVoice helper가 없음');
  assert.equal(typeof voicesApi.scheduleBeepVoice, 'function', 'scheduleBeepVoice helper가 없음');
  assert.equal(typeof voicesApi.scheduleChordVoice, 'function', 'scheduleChordVoice helper가 없음');
  assert.equal(typeof busRuntimeApi.syncSoundBusVolumes, 'function', 'syncSoundBusVolumes helper가 없음');
  assert.equal(typeof busRuntimeApi.duckBgmBus, 'function', 'duckBgmBus helper가 없음');
  assert.equal(typeof busRuntimeApi.fadeSfxBus, 'function', 'fadeSfxBus helper가 없음');
  assert.equal(typeof busRuntimeApi.createStereoPanner, 'function', 'createStereoPanner helper가 없음');
  assert.equal(typeof playbackRuntimeApi.ensureSoundContextPlayable, 'function', 'ensureSoundContextPlayable helper가 없음');
  assert.equal(typeof playbackRuntimeApi.playBgmVoice, 'function', 'playBgmVoice helper가 없음');
  assert.equal(typeof playbackRuntimeApi.stopBgmVoice, 'function', 'stopBgmVoice helper가 없음');
  assert.equal(typeof systemStateApi.createSoundSystemState, 'function', 'createSoundSystemState helper가 없음');
  assert.equal(typeof systemStateApi.applySoundVolumeSettings, 'function', 'applySoundVolumeSettings helper가 없음');
  assert.equal(typeof systemStateApi.applySoundEnabledState, 'function', 'applySoundEnabledState helper가 없음');
  assert.equal(typeof systemStateApi.resetSoundSystemRuntime, 'function', 'resetSoundSystemRuntime helper가 없음');
  assert.equal(typeof systemLifecycleApi.initSoundSystemContext, 'function', 'initSoundSystemContext helper가 없음');
  assert.equal(typeof systemLifecycleApi.unlockSoundSystemContext, 'function', 'unlockSoundSystemContext helper가 없음');
  assert.equal(typeof systemLifecycleApi.destroySoundSystemContext, 'function', 'destroySoundSystemContext helper가 없음');
  assert.equal(typeof playbackControllerApi.playSoundEffect, 'function', 'playSoundEffect helper가 없음');
  assert.equal(typeof playbackControllerApi.playSoundBgm, 'function', 'playSoundBgm helper가 없음');
  assert.equal(typeof playbackControllerApi.stopSoundBgm, 'function', 'stopSoundBgm helper가 없음');
  assert.equal(typeof bgmControllerApi.playSoundBgm, 'function', 'sound bgm controller helper가 없음');
  assert.equal(typeof bgmControllerApi.stopSoundBgm, 'function', 'sound bgm stop helper가 없음');
  assert.equal(typeof sfxControllerApi.playSoundEffect, 'function', 'sound sfx controller helper가 없음');
  assert.equal(typeof sfxControllerApi.stopAllSoundEffects, 'function', 'sound sfx stop helper가 없음');
});

summary();
