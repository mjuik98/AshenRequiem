import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test, summary } from './helpers/testRunner.js';
import { renderPauseTabNavigation, renderPauseTabPanels } from '../src/ui/pause/pauseViewSections.js';
import { renderPauseStats } from '../src/ui/pause/pauseStatsContent.js';
import { PAUSE_VIEW_CSS } from '../src/ui/pause/pauseStyles.js';
import { PAUSE_TOOLTIP_SELECTORS } from '../src/ui/pause/pauseTooltipController.js';
import { createPauseOverlayConfig } from '../src/scenes/play/playSceneOverlays.js';

const pauseViewSource = readFileSync(new URL('../src/ui/pause/PauseView.js', import.meta.url), 'utf8');
const pauseViewBindingsSource = readFileSync(new URL('../src/ui/pause/pauseViewBindings.js', import.meta.url), 'utf8');
const playUiSource = readFileSync(new URL('../src/scenes/play/PlayUI.js', import.meta.url), 'utf8');
const titleSceneSource = readFileSync(new URL('../src/scenes/TitleScene.js', import.meta.url), 'utf8');
const keyboardAdapterSource = readFileSync(new URL('../src/input/KeyboardAdapter.js', import.meta.url), 'utf8');
const inputStateSource = readFileSync(new URL('../src/input/InputState.js', import.meta.url), 'utf8');

console.log('\n[Pause/Input Source]');

test('ESC 모달은 메인메뉴 버튼 마크업을 포함하지 않는다', () => {
  assert.equal(pauseViewSource.includes('pv-btn-menu'), false, 'PauseView에 메인메뉴 버튼 코드가 남아 있음');
  assert.equal(pauseViewSource.includes('메인메뉴'), false, 'PauseView에 메인메뉴 텍스트가 남아 있음');
  const config = createPauseOverlayConfig({
    world: { player: null },
    data: {},
    session: {},
    isBlocked: () => false,
    transitionPlayMode: () => {},
    hidePause: () => {},
    onOptionsChange: () => {},
  });
  assert.equal('onMainMenu' in config, false, 'Pause overlay config가 메인메뉴 콜백을 여전히 노출함');
});

test('ESC 모달은 기존보다 넓은 패널 폭을 사용한다', () => {
  assert.match(
    PAUSE_VIEW_CSS,
    /width:\s*min\(9\d{2}px,\s*calc\(100vw\s*-\s*24px\)\)/,
    'PauseView 패널 폭이 900px대의 확장 폭으로 설정되지 않음',
  );
});

test('ESC 모달의 기본 탭은 로드아웃이며 무기/장신구 탭은 제거된다', () => {
  const navHtml = renderPauseTabNavigation({
    activeTabName: 'loadout',
    weaponCount: 2,
    maxWpnSlots: 3,
    accessoryCount: 1,
    maxAccSlots: 3,
  });
  assert.equal(navHtml.includes('data-tab-name="loadout"'), true, '로드아웃 탭이 렌더되지 않음');
  assert.equal(navHtml.includes('data-tab-name="weapons"'), false, '무기 탭이 아직 렌더됨');
  assert.equal(navHtml.includes('data-tab-name="accessories"'), false, '장신구 탭이 아직 렌더됨');
});

