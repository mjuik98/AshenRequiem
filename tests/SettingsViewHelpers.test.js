import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { makeSessionState } from './fixtures/index.js';
import {
  SETTINGS_TABS,
  renderSettingsAudioSection,
  renderSettingsControlsSection,
  renderSettingsDataSection,
  renderSettingsDisplaySection,
  renderSettingsGraphicsSection,
  renderSettingsNavItem,
} from '../src/ui/settings/settingsViewSections.js';
import {
  SETTINGS_VIEW_CSS,
  SETTINGS_VIEW_STYLE_ID,
} from '../src/ui/settings/settingsViewStyles.js';

const { test, summary } = createRunner('SettingsViewHelpers');

console.log('\n[SettingsViewHelpers]');

test('settings section renderers는 탭별 핵심 마크업을 생성한다', () => {
  const session = makeSessionState({
    options: {
      quality: 'high',
      showFps: true,
      useDevicePixelRatio: false,
    },
  });

  const audioHtml = renderSettingsAudioSection(session.options);
  assert.equal(audioHtml.includes('마스터 볼륨'), true);
  assert.equal(audioHtml.includes('data-key="masterVolume"'), true);
  assert.equal(audioHtml.includes('BGM 활성화'), true);

  const graphicsHtml = renderSettingsGraphicsSection(session.options);
  assert.equal(graphicsHtml.includes('렌더링 품질'), true);
  assert.equal(graphicsHtml.includes('sv-quality-active'), true);
  assert.equal(graphicsHtml.includes('발광 효과 (Glow)'), true);

  const displayHtml = renderSettingsDisplaySection(session.options);
  assert.equal(displayHtml.includes('고해상도 렌더링 (DPR)'), true);
  assert.equal(displayHtml.includes('FPS 표시'), true);
  assert.equal(displayHtml.includes('모션 감소'), true);
  assert.equal(displayHtml.includes('HUD 가독성 강화'), true);
  assert.equal(displayHtml.includes('큰 글씨 UI'), true);
  assert.equal(displayHtml.includes('화면 설정은 저장 즉시 적용됩니다.'), true);

  const controlsHtml = renderSettingsControlsSection();
  assert.equal(controlsHtml.includes('화면 왼쪽 절반 드래그'), true);
  assert.equal(controlsHtml.includes('data-binding-action="moveUp"'), true);
  assert.equal(controlsHtml.includes('data-binding-action="pause"'), true);
  assert.equal(controlsHtml.includes('키 바인딩은 저장 즉시 다음 입력부터 적용됩니다.'), true);

  const dataHtml = renderSettingsDataSection({ importText: '{"meta":{"currency":10}}' });
  assert.equal(dataHtml.includes('세이브 데이터'), true);
  assert.equal(dataHtml.includes('sv-data-layout'), true);
  assert.equal(dataHtml.includes('sv-data-editor'), true);
  assert.equal(dataHtml.includes('sv-data-status-box'), true);
  assert.equal(dataHtml.includes('스냅샷 작업'), true);
  assert.equal(dataHtml.includes('보관 및 복구'), true);
  assert.equal(dataHtml.includes('위험 작업'), true);
  assert.equal(dataHtml.includes('내보내기'), true);
  assert.equal(dataHtml.includes('가져오기'), true);
  assert.equal(dataHtml.includes('가져오기 미리보기'), true);
  assert.equal(dataHtml.includes('저장소 분석'), true);
  assert.equal(dataHtml.includes('백업 복구'), true);
  assert.equal(dataHtml.includes('진행 초기화'), true);
});

test('settings nav renderer는 활성 탭 상태와 아이콘 마크업을 제공한다', () => {
  assert.equal(SETTINGS_TABS.length, 5);

  const activeHtml = renderSettingsNavItem('graphics', 'graphics');
  assert.equal(activeHtml.includes('sv-nav-active'), true);
  assert.equal(activeHtml.includes('aria-selected="true"'), true);

  const inactiveHtml = renderSettingsNavItem('audio', 'graphics');
  assert.equal(inactiveHtml.includes('sv-nav-active'), false);
  assert.equal(inactiveHtml.includes('aria-selected="false"'), true);
});

test('settings styles는 별도 모듈에서 관리되고 모바일 레이아웃 규칙을 포함한다', () => {
  assert.equal(SETTINGS_VIEW_STYLE_ID, 'sv-styles');
  assert.equal(SETTINGS_VIEW_CSS.includes('.sv-quality-grid'), true);
  assert.equal(SETTINGS_VIEW_CSS.includes('.sv-keybind-note-badge'), true);
  assert.equal(SETTINGS_VIEW_CSS.includes('.sv-binding-select'), true);
  assert.equal(SETTINGS_VIEW_CSS.includes('.sv-data-box'), true);
  assert.equal(SETTINGS_VIEW_CSS.includes('.sv-data-status-box'), true);
  assert.equal(SETTINGS_VIEW_CSS.includes('@media (max-width: 780px)'), true);
  assert.equal(SETTINGS_VIEW_CSS.includes('@keyframes sv-enter'), true);
});

summary();
