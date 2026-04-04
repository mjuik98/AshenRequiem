import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { readProjectSource } from './helpers/sourceInspection.js';

console.log('\n[UiQueryServiceBoundaries]');

const { test, summary } = createRunner('UiQueryServiceBoundaries');

test('title loadout query logic is owned by the app-layer service', async () => {
  const titleLoadout = await import('../src/scenes/title/titleLoadout.js');
  const titleLoadoutQuery = await import('../src/app/title/titleLoadoutQueryService.js');
  const titleLoadoutSource = readProjectSource('../src/scenes/title/titleLoadout.js');
  const startLoadoutViewSource = readProjectSource('../src/ui/title/StartLoadoutView.js');

  assert.equal(titleLoadout.buildTitleLoadoutConfig, titleLoadoutQuery.buildTitleLoadoutConfig);
  assert.equal(titleLoadout.getAvailableStartWeapons, titleLoadoutQuery.getAvailableStartWeapons);
  assert.equal(titleLoadoutSource.includes("from '../../app/title/titleLoadoutQueryService.js'"), true, 'titleLoadout facade가 app query service를 재노출하지 않음');
  assert.equal(titleLoadoutSource.includes("from '../../domain/meta/loadout/startLoadoutDomain.js'"), false, 'titleLoadout facade가 domain helper를 직접 소유하면 안 됨');
  assert.equal(startLoadoutViewSource.includes("from '../../app/title/titleLoadoutQueryService.js'"), true, 'StartLoadoutView가 app query service를 사용하지 않음');
  assert.equal(startLoadoutViewSource.includes("from '../../domain/meta/loadout/startLoadoutPresentation.js'"), false, 'StartLoadoutView가 domain presentation helper를 직접 소유하면 안 됨');
});

test('codex query/model builders are owned by app-layer services with UI facades kept as wrappers', async () => {
  const enemyTab = await import('../src/ui/codex/codexEnemyTab.js');
  const enemyQuery = await import('../src/app/meta/codexEnemyQueryService.js');
  const weaponModel = await import('../src/ui/codex/codexWeaponModel.js');
  const weaponQuery = await import('../src/app/meta/codexWeaponQueryService.js');
  const accessoryModel = await import('../src/ui/codex/codexAccessoryModel.js');
  const accessoryQuery = await import('../src/app/meta/codexAccessoryQueryService.js');
  const enemyTabSource = readProjectSource('../src/ui/codex/codexEnemyTab.js');
  const weaponModelSource = readProjectSource('../src/ui/codex/codexWeaponModel.js');
  const accessoryModelSource = readProjectSource('../src/ui/codex/codexAccessoryModel.js');

  assert.equal(enemyTab.buildCodexEnemyGridModel, enemyQuery.buildCodexEnemyGridModel);
  assert.equal(enemyTab.buildCodexEnemyDetailModel, enemyQuery.buildCodexEnemyDetailModel);
  assert.equal(weaponModel.buildCodexWeaponCollectionModel, weaponQuery.buildCodexWeaponCollectionModel);
  assert.equal(weaponModel.buildCodexWeaponDetailModel, weaponQuery.buildCodexWeaponDetailModel);
  assert.equal(accessoryModel.buildCodexAccessoryGridModel, accessoryQuery.buildCodexAccessoryGridModel);
  assert.equal(accessoryModel.buildCodexAccessoryDetailModel, accessoryQuery.buildCodexAccessoryDetailModel);
  assert.equal(enemyTabSource.includes("from '../../app/meta/codexEnemyQueryService.js'"), true, 'codexEnemyTab facade가 app query service를 재노출하지 않음');
  assert.equal(weaponModelSource.includes("from '../../app/meta/codexWeaponQueryService.js'"), true, 'codexWeaponModel facade가 app query service를 재노출하지 않음');
  assert.equal(accessoryModelSource.includes("from '../../app/meta/codexAccessoryQueryService.js'"), true, 'codexAccessoryModel facade가 app query service를 재노출하지 않음');
});

summary();