test('PauseView는 로드아웃 helper와 선택 상태를 통합한다', () => {
  assert.equal(
    pauseViewSource.includes('buildPauseLoadoutItems'),
    true,
    'PauseView가 통합 로드아웃 항목 helper를 사용하지 않음',
  );
  assert.equal(
    pauseViewSource.includes('getDefaultPauseSelection'),
    true,
    'PauseView가 기본 선택 helper를 사용하지 않음',
  );
  assert.equal(
    pauseViewSource.includes('renderPauseLoadoutPanel'),
    true,
    'PauseView가 통합 로드아웃 패널 helper를 사용하지 않음',
  );
  assert.equal(
    pauseViewSource.includes('applyPauseTabState'),
    true,
    'PauseView가 탭 상태 반영 helper를 사용하지 않음',
  );
  assert.equal(
    pauseViewSource.includes('emitPauseOptionsChange'),
    true,
    'PauseView가 옵션 변경 emit helper를 사용하지 않음',
  );
  assert.equal(
    pauseViewSource.includes('positionPauseTooltip'),
    true,
    'PauseView가 tooltip 위치 helper를 사용하지 않음',
  );
  assert.equal(
    pauseViewSource.includes('normalizePauseSynergyRequirementId'),
    true,
    'PauseView가 공유 시너지 requirement 정규화 helper를 사용하지 않음',
  );
  assert.match(
    pauseViewSource,
    /_activeTabName\s*=\s*'loadout'/,
    'PauseView 기본 탭 상태가 여전히 로드아웃이 아님',
  );
  assert.equal(
    pauseViewSource.includes('_selectedLoadoutKey'),
    true,
    'PauseView에 선택된 로드아웃 상태가 없음',
  );
  assert.equal(
    pauseViewSource.includes('_resolveSelectedLoadoutKey'),
    true,
    'PauseView가 재오픈 시 선택 상태를 복원하는 helper를 제공하지 않음',
  );
  assert.equal(
    pauseViewBindingsSource.includes('.pv-slot-card[data-loadout-key]'),
    true,
    'PauseView binding helper가 새 슬롯 카드 셀렉터로 선택 바인딩하지 않음',
  );
  assert.equal(
    PAUSE_TOOLTIP_SELECTORS.weapon,
    '.pv-slot-card[data-loadout="weapon"]',
    'PauseView가 새 슬롯 카드 셀렉터로 무기 툴팁을 바인딩하지 않음',
  );
  assert.equal(
    PAUSE_TOOLTIP_SELECTORS.accessory,
    '.pv-slot-card[data-loadout="accessory"]',
    'PauseView가 새 슬롯 카드 셀렉터로 장신구 툴팁을 바인딩하지 않음',
  );
});

test('ESC 모달은 재오픈 시 이전 로드아웃 선택을 유지할 수 있어야 한다', () => {
  assert.match(
    pauseViewSource,
    /this\._selectedLoadoutKey\s*=\s*this\._resolveSelectedLoadoutKey\(this\._loadoutItems\)/,
    'PauseView.show()가 이전 선택을 복원하지 않음',
  );
  const hideMethod = pauseViewSource.match(/hide\(\)\s*\{[\s\S]*?\n  \}/)?.[0] ?? '';
  assert.equal(
    hideMethod.includes('this._selectedLoadoutKey = null;'),
    false,
    'PauseView.hide()가 로드아웃 선택 상태를 즉시 초기화함',
  );
});

test('ESC 모달은 로드아웃 리스트와 상세 패널 셸을 노출한다', () => {
  const panelsHtml = renderPauseTabPanels({
    activeTabName: 'loadout',
    weapons: [],
    accessories: [],
    maxAccSlots: 3,
    weaponCardsHtml: '',
    accessoryGridHtml: '',
    statsHtml: '',
    soundControlsHtml: '',
  });
  assert.equal(panelsHtml.includes('pv-loadout-panel'), true, '로드아웃 패널 셸이 없음');
  assert.equal(panelsHtml.includes('pv-loadout-list'), true, '로드아웃 리스트 컨테이너가 없음');
  assert.equal(panelsHtml.includes('pv-loadout-detail'), true, '로드아웃 상세 컨테이너가 없음');
});

