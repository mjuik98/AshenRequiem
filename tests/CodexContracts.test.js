import assert from 'node:assert/strict';
import { test, summary } from './helpers/testRunner.js';
import { makeSessionState } from './fixtures/index.js';
import { CODEX_VIEW_CSS } from '../src/ui/codex/codexStyles.js';
import {
  buildCodexAchievements,
  buildCodexDiscoverySummary,
  countCodexDiscovered,
  isCodexWeaponUnlocked,
} from '../src/ui/codex/codexRecords.js';
import {
  isAccessoryDiscovered,
  isEvolutionDiscovered,
  isWeaponDiscovered,
} from '../src/domain/meta/codex/codexDiscoveryDomain.js';
import { renderCodexAccessoryTab } from '../src/ui/codex/codexAccessoryRender.js';
import { buildCodexRecordsModel } from '../src/ui/codex/codexRecordsTab.js';
import {
  buildCodexWeaponCardModel,
  partitionCodexWeapons,
  renderCodexWeaponTab,
} from '../src/ui/codex/codexWeaponTab.js';
import { renderCodexViewShell } from '../src/ui/codex/codexViewShell.js';
import {
  createCodexViewState,
  resetCodexViewState,
  setCodexActiveTab,
  updateCodexEnemyFilters,
  updateCodexWeaponFilters,
  updateCodexAccessoryFilters,
} from '../src/ui/codex/codexViewState.js';
import { CodexView } from '../src/ui/codex/CodexView.js';

console.log('\n[CodexContracts]');

test('Codex runtime view entrypoints are exposed', () => {
  assert.equal(typeof CodexView, 'function', 'CodexView가 export되지 않음');
});

test('CodexView는 장신구 도감 탭과 발견 수 집계를 포함한다', () => {
  const discovery = buildCodexDiscoverySummary({
    session: makeSessionState({
      meta: {
        enemyKills: { skeleton: 1 },
        weaponsUsedAll: ['magic_bolt'],
        accessoriesOwnedAll: ['iron_heart'],
      },
    }),
    gameData: {
      enemyData: [{ id: 'skeleton' }, { id: 'boss_lich' }],
      weaponData: [{ id: 'magic_bolt' }, { id: 'arcane_tempest', isEvolved: true }],
      accessoryData: [{ id: 'iron_heart' }, { id: 'arcane_prism' }],
    },
  });
  const shellHtml = renderCodexViewShell({
    discovery,
    activeTab: 'accessory',
    totalEnemies: 2,
    totalWeapons: 2,
    totalAccessories: 2,
  });
  const discovered = countCodexDiscovered(makeSessionState({
    meta: {
      enemyKills: { skeleton: 1 },
      weaponsUsedAll: ['magic_bolt'],
      accessoriesOwnedAll: ['iron_heart'],
      evolvedWeapons: ['arcane_tempest'],
    },
  }));

  assert.equal(shellHtml.includes('data-tab="accessory"'), true, 'CodexView에 장신구 도감 탭이 없음');
  assert.equal(shellHtml.includes('cx-tab-accessory'), true, 'CodexView에 장신구 패널이 없음');
  assert.equal(shellHtml.includes('cx-discovery-strip'), false, 'CodexView에 중복 진행도 strip이 남아 있음');
  assert.equal(shellHtml.includes('cx-tab-summary'), true, 'CodexView에 탭 요약 바가 없음');
  assert.equal(shellHtml.includes('적 1/2'), true, 'CodexView 탭이 적 진행도를 직접 보여주지 않음');
  assert.equal(shellHtml.includes('무기 1/2'), true, 'CodexView 탭이 무기 진행도를 직접 보여주지 않음');
  assert.equal(shellHtml.includes('장신구 1/2'), true, 'CodexView 탭이 장신구 진행도를 직접 보여주지 않음');
  assert.equal(discovered, 4, '도감 발견 수가 장신구를 포함하지 않음');
  assert.equal(discovery.entries.length, 3, '분리 발견 통계가 적/무기/장신구 3종을 제공하지 않음');
});

