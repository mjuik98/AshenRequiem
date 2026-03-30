import assert from 'node:assert/strict';

console.log('\n[CodexViewHelpers]');

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed += 1;
  } catch (error) {
    console.error(`  ✗ ${name}`);
    console.error(`    [ERROR] ${error.message}`);
    failed += 1;
  }
}

await test('codex enemy helper builds filtered grid/detail models', async () => {
  const enemyTab = await import('../src/ui/codex/codexEnemyTab.js');

  const enemyData = [
    { id: 'skeleton', name: 'Skeleton', hp: 10, damage: 2, moveSpeed: 30, xpValue: 1, color: '#aaa' },
    { id: 'boss_lich', name: 'Lich', hp: 250, damage: 12, moveSpeed: 18, xpValue: 20, color: '#f0f', isBoss: true, phases: [{}, {}] },
  ];
  const session = {
    meta: {
      enemyKills: { skeleton: 5 },
      enemiesEncountered: ['skeleton'],
    },
  };

  const grid = enemyTab.buildCodexEnemyGridModel({
    enemyData,
    session,
    currentTier: 'all',
    selectedEnemyId: 'skeleton',
    search: '',
    statusFilter: 'all',
  });

  assert.equal(grid.tierText, '전체');
  assert.equal(grid.entries.length, 2);
  assert.equal(grid.discoveredEntries.length, 1);
  assert.equal(grid.undiscoveredEntries.length, 1);
  assert.equal(grid.discoveredEntries[0].id, 'skeleton');
  assert.equal(grid.discoveredEntries[0].discovered, true);
  assert.equal(grid.discoveredEntries[0].isSelected, true);
  assert.equal(grid.summary.selectedName, 'Skeleton');

  const detail = enemyTab.buildCodexEnemyDetailModel({
    enemyData,
    session,
    selectedEnemyId: 'skeleton',
  });

  assert.equal(detail.id, 'skeleton');
  assert.equal(detail.killCount, 5);
  assert.equal(detail.effects.length, 0);

  const lockedGrid = enemyTab.buildCodexEnemyGridModel({
    enemyData,
    session,
    currentTier: 'all',
    selectedEnemyId: 'boss_lich',
    search: '',
    statusFilter: 'undiscovered',
  });

  assert.equal(lockedGrid.entries.length, 1);
  assert.equal(lockedGrid.summary.statusLabel, '미발견');

  const lockedDetail = enemyTab.buildCodexEnemyDetailModel({
    enemyData,
    session,
    selectedEnemyId: 'boss_lich',
  });

  assert.equal(lockedDetail.unlocked, false);
  assert.equal(lockedDetail.discoveryHint.includes('조우'), true);
});

