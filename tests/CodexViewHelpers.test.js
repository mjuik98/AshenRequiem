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
    currentTier: 'normal',
    selectedEnemyId: 'skeleton',
    search: 'Skel',
  });

  assert.equal(grid.tierText, '일반');
  assert.equal(grid.entries.length, 1);
  assert.equal(grid.entries[0].id, 'skeleton');
  assert.equal(grid.entries[0].discovered, true);
  assert.equal(grid.entries[0].isSelected, true);

  const detail = enemyTab.buildCodexEnemyDetailModel({
    enemyData,
    session,
    selectedEnemyId: 'skeleton',
  });

  assert.equal(detail.id, 'skeleton');
  assert.equal(detail.killCount, 5);
  assert.equal(detail.effects.length, 0);
});

await test('codex weapon helper partitions weapons and derives card state', async () => {
  const weaponTab = await import('../src/ui/codex/codexWeaponTab.js');

  const weaponData = [
    { id: 'magic_bolt', name: 'Magic Bolt', damage: 8, cooldown: 1.2, behaviorId: 'targetProjectile', maxLevel: 7 },
    { id: 'arcane_tempest', name: 'Arcane Tempest', damage: 20, cooldown: 2.0, behaviorId: 'areaBurst', maxLevel: 1, isEvolved: true },
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

  const sections = weaponTab.partitionCodexWeapons(weaponData);
  assert.equal(sections.baseWeapons.length, 1);
  assert.equal(sections.evolvedWeapons.length, 1);

  const card = weaponTab.buildCodexWeaponCardModel({
    weapon: weaponData[1],
    session,
    weaponEvolutionData,
    selectedWeaponId: 'arcane_tempest',
  });

  assert.equal(card.unlocked, true);
  assert.equal(card.isSelected, true);
  assert.equal(card.recipeText.includes('magic_bolt'), true);
  assert.equal(card.recipeAccessories.length, 1);
});

await test('codex accessory helper derives filterable grid/detail models and discovery gating', async () => {
  const accessoryTab = await import('../src/ui/codex/codexAccessoryTab.js');
  const accessoryModel = await import('../src/ui/codex/codexAccessoryModel.js');
  const accessoryRender = await import('../src/ui/codex/codexAccessoryRender.js');
  const accessoryStyles = await import('../src/ui/codex/codexAccessoryStyles.js');

  const accessoryData = [
    { id: 'iron_heart', name: 'Iron Heart', icon: '❤', rarity: 'common', description: '최대 HP +20', maxLevel: 5 },
    { id: 'arcane_prism', name: 'Arcane Prism', icon: '🔮', rarity: 'rare', description: '추가 투사체', maxLevel: 5 },
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
    selectedAccessoryId: 'arcane_prism',
  });

  assert.equal(grid.entries.length, 1);
  assert.equal(grid.entries[0].isCatalyst, true);

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

  const html = accessoryRender.renderCodexAccessoryTab({
    accessoryData,
    weaponEvolutionData: [{ resultWeaponId: 'helios_lance', requires: { weaponId: 'solar_ray', accessoryIds: ['arcane_prism'] } }],
    weaponData: [{ id: 'solar_ray', name: 'Solar Ray', icon: '☀' }, { id: 'helios_lance', name: 'Helios Lance', icon: '✹' }],
    session,
    search: '',
    rarityFilter: 'all',
    effectFilter: 'all',
    selectedAccessoryId: 'arcane_prism',
  });

  assert.equal(html.includes('cx-accessory-grid'), true);
  assert.equal(html.includes('cx-acard'), true);
  assert.equal(html.includes('cx-accessory-detail'), true);
  assert.equal(html.includes('cx-af'), true);
  assert.equal(html.includes('cx-ef'), true);
  assert.equal(html.includes('cx-discovery-hint'), true);
  assert.equal(typeof accessoryTab.buildCodexAccessoryGridModel, 'function');
  assert.equal(typeof accessoryTab.renderCodexAccessoryTab, 'function');
  assert.equal(accessoryStyles.CODEX_ACCESSORY_TAB_CSS.includes('.cx-accessory-grid'), true);
});

await test('codex records helper packages summary, achievements, and unlock entries together', async () => {
  const recordsTab = await import('../src/ui/codex/codexRecordsTab.js');
  const codexRecords = await import('../src/ui/codex/codexRecords.js');

  const model = recordsTab.buildCodexRecordsModel({
    session: {
      meta: {
        enemyKills: { skeleton: 25 },
        killedBosses: ['boss_lich'],
        weaponsUsedAll: ['magic_bolt'],
        accessoriesOwnedAll: ['iron_heart'],
        evolvedWeapons: ['arcane_tempest'],
        totalRuns: 3,
        currency: 77,
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
  });

  assert.equal(state.activeTab, 'records');
  assert.equal(state.selectedWeaponId, 'magic_bolt');
  assert.equal(state.accessory.search, 'prism');
  assert.equal(state.accessory.rarityFilter, 'rare');
  assert.equal(state.accessory.effectFilter, 'utility');

  stateApi.resetCodexViewState(state);
  assert.equal(state.activeTab, 'enemy');
  assert.equal(state.selectedWeaponId, null);
  assert.equal(state.accessory.search, '');
});

console.log(`\nCodexViewHelpers: ${passed}개 통과, ${failed}개 실패`);
if (failed > 0) process.exit(1);