test('Codex accessory runtime는 검색/필터 state와 상세 패널 구조를 유지한다', () => {
  const state = createCodexViewState();
  updateCodexAccessoryFilters(state, {
    search: 'prism',
    rarityFilter: 'rare',
    effectFilter: 'utility',
    statusFilter: 'locked',
  });
  setCodexActiveTab(state, 'accessory');

  const html = renderCodexAccessoryTab({
    accessoryData: [
      { id: 'iron_heart', name: 'Iron Heart', icon: '❤', rarity: 'common', description: '최대 HP +20', maxLevel: 5 },
      { id: 'arcane_prism', name: 'Arcane Prism', icon: '🔮', rarity: 'rare', description: '추가 투사체', maxLevel: 5 },
    ],
    weaponEvolutionData: [{ resultWeaponId: 'helios_lance', requires: { weaponId: 'solar_ray', accessoryIds: ['arcane_prism'] } }],
    weaponData: [{ id: 'solar_ray', name: 'Solar Ray', icon: '☀' }, { id: 'helios_lance', name: 'Helios Lance', icon: '✹' }],
    session: makeSessionState({
      meta: {
        accessoriesOwnedAll: ['arcane_prism'],
      },
    }),
    search: state.accessory.search,
    rarityFilter: state.accessory.rarityFilter,
    effectFilter: state.accessory.effectFilter,
    statusFilter: state.accessory.statusFilter,
    selectedAccessoryId: 'arcane_prism',
  });

  assert.equal(state.activeTab, 'accessory', 'Codex state helper가 activeTab을 직접 갱신하지 않음');
  assert.equal(state.accessory.search, 'prism', 'Codex accessory search state가 갱신되지 않음');
  assert.equal(state.accessory.rarityFilter, 'rare', 'Codex accessory rarity filter state가 갱신되지 않음');
  assert.equal(state.accessory.effectFilter, 'utility', 'Codex accessory effect filter state가 갱신되지 않음');
  assert.equal(state.accessory.statusFilter, 'locked', 'Codex accessory status filter state가 갱신되지 않음');
  assert.equal(html.includes('id="cx-accessory-search"'), true, 'Codex accessory search input이 없음');
  assert.equal(html.includes('class="cx-accessory-detail"'), true, 'CodexView에 장신구 상세 패널이 없음');
  assert.equal(html.includes('선택한 장신구'), true, '장신구 상세 패널 선택 헤더가 없음');
  assert.equal(html.includes('cx-detail-layout'), true, '장신구 도감이 detail-first layout을 사용하지 않음');
  assert.equal(html.includes('발견한 장신구'), true, '장신구 도감이 발견 섹션을 제공하지 않음');
  assert.equal(html.includes('cx-discovery-hint'), true, '미발견 장신구 힌트가 없음');
  assert.equal(html.includes('data-afilter="rare"'), true, '장신구 rarity filter 버튼이 없음');
  assert.equal(html.includes('data-efilter="utility"'), true, '장신구 effect filter 버튼이 없음');
  assert.equal(html.includes('data-status-filter="locked"'), true, '장신구 status filter 버튼이 없음');

  resetCodexViewState(state);
  assert.equal(state.activeTab, 'enemy', 'Codex state reset이 기본 탭을 복원하지 않음');
  assert.equal(state.accessory.search, '', 'Codex state reset이 accessory search를 비우지 않음');
});

test('CodexView 무기 도감은 통합 탐색 필터와 진화 재료 장신구 클릭 점프 구조를 지원한다', () => {
  const state = createCodexViewState();
  updateCodexWeaponFilters(state, {
    search: 'arcane',
    typeFilter: 'evolved',
    statusFilter: 'discovered',
  });
  const session = makeSessionState({
    meta: {
      weaponsUsedAll: ['magic_bolt'],
      evolvedWeapons: ['arcane_tempest'],
    },
  });
  const weaponData = [
    { id: 'magic_bolt', name: 'Magic Bolt', damage: 8, cooldown: 1.2, behaviorId: 'targetProjectile', maxLevel: 7 },
    { id: 'arcane_tempest', name: 'Arcane Tempest', damage: 20, cooldown: 2.0, behaviorId: 'areaBurst', maxLevel: 1, isEvolved: true },
  ];
  const html = renderCodexWeaponTab({
    weaponData,
    session,
    weaponEvolutionData: [{ resultWeaponId: 'arcane_tempest', requires: { weaponId: 'magic_bolt', accessoryIds: ['arcane_prism'] } }],
    accessoryData: [{ id: 'arcane_prism', name: 'Arcane Prism', icon: '🔮' }],
    search: state.weapon.search,
    typeFilter: state.weapon.typeFilter,
    statusFilter: state.weapon.statusFilter,
    selectedWeaponId: 'arcane_tempest',
  });

  assert.equal(html.includes('data-accessory-ref="arcane_prism"'), true, '무기 도감 진화 재료 칩 훅이 없음');
  assert.equal(html.includes('id="cx-weapon-detail"'), true, '무기 도감 상세 패널이 없음');
  assert.equal(html.includes('선택한 무기'), true, '무기 상세 패널 선택 헤더가 없음');
  assert.equal(html.includes('id="cx-weapon-search"'), true, '무기 도감 search input이 없음');
  assert.equal(html.includes('data-wstatus="discovered"'), true, '무기 도감 status filter 버튼이 없음');
  assert.equal(html.includes('발견한 무기'), true, '무기 도감이 발견 섹션을 제공하지 않음');
  assert.equal(html.includes('미발견 무기'), true, '무기 도감이 미발견 섹션을 제공하지 않음');
  assert.equal(isCodexWeaponUnlocked({ id: 'magic_bolt', isEvolved: false }, session), true);
  assert.equal(isCodexWeaponUnlocked({ id: 'arcane_tempest', isEvolved: true }, session), true);
  assert.equal(isCodexWeaponUnlocked({ id: 'frozen_orb', isEvolved: true }, session), false);
  assert.equal(isWeaponDiscovered(session, 'magic_bolt'), true);
  assert.equal(isEvolutionDiscovered(session, 'arcane_tempest'), true);
  assert.equal(isAccessoryDiscovered(makeSessionState({ meta: { accessoriesOwnedAll: ['arcane_prism'] } }), 'arcane_prism'), true);

  const groups = partitionCodexWeapons(weaponData);
  assert.equal(groups.baseWeapons.length, 1);
  assert.equal(groups.evolvedWeapons.length, 1);

  const evolvedCard = buildCodexWeaponCardModel({
    weapon: weaponData[1],
    session,
    weaponEvolutionData: [{ resultWeaponId: 'arcane_tempest', requires: { weaponId: 'magic_bolt', accessoryIds: ['arcane_prism'] } }],
    accessoryData: [{ id: 'arcane_prism', name: 'Arcane Prism', icon: '🔮' }],
    selectedWeaponId: 'arcane_tempest',
  });
  assert.equal(evolvedCard.unlocked, true);
  assert.equal(evolvedCard.isSelected, true);
  assert.equal(evolvedCard.recipeText.includes('magic_bolt'), false, '무기 도감 진화식이 내부 id를 그대로 노출함');

  resetCodexViewState(state);
  assert.equal(state.weapon.search, '', 'Codex state reset이 weapon search를 비우지 않음');
});