await test('codex weapon helper partitions weapons and derives card state', async () => {
  const weaponTab = await import('../src/ui/codex/codexWeaponTab.js');
  const weaponModel = await import('../src/ui/codex/codexWeaponModel.js');
  const weaponRender = await import('../src/ui/codex/codexWeaponRender.js');

  const weaponData = [
    { id: 'magic_bolt', name: '매직 볼트', damage: 8, cooldown: 1.2, behaviorId: 'targetProjectile', maxLevel: 7, description: '기본 마탄을 발사한다.' },
    { id: 'arcane_tempest', name: '비전 폭풍', damage: 20, cooldown: 2.0, behaviorId: 'laserBeam', maxLevel: 1, isEvolved: true, description: '집중된 광선을 발사한다.' },
  ];
  const session = {
    meta: {
      weaponsUsedAll: ['magic_bolt'],
      evolvedWeapons: ['arcane_tempest'],
    },
  };
  const weaponEvolutionData = [
    { resultWeaponId: 'arcane_tempest', requires: { weaponId: 'magic_bolt', accessoryIds: ['mana_core'] } },
  ];

  assert.equal(typeof weaponModel.partitionCodexWeapons, 'function');
  assert.equal(typeof weaponModel.buildCodexWeaponCollectionModel, 'function');
  assert.equal(typeof weaponModel.buildCodexWeaponCardModel, 'function');
  assert.equal(typeof weaponModel.buildCodexWeaponDetailModel, 'function');
  assert.equal(typeof weaponRender.renderCodexWeaponCard, 'function');
  assert.equal(typeof weaponRender.renderCodexWeaponDetail, 'function');
  assert.equal(typeof weaponRender.renderCodexWeaponTab, 'function');
  assert.equal(weaponTab.partitionCodexWeapons, weaponModel.partitionCodexWeapons);
  assert.equal(weaponTab.buildCodexWeaponCardModel, weaponModel.buildCodexWeaponCardModel);
  assert.equal(weaponTab.buildCodexWeaponDetailModel, weaponModel.buildCodexWeaponDetailModel);
  assert.equal(weaponTab.renderCodexWeaponTab, weaponRender.renderCodexWeaponTab);

  const sections = weaponTab.partitionCodexWeapons(weaponData);
  assert.equal(sections.baseWeapons.length, 1);
  assert.equal(sections.evolvedWeapons.length, 1);

  const collection = weaponModel.buildCodexWeaponCollectionModel({
    weaponData,
    session,
    weaponEvolutionData,
    accessoryData: [{ id: 'mana_core', name: '마나 코어', icon: '◈' }],
    search: 'arcane',
    typeFilter: 'evolved',
    statusFilter: 'discovered',
    selectedWeaponId: 'arcane_tempest',
  });
  assert.equal(collection.entries.length, 1);
  assert.equal(collection.lockedEntries.length, 0);
  assert.equal(collection.summary.statusLabel, '발견');

  const card = weaponTab.buildCodexWeaponCardModel({
    weapon: weaponData[1],
    weaponData,
    session,
    weaponEvolutionData,
    selectedWeaponId: 'arcane_tempest',
  });

  assert.equal(card.unlocked, true);
  assert.equal(card.isSelected, true);
  assert.equal(card.typeLabel, '광선');
  assert.equal(card.recipeText.includes('매직 볼트'), true);
  assert.equal(card.recipeText.includes('magic_bolt'), false);
  assert.equal(card.recipeAccessories.length, 1);

  const detail = weaponTab.buildCodexWeaponDetailModel({
    weaponData,
    session,
    weaponEvolutionData,
    accessoryData: [{ id: 'mana_core', name: '마나 코어', icon: '◈' }],
    selectedWeaponId: 'arcane_tempest',
  });

  assert.equal(detail.name, '비전 폭풍');
  assert.equal(detail.detailStats.some((entry) => entry.label === '공격력'), true);
  assert.equal(detail.detailStats.some((entry) => entry.label === '공격속도'), true);
  assert.equal(detail.summaryChips.length > 0, true);
  assert.equal(detail.discoveryHint.includes('진화'), true);

  const html = weaponTab.renderCodexWeaponTab({
    weaponData,
    session,
    weaponEvolutionData,
    accessoryData: [{ id: 'mana_core', name: '마나 코어', icon: '◈' }],
    selectedWeaponId: 'arcane_tempest',
    search: '',
    typeFilter: 'all',
    statusFilter: 'all',
  });

  assert.equal(html.includes('id="cx-weapon-detail"'), true);
  assert.equal(html.includes('선택한 무기'), true);
  assert.equal(html.includes('공격속도'), true);
  assert.equal(html.includes('cx-detail-layout'), true);
  assert.equal(html.includes('id="cx-weapon-search"'), true);
  assert.equal(html.includes('data-wstatus="discovered"'), true);
  assert.equal(html.includes('발견한 무기'), true);
  assert.equal(html.includes('미발견 무기'), true);
});