test('PauseView 스타일은 통합 로드아웃 카드와 반응형 마스터-디테일 레이아웃을 포함한다', () => {
  assert.match(
    PAUSE_VIEW_CSS,
    /\.pv-loadout-panel\s*\{[\s\S]*display:\s*grid[\s\S]*grid-template-columns:/,
    'PauseView 스타일에 로드아웃 마스터-디테일 레이아웃이 없음',
  );
  assert.match(
    PAUSE_VIEW_CSS,
    /\.pv-slot-card\.selected[\s\S]*border-color:|\.pv-slot-card\[aria-pressed="true"\][\s\S]*border-color:/,
    'PauseView 스타일에 선택된 슬롯 카드 상태가 없음',
  );
  ['state-rare', 'state-synergy-active', 'state-evolution-ready', 'state-empty', 'state-locked']
    .forEach((stateClass) => {
      assert.equal(
        PAUSE_VIEW_CSS.includes(`.pv-slot-card.${stateClass}`),
        true,
        `PauseView 스타일에 ${stateClass} 상태가 없음`,
      );
    });
  ['.pv-slot-section', '.pv-slot-cards', '.pv-slot-icon-box', '.pv-slot-dots', '.pv-loadout-stats-section', '.pv-loadout-lv-block']
    .forEach((className) => {
      assert.equal(
        PAUSE_VIEW_CSS.includes(className),
        true,
        `PauseView 스타일에 ${className}가 없음`,
      );
    });
  ['.pv-loadout-detail-hero', '.pv-loadout-detail-icon', '.pv-loadout-row-label', '.pv-loadout-row-value', '.variant-status', '.variant-links', '.variant-synergy', '.variant-evolution']
    .forEach((className) => {
      assert.equal(
        PAUSE_VIEW_CSS.includes(className),
        true,
        `PauseView 스타일에 ${className}가 없음`,
      );
    });
  assert.match(
    PAUSE_VIEW_CSS,
    /@media\s*\(max-width:\s*\d+px\)\s*\{[\s\S]*\.pv-loadout-panel\s*\{[\s\S]*grid-template-columns:\s*1fr/s,
    'PauseView 스타일에 좁은 화면용 로드아웃 스택 레이아웃이 없음',
  );
});

test('ESC 상세 패널의 상태/연결/진화 텍스트는 명시적인 대비 색을 가진다', () => {
  assert.match(
    PAUSE_VIEW_CSS,
    /\.pv-loadout-power-row,\s*\.pv-loadout-link-row,\s*\.pv-loadout-synergy-head,\s*\.pv-loadout-evolution-head\s*\{[\s\S]*color:/,
    '상태/연결/진화 행 컨테이너에 기본 텍스트 색이 없음',
  );
  ['.pv-loadout-link-key', '.pv-loadout-link-val', '.pv-loadout-synergy-state', '.pv-loadout-evolution-name', '.pv-loadout-evolution-state']
    .forEach((className) => {
      assert.match(
        PAUSE_VIEW_CSS,
        new RegExp(`${className.replace('.', '\\.')}\\s*\\{[\\s\\S]*color:`),
        `${className}에 명시적인 텍스트 색이 없음`,
      );
    });
});

test('ESC 상세 패널은 값 정렬, 섹션 강조, 모바일 행 스택을 위한 스타일 훅을 가진다', () => {
  assert.match(
    PAUSE_VIEW_CSS,
    /\.pv-loadout-row-value\s*\{[\s\S]*min-width:[\s\S]*text-align:\s*right/i,
    '상태 행 value 정렬 폭이 고정되지 않음',
  );
  ['.variant-status', '.variant-links', '.variant-synergy', '.variant-evolution']
    .forEach((className) => {
      assert.match(
        PAUSE_VIEW_CSS,
        new RegExp(`${className.replace('.', '\\.')}\\s*\\{[\\s\\S]*(border|background):`),
        `${className}에 섹션 강조 스타일이 없음`,
      );
    });
  assert.match(
    PAUSE_VIEW_CSS,
    /@media\s*\(max-width:\s*540px\)\s*\{[\s\S]*\.pv-loadout-power-row,\s*\.pv-loadout-link-row,\s*\.pv-loadout-synergy-head,\s*\.pv-loadout-evolution-head\s*\{[\s\S]*flex-direction:\s*column/s,
    '모바일에서 상세 패널 행을 2줄 스택으로 전환하는 스타일이 없음',
  );
});

test('ESC 상세 패널의 시너지/진화 영역은 실제 아이콘 칩과 미세 spacing 훅을 가진다', () => {
  ['.pv-loadout-meta-icon', '.pv-loadout-req-chips', '.pv-loadout-req-chip', '.pv-loadout-req-icon', '.pv-loadout-evolution-result']
    .forEach((className) => {
      assert.equal(
        PAUSE_VIEW_CSS.includes(className),
        true,
        `PauseView 스타일에 ${className}가 없음`,
      );
    });
  assert.match(
    PAUSE_VIEW_CSS,
    /\.pv-loadout-synergy-row,\s*\.pv-loadout-evolution-row\s*\{[\s\S]*padding:\s*12px 14px/i,
    '시너지/진화 row spacing 미세 조정이 반영되지 않음',
  );
  assert.match(
    PAUSE_VIEW_CSS,
    /\.pv-loadout-req-chip\s*\{[\s\S]*border-radius:\s*999px[\s\S]*gap:\s*6px/i,
    '요구 아이콘 칩의 spacing/shape가 정의되지 않음',
  );
});

test('PauseView는 레거시 무기/장신구 렌더 경로와 전용 스타일을 제거한다', () => {
  assert.equal(pauseViewSource.includes('_renderWeaponCard('), false, 'PauseView에 죽은 _renderWeaponCard 경로가 남아 있음');
  assert.equal(pauseViewSource.includes('_renderAccessoryGrid('), false, 'PauseView에 죽은 _renderAccessoryGrid 경로가 남아 있음');
  assert.equal(pauseViewSource.includes('.pv-wcard'), false, 'PauseView에 레거시 무기 카드 스타일이 남아 있음');
  assert.equal(pauseViewSource.includes('.pv-acard'), false, 'PauseView에 레거시 장신구 카드 스타일이 남아 있음');
  assert.equal(pauseViewSource.includes('WEAPON_TYPE_TAG'), false, 'PauseView에 레거시 무기 타입 태그 상수가 남아 있음');
  assert.equal(pauseViewSource.includes("req.startsWith('up_')"), false, 'PauseView에 중복된 requirement 정규화 로직이 남아 있음');
  assert.equal(pauseViewSource.includes("req.startsWith('get_')"), false, 'PauseView에 중복된 requirement 정규화 로직이 남아 있음');
});

test('ESC 모달은 사운드 탭과 키보드 바인딩을 유지한다', () => {
  const navHtml = renderPauseTabNavigation({
    activeTabName: 'sound',
    weaponCount: 0,
    maxWpnSlots: 3,
    accessoryCount: 0,
    maxAccSlots: 3,
  });
  const panelsHtml = renderPauseTabPanels({
    activeTabName: 'sound',
    weapons: [],
    accessories: [],
    maxAccSlots: 3,
    weaponCardsHtml: '',
    accessoryGridHtml: '',
    statsHtml: '',
    soundControlsHtml: '<div data-sound-controls="present">sound</div>',
  });
  assert.equal(navHtml.includes('data-tab-name="sound"'), true, '사운드 탭이 렌더되지 않음');
  assert.equal(panelsHtml.includes('data-sound-controls="present"'), true, '사운드 패널 셸이 사운드 컨트롤을 포함하지 않음');
});

test('ESC 스탯에는 투사체 크기/범위, 속도, 지속시간 항목이 포함된다', () => {
  const statsHtml = renderPauseStats({
    player: {
      projectileSizeMult: 1.2,
      projectileSpeedMult: 1.15,
      projectileLifetimeMult: 1.1,
    },
    activeSynergies: [],
    session: { meta: { currency: 0 } },
  });
  assert.equal(statsHtml.includes('투사체 크기/범위'), true, 'PauseView 스탯에 투사체 크기/범위가 없음');
  assert.equal(statsHtml.includes('투사체 속도'), true, 'PauseView 스탯에 투사체 속도가 없음');
  assert.equal(statsHtml.includes('투사체 지속시간'), true, 'PauseView 스탯에 투사체 지속시간이 없음');
});

test('ESC 스탯의 시너지 보너스 포맷터는 정의된 helper를 사용한다', () => {
  const statsHtml = renderPauseStats({
    player: {},
    activeSynergies: [
      {
        id: 'storm_chain',
        name: '폭풍 연쇄',
        description: '연쇄 공격 속도 증가',
        bonus: { speedMult: 1.25 },
      },
    ],
    session: { meta: { currency: 0 } },
  });
  assert.equal(
    statsHtml.includes('속도 ×1.25'),
    true,
    'Pause stats가 시너지 보너스 포맷 helper를 사용하지 않음',
  );
  assert.equal(
    pauseViewSource.includes('_formatSynergyBonus('),
    false,
    'PauseView에 정의되지 않은 _formatSynergyBonus 호출이 남아 있음',
  );
});

test('백틱 디버그 패널 관련 UI와 입력이 제거된다', () => {
  assert.equal(playUiSource.includes('DebugView'), false, 'PlayUI에 DebugView 참조가 남아 있음');
  assert.equal(titleSceneSource.includes('디버그:'), false, 'TitleScene에 디버그 안내 문구가 남아 있음');
  assert.equal(keyboardAdapterSource.includes("actions.add('debug')"), false, 'KeyboardAdapter가 debug 액션을 여전히 추가함');
  assert.equal(inputStateSource.includes("actions.has('debug')"), false, 'InputState가 debug 액션 하위 호환을 여전히 유지함');
});

summary();
