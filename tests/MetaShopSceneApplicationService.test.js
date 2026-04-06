import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { makeSessionState } from './fixtures/index.js';

console.log('\n[MetaShopSceneApplicationService]');

const { test, summary } = createRunner('MetaShopSceneApplicationService');

test('meta shop scene application service는 view payload와 purchase refresh 판단을 함께 제공한다', async () => {
  const {
    createMetaShopSceneApplicationService,
  } = await import('../src/app/meta/metaShopSceneApplicationService.js');

  const session = makeSessionState({
    meta: {
      currency: 200,
      permanentUpgrades: {},
    },
  });
  const gameData = {
    permanentUpgradeData: [
      {
        id: 'perm_hp',
        maxLevel: 3,
        costPerLevel(level) {
          return level === 0 ? 50 : 75;
        },
      },
    ],
  };
  const service = createMetaShopSceneApplicationService({ session, gameData });

  const initial = service.getViewPayload();
  assert.equal(initial.session, session, 'scene service가 현재 세션을 그대로 전달하지 않음');
  assert.deepEqual(initial.viewOptions, { gameData }, 'scene service가 view payload에 gameData를 붙이지 않음');

  const purchase = service.purchaseUpgrade('perm_hp');
  assert.equal(purchase.success, true, 'scene service가 purchase 결과를 그대로 전달하지 않음');
  assert.equal(purchase.shouldRefresh, true, '성공한 purchase는 scene refresh를 요청해야 함');
  assert.equal(purchase.session, session, 'scene refresh는 동일 session 객체를 재사용해야 함');
  assert.deepEqual(purchase.viewOptions, { gameData }, 'scene refresh payload가 gameData를 유지하지 않음');
  assert.equal(session.meta.currency, 150, 'scene service가 성공 purchase를 세션에 반영하지 않음');
  assert.equal(session.meta.permanentUpgrades.perm_hp, 1, 'scene service가 purchase level 증가를 반영하지 않음');
});

test('meta shop scene application service는 실패한 purchase에서 scene refresh를 요구하지 않는다', async () => {
  const {
    createMetaShopSceneApplicationService,
  } = await import('../src/app/meta/metaShopSceneApplicationService.js');

  const session = makeSessionState({
    meta: {
      currency: 5,
      permanentUpgrades: {},
    },
  });
  const gameData = {
    permanentUpgradeData: [
      {
        id: 'perm_hp',
        maxLevel: 3,
        costPerLevel() {
          return 50;
        },
      },
    ],
  };
  const service = createMetaShopSceneApplicationService({ session, gameData });

  const result = service.purchaseUpgrade('perm_hp');
  assert.equal(result.success, false, 'scene service가 실패 purchase를 성공으로 바꾸면 안 됨');
  assert.equal(result.reason, 'insufficient-currency', 'scene service가 실패 사유를 그대로 노출하지 않음');
  assert.equal(result.shouldRefresh, false, '실패한 purchase는 scene refresh를 요청하면 안 됨');
  assert.equal(session.meta.currency, 5, '실패한 purchase가 세션 재화를 변경하면 안 됨');
  assert.equal(session.meta.permanentUpgrades.perm_hp ?? 0, 0, '실패한 purchase가 영구 업그레이드 레벨을 변경하면 안 됨');
});

summary();
