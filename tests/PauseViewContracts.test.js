import assert from 'node:assert/strict';
import { test, summary } from './helpers/testRunner.js';
import {
  buildPauseLoadoutItems,
  getDefaultPauseSelection,
  normalizePauseSynergyRequirementId,
} from '../src/ui/pause/pauseLoadoutContent.js';
import { PAUSE_AUDIO_CSS } from '../src/ui/pause/pauseAudioStyles.js';
import { PAUSE_LAYOUT_CSS } from '../src/ui/pause/pauseLayoutStyles.js';
import { PAUSE_LOADOUT_CSS } from '../src/ui/pause/pauseLoadoutStyles.js';
import { PAUSE_RESPONSIVE_CSS } from '../src/ui/pause/pauseResponsiveStyles.js';
import { renderPauseStats } from '../src/ui/pause/pauseStatsContent.js';
import { PAUSE_VIEW_CSS } from '../src/ui/pause/pauseStyles.js';
import { PAUSE_TOOLTIP_SELECTORS } from '../src/ui/pause/pauseTooltipController.js';
import {
  applyPauseViewShowState,
  resetPauseViewRuntime,
} from '../src/ui/pause/pauseViewLifecycle.js';
import {
  buildPauseViewIndexes,
  resolvePauseSelectedLoadoutKey,
} from '../src/ui/pause/pauseViewModel.js';
import {
  renderPauseTabNavigation,
  renderPauseTabPanels,
  renderPauseHeader,
} from '../src/ui/pause/pauseViewSections.js';

console.log('\n[PauseViewContracts]');

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

test('ESC 헤더는 핵심 런 정보만 남기고 레벨 메타는 제거한다', () => {
  const headerHtml = renderPauseHeader({
    timeStr: '03:42',
    killStr: 87,
    level: 8,
    hp: 68,
    maxHp: 100,
    hpPct: 68,
    hpFillClass: 'high',
    hpFillColor: '#c0392b',
    hpPctColor: '#ffffff',
  });
  const runStatCount = (headerHtml.match(/class="pv-run-stat"/g) ?? []).length;

  assert.equal(runStatCount, 2, '헤더에 핵심 런 정보 외 메타가 남아 있음');
  assert.equal(headerHtml.includes('레벨'), false, '헤더 런 정보에 레벨 메타가 여전히 노출됨');
  assert.equal(headerHtml.includes('생존'), true, '헤더에 생존 시간이 없음');
  assert.equal(headerHtml.includes('킬'), true, '헤더에 킬 수가 없음');
  assert.equal(headerHtml.includes('HP'), true, '헤더에 HP 섹션이 없음');
});

test('PauseView runtime helper는 로드아웃 선택과 시너지 인덱스를 유지한다', () => {
  const player = {
    weapons: [{ id: 'magic_bolt', name: 'Magic Bolt', level: 2, maxLevel: 5 }],
    accessories: [{ id: 'iron_heart', name: 'Iron Heart', level: 1, rarity: 'common' }],
    maxWeaponSlots: 3,
    maxAccessorySlots: 3,
    activeSynergies: ['storm_iron'],
  };
  const data = {
    weaponData: [{ id: 'magic_bolt', name: 'Magic Bolt' }],
    accessoryData: [{ id: 'iron_heart', name: 'Iron Heart' }],
    synergyData: [{ id: 'storm_iron', requires: ['up_magic_bolt', 'acc_iron_heart'] }],
  };
  const items = buildPauseLoadoutItems({ player });
  const indexes = buildPauseViewIndexes(data);
  const accessorySelectionKey = items.find((item) => item.kind === 'accessory')?.selectionKey;
  const view = {
    _ttHideTimer: null,
    _selectedLoadoutKey: accessorySelectionKey,
  };

  assert.equal(getDefaultPauseSelection({ player })?.selectionKey, 'weapon:0', '기본 로드아웃 선택이 첫 무기가 아님');
  assert.equal(resolvePauseSelectedLoadoutKey(items, accessorySelectionKey, player), accessorySelectionKey, '기존 선택을 복원하지 않음');
  assert.equal(resolvePauseSelectedLoadoutKey(items, 'missing', player), 'weapon:0', '유효하지 않은 선택이 기본값으로 대체되지 않음');
  assert.equal(normalizePauseSynergyRequirementId('up_magic_bolt'), 'magic_bolt', '무기 requirement 정규화가 실패함');
  assert.equal(normalizePauseSynergyRequirementId('acc_iron_heart'), 'iron_heart', '장신구 requirement 정규화가 실패함');
  assert.equal(indexes.synergiesByWeaponId.get('magic_bolt')?.[0]?.id, 'storm_iron', '무기 시너지 인덱스가 구축되지 않음');
  assert.equal(indexes.synergiesByAccessoryId.get('iron_heart')?.[0]?.id, 'storm_iron', '장신구 시너지 인덱스가 구축되지 않음');

  applyPauseViewShowState(view, {
    player,
    data,
    onResume: () => {},
    session: { options: { masterVolume: 0.4 } },
  });

  assert.equal(view._activeTabName, 'loadout', 'PauseView 기본 탭 상태가 로드아웃이 아님');
  assert.equal(view._selectedLoadoutKey, accessorySelectionKey, 'PauseView가 이전 로드아웃 선택을 복원하지 않음');
  assert.equal(view._loadoutItems.length, 6, 'PauseView가 장비/빈 슬롯 통합 로드아웃을 만들지 않음');

  resetPauseViewRuntime(view);
  assert.equal(view._selectedLoadoutKey, accessorySelectionKey, 'PauseView reset이 재오픈용 선택 상태를 지워버림');

  resetPauseViewRuntime(view, { clearSelection: true });
  assert.equal(view._selectedLoadoutKey, null, 'PauseView destroy reset이 선택 상태를 지우지 않음');
});

