import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test, summary } from './helpers/testRunner.js';
import { renderPauseTabNavigation, renderPauseTabPanels } from '../src/ui/pause/pauseViewSections.js';

const pauseViewSource = readFileSync(new URL('../src/ui/pause/PauseView.js', import.meta.url), 'utf8');
const playUiSource = readFileSync(new URL('../src/scenes/play/PlayUI.js', import.meta.url), 'utf8');
const playSceneSource = readFileSync(new URL('../src/scenes/PlayScene.js', import.meta.url), 'utf8');
const titleSceneSource = readFileSync(new URL('../src/scenes/TitleScene.js', import.meta.url), 'utf8');
const keyboardAdapterSource = readFileSync(new URL('../src/input/KeyboardAdapter.js', import.meta.url), 'utf8');
const inputStateSource = readFileSync(new URL('../src/input/InputState.js', import.meta.url), 'utf8');

console.log('\n[Pause/Input Source]');

test('ESC 모달은 메인메뉴 버튼 마크업을 포함하지 않는다', () => {
  assert.equal(pauseViewSource.includes('pv-btn-menu'), false, 'PauseView에 메인메뉴 버튼 코드가 남아 있음');
  assert.equal(pauseViewSource.includes('메인메뉴'), false, 'PauseView에 메인메뉴 텍스트가 남아 있음');
  assert.equal(playSceneSource.includes('onMainMenu'), false, 'PlayScene이 pause onMainMenu 콜백을 여전히 전달함');
});

test('ESC 모달은 기존보다 넓은 패널 폭을 사용한다', () => {
  assert.match(
    pauseViewSource,
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
    pauseViewSource.includes('.pv-slot-card[data-loadout-key]'),
    true,
    'PauseView가 새 슬롯 카드 셀렉터로 선택 바인딩하지 않음',
  );
  assert.equal(
    pauseViewSource.includes('.pv-slot-card[data-loadout="weapon"]'),
    true,
    'PauseView가 새 슬롯 카드 셀렉터로 무기 툴팁을 바인딩하지 않음',
  );
  assert.equal(
    pauseViewSource.includes('.pv-slot-card[data-loadout="accessory"]'),
    true,
    'PauseView가 새 슬롯 카드 셀렉터로 장신구 툴팁을 바인딩하지 않음',
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
    pauseViewSource,
    /\.pv-loadout-panel\s*\{[\s\S]*display:\s*grid[\s\S]*grid-template-columns:/,
    'PauseView 스타일에 로드아웃 마스터-디테일 레이아웃이 없음',
  );
  assert.match(
    pauseViewSource,
    /\.pv-slot-card\.selected[\s\S]*border-color:|\.pv-slot-card\[aria-pressed="true"\][\s\S]*border-color:/,
    'PauseView 스타일에 선택된 슬롯 카드 상태가 없음',
  );
  ['state-rare', 'state-synergy-active', 'state-evolution-ready', 'state-empty', 'state-locked']
    .forEach((stateClass) => {
      assert.equal(
        pauseViewSource.includes(`.pv-slot-card.${stateClass}`),
        true,
        `PauseView 스타일에 ${stateClass} 상태가 없음`,
      );
    });
  ['.pv-slot-section', '.pv-slot-cards', '.pv-slot-icon-box', '.pv-slot-dots', '.pv-loadout-stats-section', '.pv-loadout-lv-block']
    .forEach((className) => {
      assert.equal(
        pauseViewSource.includes(className),
        true,
        `PauseView 스타일에 ${className}가 없음`,
      );
    });
  assert.match(
    pauseViewSource,
    /@media\s*\(max-width:\s*\d+px\)\s*\{[\s\S]*\.pv-loadout-panel\s*\{[\s\S]*grid-template-columns:\s*1fr/s,
    'PauseView 스타일에 좁은 화면용 로드아웃 스택 레이아웃이 없음',
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

test('ESC 스탯에는 투사체 크기/범위와 지속시간 항목이 포함된다', () => {
  assert.equal(pauseViewSource.includes('투사체 크기/범위'), true, 'PauseView 스탯에 투사체 크기/범위가 없음');
  assert.equal(pauseViewSource.includes('투사체 지속시간'), true, 'PauseView 스탯에 투사체 지속시간이 없음');
});

test('ESC 스탯의 시너지 보너스 포맷터는 정의된 helper를 사용한다', () => {
  assert.equal(
    pauseViewSource.includes('formatWeaponSynergyBonus'),
    true,
    'PauseView가 시너지 보너스 포맷터를 import/사용하지 않음',
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
