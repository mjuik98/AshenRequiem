import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { makeSessionState } from './fixtures/index.js';
import { readProjectSource } from './helpers/sourceInspection.js';

console.log('\n[GameDataInjectionBoundaries]');

const { test, summary } = createRunner('GameDataInjectionBoundaries');

test('meta progression helpers avoid static unlock/upgrade data fallbacks and consume injected gameData', async () => {
  const unlockGuidanceSource = readProjectSource('../src/domain/meta/progression/unlockGuidanceDomain.js');
  const metaGoalSource = readProjectSource('../src/domain/meta/progression/metaGoalDomain.js');
  const titleLoadoutQuerySource = readProjectSource('../src/app/title/titleLoadoutQueryService.js');
  const codexRecordsQuerySource = readProjectSource('../src/app/meta/codexRecordsQueryService.js');
  const metaShopQuerySource = readProjectSource('../src/app/meta/metaShopViewModelService.js');
  const metaShopSceneSource = readProjectSource('../src/scenes/MetaShopScene.js');
  const metaShopViewSource = readProjectSource('../src/ui/metashop/MetaShopView.js');

  assert.equal(/defaultUnlockData/.test(unlockGuidanceSource), false, 'unlockGuidanceDomain이 static unlockData fallback를 유지하면 안 됨');
  assert.equal(/defaultUnlockData|defaultPermanentUpgradeData/.test(metaGoalSource), false, 'metaGoalDomain이 static unlock/upgrade fallback를 유지하면 안 됨');
  assert.equal(titleLoadoutQuerySource.includes('gameData?.unlockData ?? []'), true, 'titleLoadout query가 unlockData를 명시 주입하지 않음');
  assert.equal(codexRecordsQuerySource.includes('buildCodexUnlockEntries(session, gameData?.unlockData ?? [])'), true, 'codex records query가 unlockData를 명시 주입하지 않음');
  assert.equal(metaShopQuerySource.includes("from '../../data/permanentUpgradeData.js'"), false, 'meta shop query가 static permanentUpgradeData를 직접 import하면 안 됨');
  assert.equal(metaShopQuerySource.includes('gameData?.permanentUpgradeData'), true, 'meta shop query가 injected permanentUpgradeData를 읽지 않음');
  assert.equal(metaShopSceneSource.includes('this.game.gameData'), true, 'MetaShopScene이 MetaShopView에 gameData를 전달하지 않음');
  assert.equal(metaShopViewSource.includes('this._gameData'), true, 'MetaShopView가 injected gameData를 보존하지 않음');
});

test('meta shop query service can build cards purely from injected gameData', async () => {
  const { buildMetaShopViewModel } = await import('../src/app/meta/metaShopViewModelService.js');

  const session = makeSessionState({
    meta: {
      currency: 15,
      permanentUpgrades: {},
    },
  });
  const viewModel = buildMetaShopViewModel(session, {
    gameData: {
      permanentUpgradeData: [
        {
          id: 'perm_hp',
          icon: '❤',
          name: '강인한 체질',
          description: '최대 HP를 늘립니다.',
          maxLevel: 5,
          costPerLevel: () => 10,
          effect: { stat: 'maxHp', valuePerLevel: 10 },
        },
      ],
    },
  });

  assert.equal(viewModel.cards.length, 1, 'injected permanentUpgradeData만으로 카드가 계산되지 않음');
  assert.equal(viewModel.selectedCard?.id, 'perm_hp', 'injected permanentUpgradeData 기준 선택 카드가 계산되지 않음');
});

summary();