await test('codex accessory helper derives filterable grid/detail models and discovery gating', async () => {
  const accessoryTab = await import('../src/ui/codex/codexAccessoryTab.js');
  const accessoryModel = await import('../src/ui/codex/codexAccessoryModel.js');
  const accessoryRender = await import('../src/ui/codex/codexAccessoryRender.js');
  const accessoryStyles = await import('../src/ui/codex/codexAccessoryStyles.js');

  const accessoryData = [
    { id: 'iron_heart', name: 'Iron Heart', icon: '❤', rarity: 'common', description: '최대 HP +20', maxLevel: 5 },
    {
      id: 'arcane_prism',
      name: 'Arcane Prism',
      icon: '🔮',
      rarity: 'rare',
      description: '추가 투사체',
      maxLevel: 5,
      effects: [
        { stat: 'bonusProjectileCount', value: 1, valuePerLevel: 1 },
        { stat: 'projectileSpeedMult', value: 0.08, valuePerLevel: 0.08 },
      ],
    },
  ];
  const session = {
    meta: {
      accessoriesOwnedAll: ['arcane_prism'],
    },
  };

  const card = accessoryModel.buildCodexAccessoryCardModel({
    accessory: accessoryData[1],
    session,
    selectedAccessoryId: 'arcane_prism',
  });

  assert.equal(card.unlocked, true);
  assert.equal(card.isSelected, true);
  assert.equal(card.rarityLabel, '희귀');
  assert.equal(card.icon, '🔮');

  const grid = accessoryModel.buildCodexAccessoryGridModel({
    accessoryData,
    weaponEvolutionData: [{ resultWeaponId: 'helios_lance', requires: { weaponId: 'solar_ray', accessoryIds: ['arcane_prism'] } }],
    session,
    search: 'Prism',
    rarityFilter: 'rare',
    effectFilter: 'all',
    statusFilter: 'all',
    selectedAccessoryId: 'arcane_prism',
  });

  assert.equal(grid.entries.length, 1);
  assert.equal(grid.entries[0].isCatalyst, true);
  assert.equal(grid.discoveredEntries.length, 1);
  assert.equal(grid.lockedEntries.length, 0);

  const lockedGrid = accessoryModel.buildCodexAccessoryGridModel({
    accessoryData,
    weaponEvolutionData: [{ resultWeaponId: 'helios_lance', requires: { weaponId: 'solar_ray', accessoryIds: ['arcane_prism'] } }],
    session,
    search: '',
    rarityFilter: 'all',
    effectFilter: 'all',
    statusFilter: 'locked',
    selectedAccessoryId: 'iron_heart',
  });
  assert.equal(lockedGrid.entries.length, 1);
  assert.equal(lockedGrid.summary.statusLabel, '미발견');

  const detail = accessoryModel.buildCodexAccessoryDetailModel({
    accessoryData,
    weaponEvolutionData: [{ resultWeaponId: 'helios_lance', requires: { weaponId: 'solar_ray', accessoryIds: ['arcane_prism'] } }],
    weaponData: [{ id: 'solar_ray', name: 'Solar Ray', icon: '☀' }, { id: 'helios_lance', name: 'Helios Lance', icon: '✹' }],
    session,
    selectedAccessoryId: 'arcane_prism',
  });

  assert.equal(detail.name, 'Arcane Prism');
  assert.equal(detail.linkedWeapons.length, 1);
  assert.equal(detail.unlocked, true);
  assert.equal(Array.isArray(detail.levelGroups), true, '장신구 detail model이 구조화된 레벨 효과 그룹을 제공하지 않음');
  assert.equal(detail.levelGroups.length, 2, '장신구 detail model이 효과별 레벨 그룹 수를 유지하지 않음');
  assert.equal(detail.levelGroups[0].label, '추가 투사체', '첫 번째 레벨 효과 그룹 라벨이 잘못됨');
  assert.deepEqual(
    detail.levelGroups[0].levels.map((entry) => entry.label),
    ['Lv1', 'Lv2', 'Lv3', 'Lv4', 'Lv5'],
    '레벨 효과 그룹이 레벨 라벨을 순서대로 제공하지 않음',
  );

  const lockedDetail = accessoryModel.buildCodexAccessoryDetailModel({
    accessoryData,
    weaponEvolutionData: [{ resultWeaponId: 'helios_lance', requires: { weaponId: 'solar_ray', accessoryIds: ['arcane_prism'] } }],
    weaponData: [{ id: 'solar_ray', name: 'Solar Ray', icon: '☀' }, { id: 'helios_lance', name: 'Helios Lance', icon: '✹' }],
    session,
    selectedAccessoryId: 'iron_heart',
  });

  assert.equal(lockedDetail.unlocked, false);
  assert.equal(lockedDetail.discoveryHint.includes('획득'), true);

  const html = accessoryRender.renderCodexAccessoryTab({
    accessoryData,
    weaponEvolutionData: [{ resultWeaponId: 'helios_lance', requires: { weaponId: 'solar_ray', accessoryIds: ['arcane_prism'] } }],
    weaponData: [{ id: 'solar_ray', name: 'Solar Ray', icon: '☀' }, { id: 'helios_lance', name: 'Helios Lance', icon: '✹' }],
    session,
    search: '',
    rarityFilter: 'all',
    effectFilter: 'all',
    statusFilter: 'all',
    selectedAccessoryId: 'arcane_prism',
  });

  assert.equal(html.includes('cx-accessory-grid'), true);
  assert.equal(html.includes('cx-acard'), true);
  assert.equal(html.includes('cx-accessory-detail'), true);
  assert.equal(html.includes('cx-af'), true);
  assert.equal(html.includes('cx-ef'), true);
  assert.equal(html.includes('cx-sf'), true);
  assert.equal(html.includes('cx-discovery-hint'), true);
  assert.equal(html.includes('선택한 장신구'), true);
  assert.equal(html.includes('cx-detail-layout'), true);
  assert.equal(html.includes('발견한 장신구'), true);
  assert.equal(html.includes('cx-level-group'), true, '장신구 상세가 구조화된 레벨 효과 그룹 마크업을 렌더하지 않음');
  assert.equal(html.includes('cx-level-chip'), true, '장신구 상세가 레벨 효과 칩 마크업을 렌더하지 않음');
  assert.equal(html.includes('Lv1'), true, '장신구 상세에 개별 레벨 라벨이 없음');
  assert.equal(html.includes('추가 투사체'), true, '장신구 상세에 효과별 레벨 그룹 제목이 없음');
  assert.equal(typeof accessoryTab.buildCodexAccessoryGridModel, 'function');
  assert.equal(typeof accessoryTab.renderCodexAccessoryTab, 'function');
  assert.equal(accessoryStyles.CODEX_ACCESSORY_TAB_CSS.includes('.cx-accessory-grid'), true);
  assert.equal(accessoryStyles.CODEX_ACCESSORY_TAB_CSS.includes('.cx-level-group'), true, '장신구 스타일에 레벨 효과 그룹 훅이 없음');
});

