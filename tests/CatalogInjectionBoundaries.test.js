import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import {
  readProjectSource,
  stripLineComments,
} from './helpers/sourceInspection.js';

console.log('\n[CatalogInjectionBoundaries]');

const { test, summary } = createRunner('CatalogInjectionBoundaries');

const startLoadoutSelectionSource = stripLineComments(readProjectSource('../src/domain/meta/loadout/startLoadoutSelection.js'));
const startLoadoutCatalogSource = stripLineComments(readProjectSource('../src/domain/meta/loadout/startLoadoutCatalog.js'));
const playerSpawnSource = stripLineComments(readProjectSource('../src/app/play/playerSpawnApplicationService.js'));
const runGuidanceSource = stripLineComments(readProjectSource('../src/domain/play/encounter/runGuidanceDomain.js'));
const metaShopAppSource = stripLineComments(readProjectSource('../src/app/meta/metaShopApplicationService.js'));

test('remaining loadout/spawn/meta modules do not import static data catalogs directly', () => {
  assert.equal(
    /from\s+['"]\.\.\/\.\.\/\.\.\/data\/ascensionData\.js['"]/.test(startLoadoutSelectionSource),
    false,
    'startLoadoutSelection이 ascensionData 정적 import에 의존하고 있음',
  );
  assert.equal(
    /from\s+['"]\.\.\/\.\.\/\.\.\/data\/stageData\.js['"]/.test(startLoadoutSelectionSource),
    false,
    'startLoadoutSelection이 stageData 정적 import에 의존하고 있음',
  );
  assert.equal(
    /from\s+['"]\.\.\/\.\.\/\.\.\/data\/archetypeData\.js['"]/.test(startLoadoutSelectionSource),
    false,
    'startLoadoutSelection이 archetypeData 정적 import에 의존하고 있음',
  );
  assert.equal(
    /from\s+['"]\.\.\/\.\.\/\.\.\/data\/riskRelicData\.js['"]/.test(startLoadoutSelectionSource),
    false,
    'startLoadoutSelection이 riskRelicData 정적 import에 의존하고 있음',
  );
  assert.equal(
    /from\s+['"]\.\.\/\.\.\/\.\.\/data\/(?:stageData|archetypeData|riskRelicData)\.js['"]/.test(startLoadoutCatalogSource),
    false,
    'startLoadoutCatalog에 stage/archetype/riskRelic 정적 카탈로그 import가 남아 있음',
  );
  assert.equal(
    /from\s+['"]\.\.\/\.\.\/data\/(?:permanentUpgradeData|ascensionData|stageData|archetypeData|riskRelicData)\.js['"]/.test(playerSpawnSource),
    false,
    'playerSpawnApplicationService에 정적 gameplay/meta 카탈로그 import가 남아 있음',
  );
  assert.equal(
    /from\s+['"]\.\.\/\.\.\/\.\.\/data\/stageData\.js['"]/.test(runGuidanceSource),
    false,
    'runGuidanceDomain이 stageData 정적 import에 의존하고 있음',
  );
  assert.equal(
    /from\s+['"]\.\.\/\.\.\/data\/permanentUpgradeData\.js['"]/.test(metaShopAppSource),
    false,
    'metaShopApplicationService가 permanentUpgradeData 정적 import에 의존하고 있음',
  );
});

test('start loadout selection uses injected stage catalogs even when ids overlap built-in content', async () => {
  const { resolveStartWeaponSelection } = await import('../src/domain/meta/loadout/startLoadoutDomain.js');

  const selection = resolveStartWeaponSelection({
    weaponData: [
      { id: 'magic_bolt', isEvolved: false },
    ],
    accessoryData: [],
    stageData: [
      { id: 'ash_plains', name: 'Injected Ash Plains', description: 'injected stage' },
    ],
    archetypeData: [
      { id: 'vanguard', name: 'Injected Vanguard', effects: [] },
    ],
    riskRelicData: [],
  }, {
    meta: {
      unlockedWeapons: ['magic_bolt'],
      selectedStartWeaponId: 'magic_bolt',
      selectedStageId: 'ash_plains',
      selectedArchetypeId: 'vanguard',
      selectedRiskRelicId: null,
    },
  });

  assert.equal(selection.selectedStage?.name, 'Injected Ash Plains', 'injected stage catalog가 선택 결과에 반영되지 않음');
});

test('player spawn state uses injected stage catalogs and meta shop purchase resolves injected upgrades', async () => {
  const { resolvePlayerSpawnState } = await import('../src/app/play/playerSpawnApplicationService.js');
  const { purchaseMetaShopUpgrade } = await import('../src/app/meta/metaShopApplicationService.js');

  const spawnState = resolvePlayerSpawnState({
    meta: {
      permanentUpgrades: {},
      selectedStartWeaponId: 'magic_bolt',
      selectedStageId: 'ash_plains',
      selectedArchetypeId: 'vanguard',
      selectedRiskRelicId: null,
      unlockedWeapons: ['magic_bolt'],
    },
  }, {
    weaponData: [
      { id: 'magic_bolt', isEvolved: false, damage: 10, cooldown: 1, behaviorId: 'targetProjectile' },
    ],
    accessoryData: [],
    stageData: [
      { id: 'ash_plains', name: 'Injected Ash Plains', description: 'spawn stage' },
    ],
    archetypeData: [
      { id: 'vanguard', name: 'Injected Vanguard', effects: [] },
    ],
    riskRelicData: [],
    ascensionData: [
      { level: 0, enemyHpMult: 1, enemyDamageMult: 1, rewardMult: 1 },
    ],
  });

  assert.equal(spawnState.stage?.name, 'Injected Ash Plains', 'player spawn state가 injected stage catalog를 사용하지 않음');

  const session = {
    meta: {
      currency: 25,
      permanentUpgrades: {},
    },
  };
  const result = purchaseMetaShopUpgrade(session, 'custom_upgrade', {
    upgradeData: [
      {
        id: 'custom_upgrade',
        maxLevel: 1,
        costPerLevel() {
          return 25;
        },
      },
    ],
  });

  assert.equal(result.success, true, 'meta shop purchase가 injected upgrade catalog를 사용하지 않음');
  assert.equal(session.meta.permanentUpgrades.custom_upgrade, 1, 'custom meta upgrade purchase가 세션에 반영되지 않음');
});

summary();
