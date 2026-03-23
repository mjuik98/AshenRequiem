import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test, summary } from './helpers/testRunner.js';
import {
  SESSION_OPTION_DEFAULTS,
  applySessionOptionsToRuntime,
  getEffectiveDevicePixelRatio,
} from '../src/state/sessionOptions.js';
import { PAUSE_AUDIO_DEFAULTS } from '../src/ui/pause/pauseAudioControls.js';
import { syncPlaySceneDevicePixelRatio } from '../src/scenes/play/playSceneFlow.js';

const playSceneSource = readFileSync(new URL('../src/scenes/PlayScene.js', import.meta.url), 'utf8');
const settingsSceneSource = readFileSync(new URL('../src/scenes/SettingsScene.js', import.meta.url), 'utf8');
const settingsViewSource = readFileSync(new URL('../src/ui/settings/SettingsView.js', import.meta.url), 'utf8');
const pauseViewSource = readFileSync(new URL('../src/ui/pause/PauseView.js', import.meta.url), 'utf8');
const pauseAudioSource = readFileSync(new URL('../src/ui/pause/pauseAudioControls.js', import.meta.url), 'utf8');
const codexSceneSource = readFileSync(new URL('../src/scenes/CodexScene.js', import.meta.url), 'utf8');
const codexHandlerSource = readFileSync(new URL('../src/systems/event/codexHandler.js', import.meta.url), 'utf8');
const collisionSystemSource = readFileSync(new URL('../src/systems/combat/CollisionSystem.js', import.meta.url), 'utf8');
const enemyMovementSystemSource = readFileSync(new URL('../src/systems/movement/EnemyMovementSystem.js', import.meta.url), 'utf8');
const statusEffectSystemSource = readFileSync(new URL('../src/systems/combat/StatusEffectSystem.js', import.meta.url), 'utf8');
const bossHudViewSource = readFileSync(new URL('../src/ui/boss/BossHudView.js', import.meta.url), 'utf8');

console.log('\n[CentralizationSource]');

test('씬과 UI는 공통 세션 옵션 모듈을 사용한다', () => {
  assert.equal(playSceneSource.includes('applySessionOptionsToRuntime'), true, 'PlayScene이 공통 옵션 적용 헬퍼를 사용하지 않음');
  assert.equal(settingsSceneSource.includes('updateSessionOptionsAndSave'), true, 'SettingsScene이 공통 옵션 저장 facade를 사용하지 않음');
  assert.equal(settingsSceneSource.includes('applySessionOptionsToRuntime'), true, 'SettingsScene이 공통 옵션 적용 헬퍼를 사용하지 않음');
  assert.equal(settingsViewSource.includes('SESSION_OPTION_DEFAULTS'), true, 'SettingsView가 공통 옵션 기본값을 사용하지 않음');
  assert.equal(pauseViewSource.includes('PAUSE_AUDIO_DEFAULTS'), true, 'PauseView가 공통 pause 오디오 기본값 helper를 사용하지 않음');
  assert.equal(pauseAudioSource.includes('SESSION_OPTION_DEFAULTS'), true, 'Pause audio helper가 공통 옵션 기본값을 사용하지 않음');
  assert.equal(PAUSE_AUDIO_DEFAULTS.masterVolume, SESSION_OPTION_DEFAULTS.masterVolume, 'Pause audio 기본값이 세션 옵션 기본값과 어긋남');

  const runtimeCalls = [];
  applySessionOptionsToRuntime({ useDevicePixelRatio: false, glowEnabled: false }, {
    renderer: {
      setGlowEnabled(value) {
        runtimeCalls.push(['glow', value]);
      },
      setQualityPreset() {},
    },
  });
  assert.deepEqual(runtimeCalls, [['glow', false]]);
  assert.equal(getEffectiveDevicePixelRatio({ useDevicePixelRatio: false }, 2, true), 1);
  assert.equal(
    syncPlaySceneDevicePixelRatio({
      sessionOptions: { useDevicePixelRatio: false },
      currentDpr: 2,
      devicePixelRatio: 2,
    }).dpr,
    1,
    'PlayScene flow helper가 공통 DPR 계산을 사용하지 않음',
  );
});

test('gameData 접근은 Game 인스턴스 기준으로 일원화된다', () => {
  assert.equal(playSceneSource.includes('GameDataLoader.clone(this.game.gameData)'), true, 'PlayScene이 Game의 gameData 복제 경로를 사용하지 않음');
  assert.equal(playSceneSource.includes('GameDataLoader.loadDefault()'), false, 'PlayScene이 여전히 loadDefault를 직접 호출함');
  assert.equal(codexSceneSource.includes('this.game.gameData'), true, 'CodexScene이 Game.gameData를 사용하지 않음');
  assert.equal(codexSceneSource.includes('GameDataLoader.loadDefault()'), false, 'CodexScene이 여전히 loadDefault를 직접 호출함');
});

test('엔티티 생존 판정은 entityUtils 헬퍼로 통일된다', () => {
  assert.equal(collisionSystemSource.includes('isLive'), true, 'CollisionSystem이 isLive 헬퍼를 사용하지 않음');
  assert.equal(enemyMovementSystemSource.includes('isLive'), true, 'EnemyMovementSystem이 isLive 헬퍼를 사용하지 않음');
  assert.equal(statusEffectSystemSource.includes('isLive'), true, 'StatusEffectSystem이 isLive 헬퍼를 사용하지 않음');
  assert.equal(bossHudViewSource.includes('isLive'), true, 'BossHudView가 isLive 헬퍼를 사용하지 않음');
});

test('Codex 메타 초기화는 단일 헬퍼로 중앙화된다', () => {
  assert.equal(codexSceneSource.includes('ensureCodexMeta'), true, 'CodexScene이 공통 Codex 메타 헬퍼를 사용하지 않음');
  assert.equal(codexSceneSource.includes('reconcileSessionUnlocks'), true, 'CodexScene이 기존 누적 해금 보정 헬퍼를 사용하지 않음');
  assert.equal(codexHandlerSource.includes('ensureCodexMeta'), true, 'codexHandler가 공통 Codex 메타 헬퍼를 사용하지 않음');
});

summary();