await test('codex enemy detail render exposes a clear selected-detail heading', async () => {
  const enemyTab = await import('../src/ui/codex/codexEnemyTab.js');

  const html = enemyTab.renderCodexEnemyDetail({
    id: 'skeleton',
    name: 'Skeleton',
    tier: 'normal',
    tierLabel: '일반',
    killCount: 5,
    borderColor: '#aaa',
    avatarText: 'S',
    color: '#aaa',
    stats: { hp: 10, moveSpeed: 30, damage: 2, xpValue: 1 },
    drops: ['경험치 젬'],
    effects: [],
    milestoneStates: [],
  });

  assert.equal(html.includes('선택한 적'), true);
});

await test('codex records helper packages summary, achievements, and unlock entries together', async () => {
  const recordsTab = await import('../src/ui/codex/codexRecordsTab.js');
  const codexRecords = await import('../src/ui/codex/codexRecords.js');

  const model = recordsTab.buildCodexRecordsModel({
    session: {
      meta: {
        enemyKills: { skeleton: 25 },
        killedBosses: ['boss_lich'],
        claimedDailyRewardSeeds: ['daily-2026-03-25', 'daily-2026-03-26'],
        dailyChallengeStreak: 2,
        bestDailyChallengeStreak: 3,
        weaponsUsedAll: ['magic_bolt'],
        accessoriesOwnedAll: ['iron_heart'],
        evolvedWeapons: ['arcane_tempest'],
        totalRuns: 3,
        currency: 77,
        recentRuns: [
          {
            outcome: 'defeat',
            seedMode: 'daily',
            seedLabel: 'daily-2026-03-26',
            stageId: 'moon_crypt',
            stageName: 'Moon Crypt',
            survivalTime: 120,
            killCount: 20,
            level: 6,
            deathCause: 'elite_skeleton',
            weaponIds: ['magic_bolt'],
            accessoryIds: ['iron_heart'],
            archetypeId: 'vanguard',
          },
          {
            outcome: 'defeat',
            stageId: 'ember_hollow',
            stageName: 'Ember Hollow',
            survivalTime: 180,
            killCount: 32,
            level: 8,
            deathCause: 'boss_lich',
            weaponIds: ['magic_bolt'],
            accessoryIds: ['iron_heart'],
            archetypeId: 'vanguard',
          },
          {
            outcome: 'victory',
            stageId: 'ember_hollow',
            stageName: 'Ember Hollow',
            survivalTime: 640,
            killCount: 90,
            level: 18,
            weaponIds: ['magic_bolt'],
            accessoryIds: ['iron_heart'],
            archetypeId: 'spellweaver',
          },
        ],
      },
      best: {
        survivalTime: 620,
        level: 21,
      },
    },
    gameData: {
      enemyData: [{ id: 'skeleton' }, { id: 'boss_lich' }],
      weaponData: [{ id: 'magic_bolt' }, { id: 'arcane_tempest', isEvolved: true }],
      accessoryData: [{ id: 'iron_heart', rarity: 'common' }, { id: 'arcane_prism', rarity: 'rare' }],
      weaponEvolutionData: [{ resultWeaponId: 'arcane_tempest', requires: { weaponId: 'magic_bolt', accessoryIds: ['iron_heart'] } }],
    },
  });

  assert.equal(model.summary.currency, 77);
  assert.equal(model.achievements.some((entry) => entry.done), true);
  assert.equal(model.unlocks.length > 0, true);
  assert.equal(model.highlights.length >= 4, true);
  assert.equal(model.focusGoals.length > 0, true);
  assert.equal(model.discoveryFocus.length === 3, true);
  assert.equal(Array.isArray(model.analytics.stageRecords), true);
  assert.equal(model.analytics.favoriteLoadout.weaponId, 'magic_bolt');
  assert.equal(model.analytics.stageWeakness.stageId, 'moon_crypt');
  assert.equal(model.analytics.dailyStats.streak, 2);
  assert.equal('favoriteLoadout' in model, false);
  assert.equal('recommendations' in model, false);
  assert.equal('recentRuns' in model, false);

  const discovery = codexRecords.buildCodexDiscoverySummary({
    session: {
      meta: {
        enemyKills: { skeleton: 1 },
        weaponsUsedAll: ['magic_bolt'],
        accessoriesOwnedAll: ['iron_heart'],
      },
    },
    gameData: {
      enemyData: [{ id: 'skeleton' }, { id: 'boss_lich' }],
      weaponData: [{ id: 'magic_bolt' }, { id: 'arcane_tempest', isEvolved: true }],
      accessoryData: [{ id: 'iron_heart' }, { id: 'arcane_prism' }],
    },
  });

  assert.equal(discovery.entries.length, 3);
  assert.equal(discovery.entries.some((entry) => entry.label === '장신구' && entry.discovered === 1), true);
  assert.equal(model.achievements.some((entry) => entry.name === '장신구 수집가'), true);
  assert.equal(model.achievements.some((entry) => entry.name === '희귀 수집가'), true);
  assert.equal(model.achievements.some((entry) => entry.name === '진화 촉매 수집가'), true);

  const html = recordsTab.renderCodexRecordsTab({
    session: {
      meta: {
        enemyKills: { skeleton: 25 },
        killedBosses: ['boss_lich'],
        claimedDailyRewardSeeds: ['daily-2026-03-25', 'daily-2026-03-26'],
        dailyChallengeStreak: 2,
        bestDailyChallengeStreak: 3,
        weaponsUsedAll: ['magic_bolt'],
        accessoriesOwnedAll: ['iron_heart'],
        evolvedWeapons: ['arcane_tempest'],
        totalRuns: 3,
        currency: 77,
        recentRuns: [
          {
            outcome: 'defeat',
            stageId: 'moon_crypt',
            stageName: 'Moon Crypt',
            survivalTime: 120,
            killCount: 20,
            level: 6,
            deathCause: 'elite_skeleton',
            weaponIds: ['magic_bolt'],
            accessoryIds: ['iron_heart'],
            archetypeId: 'vanguard',
          },
          {
            outcome: 'defeat',
            stageId: 'ember_hollow',
            stageName: 'Ember Hollow',
            survivalTime: 180,
            killCount: 32,
            level: 8,
            deathCause: 'boss_lich',
            weaponIds: ['magic_bolt'],
            accessoryIds: ['iron_heart'],
            archetypeId: 'vanguard',
          },
        ],
      },
      best: {
        survivalTime: 620,
        level: 21,
      },
    },
    gameData: {
      enemyData: [{ id: 'skeleton' }, { id: 'boss_lich' }],
      weaponData: [{ id: 'magic_bolt' }, { id: 'arcane_tempest', isEvolved: true }],
      accessoryData: [{ id: 'iron_heart', rarity: 'common' }, { id: 'arcane_prism', rarity: 'rare' }],
      weaponEvolutionData: [{ resultWeaponId: 'arcane_tempest', requires: { weaponId: 'magic_bolt', accessoryIds: ['iron_heart'] } }],
    },
  });

  assert.equal(html.includes('cx-records-hero'), true);
  assert.equal(html.includes('cx-records-focus'), true);
  assert.equal(html.includes('다음 목표'), true);
  assert.equal(html.includes('데일리 챌린지'), false);
  assert.equal(html.includes('추천 조정'), false);
  assert.equal(html.includes('취약 스테이지'), false);
  assert.equal(html.includes('주력 로드아웃'), false);
  assert.equal(html.includes('주요 패배 원인'), false);
  assert.equal(html.includes('최근 런'), false);
});