test('PauseView 시너지 인덱스는 같은 시너지를 정규화 과정에서 중복 등록하지 않는다', () => {
  const indexes = buildPauseViewIndexes({
    weaponData: [{ id: 'lightning_ring', name: 'Lightning Ring' }],
    accessoryData: [],
    synergyData: [{
      id: 'orbital_fortress',
      requires: ['lightning_ring', 'up_lightning_ring'],
    }],
  });

  assert.equal(indexes.synergiesByWeaponId.get('lightning_ring')?.length, 1, '정규화된 동일 시너지가 중복 등록됨');
});

test('PauseView 스타일은 fragment CSS를 조합해 구성된다', () => {
  assert.equal(PAUSE_VIEW_CSS.includes(PAUSE_LAYOUT_CSS.trim()), true, 'pause layout fragment가 최종 CSS에 포함되지 않음');
  assert.equal(PAUSE_VIEW_CSS.includes(PAUSE_LOADOUT_CSS.trim()), true, 'pause loadout fragment가 최종 CSS에 포함되지 않음');
  assert.equal(PAUSE_VIEW_CSS.includes(PAUSE_AUDIO_CSS.trim()), true, 'pause audio fragment가 최종 CSS에 포함되지 않음');
  assert.equal(PAUSE_VIEW_CSS.includes(PAUSE_RESPONSIVE_CSS.trim()), true, 'pause responsive fragment가 최종 CSS에 포함되지 않음');
});

test('ESC 모달은 로드아웃 리스트와 상세 패널 셸을 노출한다', () => {
  const panelsHtml = renderPauseTabPanels({
    activeTabName: 'loadout',
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
  ['.pv-slot-section', '.pv-slot-cards', '.pv-slot-icon-box', '.pv-slot-desc', '.pv-slot-dots', '.pv-loadout-stats-section', '.pv-loadout-lv-block']
    .forEach((className) => {
      assert.equal(
        PAUSE_VIEW_CSS.includes(className),
        true,
        `PauseView 스타일에 ${className}가 없음`,
      );
    });
  assert.equal(
    PAUSE_VIEW_CSS.includes('.pv-loadout-overview'),
    false,
    'PauseView 스타일에 제거된 overview 카드 스타일이 아직 남아 있음',
  );
  ['.pv-loadout-detail-hero', '.pv-loadout-detail-icon', '.pv-loadout-detail-tags', '.pv-loadout-detail-tag', '.pv-loadout-row-label', '.pv-loadout-row-value', '.variant-status', '.variant-links', '.variant-synergy', '.variant-evolution']
    .forEach((className) => {
      assert.equal(
        PAUSE_VIEW_CSS.includes(className),
        true,
        `PauseView 스타일에 ${className}가 없음`,
      );
    });
  ['.pv-loadout-guidance', '.variant-guidance']
    .forEach((className) => {
      assert.equal(
        PAUSE_VIEW_CSS.includes(className),
        false,
        `PauseView 스타일에 제거된 ${className}가 여전히 남아 있음`,
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

test('ESC 모달은 사운드 탭과 사운드 패널 셸을 유지한다', () => {
  const navHtml = renderPauseTabNavigation({
    activeTabName: 'sound',
    weaponCount: 0,
    maxWpnSlots: 3,
    accessoryCount: 0,
    maxAccSlots: 3,
  });
  const panelsHtml = renderPauseTabPanels({
    activeTabName: 'sound',
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

test('ESC 스탯에는 현재 저주 수치가 포함된다', () => {
  const statsHtml = renderPauseStats({
    player: {
      curse: 0.35,
    },
    activeSynergies: [],
    session: { meta: { currency: 0 } },
  });
  assert.equal(statsHtml.includes('저주'), true, 'PauseView 스탯에 저주 항목이 없음');
  assert.equal(statsHtml.includes('35'), true, 'PauseView 스탯이 현재 저주 수치를 표시하지 않음');
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
});

test('Pause tooltip selector는 통합 로드아웃 카드 기준을 사용한다', () => {
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

summary();
