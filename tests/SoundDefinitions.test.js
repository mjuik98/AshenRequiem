import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';

console.log('\n[SoundDefinitions]');

const { test, summary } = createRunner('SoundDefinitions');

let soundDefinitions = null;
try {
  soundDefinitions = await import('../src/systems/sound/soundDefinitions.js');
} catch (error) {
  soundDefinitions = { error };
}

function getSoundDefinitions() {
  assert.ok(
    !soundDefinitions.error,
    soundDefinitions.error?.message ?? 'src/systems/sound/soundDefinitions.js가 아직 없음',
  );
  return soundDefinitions;
}

test('sound definitions module exposes shared SFX/BGM contracts', () => {
  const defs = getSoundDefinitions();

  assert.equal(typeof defs.SOUND_SFX_DEFS, 'object', 'SOUND_SFX_DEFS export가 없음');
  assert.equal(typeof defs.SOUND_BGM_DEFS, 'object', 'SOUND_BGM_DEFS export가 없음');
  assert.equal(typeof defs.cloneSoundSfxDefs, 'function', 'cloneSoundSfxDefs가 없음');
  assert.equal(typeof defs.cloneSoundBgmDefs, 'function', 'cloneSoundBgmDefs가 없음');
});

test('shared sound definitions keep expected battle/title keys', () => {
  const defs = getSoundDefinitions();

  assert.equal('hit' in defs.SOUND_SFX_DEFS, true, 'hit SFX 정의가 없음');
  assert.equal('levelup' in defs.SOUND_SFX_DEFS, true, 'levelup SFX 정의가 없음');
  assert.equal('title' in defs.SOUND_BGM_DEFS, true, 'title BGM 정의가 없음');
  assert.equal('battle' in defs.SOUND_BGM_DEFS, true, 'battle BGM 정의가 없음');
  assert.equal('boss' in defs.SOUND_BGM_DEFS, true, 'boss BGM 정의가 없음');
});

summary();