await test('codex styles live in a dedicated module', async () => {
  const styles = await import('../src/ui/codex/codexStyles.js');
  assert.equal(typeof styles.CODEX_VIEW_CSS, 'string');
  assert.equal(styles.CODEX_VIEW_CSS.includes('.cx-root'), true);
  assert.equal(typeof styles.CODEX_VIEW_STYLE_ID, 'string');
});

await test('codex view helper modules expose state transitions and dom bindings', async () => {
  const stateApi = await import('../src/ui/codex/codexViewState.js');
  const bindingApi = await import('../src/ui/codex/codexViewBindings.js');
  const shellApi = await import('../src/ui/codex/codexViewShell.js');
  const controllerApi = await import('../src/ui/codex/codexViewControllers.js');

  assert.equal(typeof stateApi.createCodexViewState, 'function');
  assert.equal(typeof stateApi.resetCodexViewState, 'function');
  assert.equal(typeof stateApi.toggleCodexSelection, 'function');
  assert.equal(typeof stateApi.updateCodexAccessoryFilters, 'function');
  assert.equal(typeof stateApi.updateCodexEnemyFilters, 'function');
  assert.equal(typeof stateApi.updateCodexWeaponFilters, 'function');
  assert.equal(typeof stateApi.setCodexActiveTab, 'function');
  assert.equal(typeof bindingApi.bindCodexTabButtons, 'function');
  assert.equal(typeof bindingApi.bindCodexSelectableCards, 'function');
  assert.equal(typeof bindingApi.bindCodexButtonGroup, 'function');
  assert.equal(typeof bindingApi.syncCodexTabPanels, 'function');
  assert.equal(typeof shellApi.renderCodexViewShell, 'function');
  assert.equal(typeof controllerApi.renderCodexEnemyPanel, 'function');
  assert.equal(typeof controllerApi.renderCodexWeaponPanel, 'function');
  assert.equal(typeof controllerApi.renderCodexAccessoryPanel, 'function');
  assert.equal(typeof controllerApi.renderCodexRecordsPanel, 'function');

  const state = stateApi.createCodexViewState();
  stateApi.setCodexActiveTab(state, 'records');
  stateApi.toggleCodexSelection(state, 'weapon', 'magic_bolt');
  stateApi.updateCodexAccessoryFilters(state, {
    search: 'prism',
    rarityFilter: 'rare',
    effectFilter: 'utility',
    statusFilter: 'locked',
  });
  stateApi.updateCodexEnemyFilters(state, {
    search: 'lich',
    tierFilter: 'boss',
    statusFilter: 'undiscovered',
  });
  stateApi.updateCodexWeaponFilters(state, {
    search: 'arcane',
    typeFilter: 'evolved',
    statusFilter: 'discovered',
  });

  assert.equal(state.activeTab, 'records');
  assert.equal(state.selectedWeaponId, 'magic_bolt');
  assert.equal(state.accessory.search, 'prism');
  assert.equal(state.accessory.rarityFilter, 'rare');
  assert.equal(state.accessory.effectFilter, 'utility');
  assert.equal(state.accessory.statusFilter, 'locked');
  assert.equal(state.enemy.search, 'lich');
  assert.equal(state.enemy.tierFilter, 'boss');
  assert.equal(state.weapon.typeFilter, 'evolved');
  assert.equal(state.weapon.statusFilter, 'discovered');

  stateApi.resetCodexViewState(state);
  assert.equal(state.activeTab, 'enemy');
  assert.equal(state.selectedWeaponId, null);
  assert.equal(state.accessory.search, '');
  assert.equal(state.enemy.search, '');
  assert.equal(state.weapon.search, '');
});

console.log(`\nCodexViewHelpers: ${passed}개 통과, ${failed}개 실패`);
if (failed > 0) process.exit(1);
