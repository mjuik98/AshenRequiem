import { purchaseMetaShopUpgrade } from './metaShopApplicationService.js';

function buildMetaShopViewPayload({ session, gameData } = {}) {
  return {
    session,
    viewOptions: { gameData },
  };
}

export function createMetaShopSceneApplicationService({ session, gameData } = {}) {
  function getViewPayload() {
    return buildMetaShopViewPayload({ session, gameData });
  }

  function purchaseUpgrade(upgradeId) {
    const result = purchaseMetaShopUpgrade(session, upgradeId, { gameData });
    return {
      ...result,
      shouldRefresh: result.success === true,
      ...getViewPayload(),
    };
  }

  return {
    getViewPayload,
    purchaseUpgrade,
  };
}