test('Codex 기록 helper는 업적 진행도와 도감 발견 비율을 계산한다', () => {
  const session = makeSessionState({
    meta: {
      enemyKills: { skeleton: 70, lich: 1 },
      killedBosses: ['boss_lich'],
      weaponsUsedAll: ['magic_bolt', 'fire_orb'],
      evolvedWeapons: ['arcane_tempest'],
      totalRuns: 4,
    },
    best: {
      survivalTime: 650,
      level: 22,
    },
  });
  const achievements = buildCodexAchievements(session, {
    enemyData: [{ id: 'skeleton' }, { id: 'lich' }],
    weaponData: [{ id: 'magic_bolt' }, { id: 'fire_orb' }, { id: 'arcane_tempest', isEvolved: true }],
    accessoryData: [{ id: 'iron_heart', rarity: 'common' }, { id: 'arcane_prism', rarity: 'rare' }, { id: 'wind_crystal', rarity: 'rare' }],
    weaponEvolutionData: [{ resultWeaponId: 'arcane_tempest', requires: { weaponId: 'magic_bolt', accessoryIds: ['arcane_prism', 'wind_crystal'] } }],
  });
  const model = buildCodexRecordsModel({
    session,
    gameData: {
      enemyData: [{ id: 'skeleton' }, { id: 'lich' }],
      weaponData: [{ id: 'magic_bolt' }, { id: 'fire_orb' }, { id: 'arcane_tempest', isEvolved: true }],
      accessoryData: [{ id: 'iron_heart', rarity: 'common' }, { id: 'arcane_prism', rarity: 'rare' }, { id: 'wind_crystal', rarity: 'rare' }],
      weaponEvolutionData: [{ resultWeaponId: 'arcane_tempest', requires: { weaponId: 'magic_bolt', accessoryIds: ['arcane_prism', 'wind_crystal'] } }],
    },
  });

  assert.equal(achievements.some((entry) => entry.name === '보스 사냥꾼' && entry.done), true);
  assert.equal(achievements.some((entry) => entry.name === '생존자' && entry.done), true);
  assert.equal(achievements.some((entry) => entry.name === '전설적인 런' && entry.done), true);
  assert.equal(achievements.some((entry) => entry.name === '희귀 수집가'), true, '희귀 장신구 업적이 없음');
  assert.equal(achievements.some((entry) => entry.name === '진화 촉매 수집가'), true, '진화 촉매 업적이 없음');
  assert.equal(model.unlocks.length > 0, true, '해금 보상 엔트리가 없음');
  assert.equal(model.focusGoals.length > 0, true, '기록 탭 focus goals가 없음');
  assert.equal(model.discoveryFocus.length === 3, true, '기록 탭 discovery focus가 적/무기/장신구 3종을 제공하지 않음');
});

test('Codex enemy runtime는 통합 탐색 필터 state를 유지한다', () => {
  const state = createCodexViewState();
  updateCodexEnemyFilters(state, {
    search: 'lich',
    tierFilter: 'boss',
    statusFilter: 'undiscovered',
  });

  assert.equal(state.enemy.search, 'lich', 'Codex enemy search state가 갱신되지 않음');
  assert.equal(state.enemy.tierFilter, 'boss', 'Codex enemy tier filter state가 갱신되지 않음');
  assert.equal(state.enemy.statusFilter, 'undiscovered', 'Codex enemy status filter state가 갱신되지 않음');

  resetCodexViewState(state);
  assert.equal(state.enemy.search, '', 'Codex state reset이 enemy search를 비우지 않음');
  assert.equal(state.enemy.tierFilter, 'all', 'Codex state reset이 enemy tier filter를 초기화하지 않음');
  assert.equal(state.enemy.statusFilter, 'all', 'Codex state reset이 enemy status filter를 초기화하지 않음');
});

test('Codex view styling keeps the shared subscreen root contract', () => {
  assert.equal(CODEX_VIEW_CSS.includes('.ss-root'), true, 'CodexView 스타일이 공통 서브스크린 테마를 포함하지 않음');
});

summary();
