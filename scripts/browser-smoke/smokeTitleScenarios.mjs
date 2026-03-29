import path from 'node:path';
import {
  ensureScenarioDir,
  withDebugRuntime,
  writeScenarioJson,
  bootToPlay,
  sleep,
} from './smokeScenarioShared.mjs';

export async function runTitleToPlayScenario(url, artifactDir, transport) {
  ensureScenarioDir(artifactDir);

  const state = await bootToPlay(url, transport);
  await transport.takeScreenshot(path.join(artifactDir, 'shot.png'));
  const summary = {
    scenario: 'title_to_play',
    state,
    assertions: {
      scene: state?.scene === 'PlayScene',
      weaponCount: (state?.player?.weapons?.length ?? 0) === 1,
    },
  };
  writeScenarioJson(path.join(artifactDir, 'summary.json'), summary);
  return summary;
}

export async function runTitleLoadoutAccessibilityScenario(url, artifactDir, transport) {
  ensureScenarioDir(artifactDir);

  await transport.open(withDebugRuntime(url));
  await transport.resize(390, 640);
  await transport.pollEval(
    `Boolean(document.querySelector('[data-action="start"]'))`,
    (value) => value === true,
    5000,
    150,
  );
  const titleClicked = await transport.clickByText('Start Game');
  if (!titleClicked) {
    throw new Error('Failed to click Start Game button');
  }

  const dialogVisible = await transport.pollEval(
    `Boolean(document.querySelector('.sl-root .sl-panel')) && getComputedStyle(document.querySelector('.sl-root')).display !== 'none'`,
    (value) => value === true,
    5000,
    150,
  );
  if (dialogVisible !== true) {
    throw new Error('Start loadout dialog did not open');
  }

  const dialogMetrics = await transport.evalJson(`[
    window.innerWidth,
    window.innerHeight,
    document.querySelector('.sl-panel')?.getBoundingClientRect?.().top ?? null,
    document.querySelector('.sl-panel')?.getBoundingClientRect?.().bottom ?? null,
    document.querySelector('.sl-panel')?.getBoundingClientRect?.().height ?? null,
    document.querySelector('.sl-panel') ? document.querySelector('.sl-panel').scrollHeight > document.querySelector('.sl-panel').clientHeight : false,
    document.querySelector('.sl-panel') ? getComputedStyle(document.querySelector('.sl-panel')).overflowY : null,
    document.querySelector('.sl-actions') ? getComputedStyle(document.querySelector('.sl-actions')).position : null,
    Boolean(document.querySelector('.sl-panel') && document.activeElement && (document.activeElement === document.querySelector('.sl-panel') || document.querySelector('.sl-panel').contains(document.activeElement))),
    document.querySelector('.sl-advanced-summary')?.textContent?.trim() ?? '',
    document.querySelector('.sl-advanced-panel') ? getComputedStyle(document.querySelector('.sl-advanced-panel')).display : null
  ]`);
  const dialogState = {
    viewport: { width: dialogMetrics[0], height: dialogMetrics[1] },
    panelRect: { top: dialogMetrics[2], bottom: dialogMetrics[3], height: dialogMetrics[4] },
    panelScrollable: dialogMetrics[5],
    panelOverflowY: dialogMetrics[6],
    actionsPosition: dialogMetrics[7],
    focusInsideDialog: dialogMetrics[8],
    advancedSummary: dialogMetrics[9],
    advancedDisplay: dialogMetrics[10],
  };

  await transport.takeScreenshot(path.join(artifactDir, 'shot.png'));
  await transport.press('Escape');
  const closedByEscape = await transport.pollEval(
    `getComputedStyle(document.querySelector('.sl-root')).display === 'none' || !document.querySelector('.sl-root .sl-panel')`,
    (value) => value === true,
    5000,
    150,
  );
  if (closedByEscape !== true) {
    throw new Error('ESC did not close start loadout dialog');
  }

  const reopened = await transport.clickByText('Start Game');
  if (!reopened) {
    throw new Error('Failed to reopen Start Game dialog');
  }
  await transport.pollEval(
    `Boolean(document.querySelector('.sl-root .sl-panel')) && getComputedStyle(document.querySelector('.sl-root')).display !== 'none'`,
    (value) => value === true,
    5000,
    150,
  );

  await transport.press('Tab');
  const tabFocusInsideDialog = await transport.evalJson(`Boolean(document.querySelector('.sl-panel') && document.activeElement && document.activeElement !== document.querySelector('.sl-panel') && document.querySelector('.sl-panel').contains(document.activeElement))`);

  await transport.evalJson(`document.querySelector('.sl-panel') ? (document.querySelector('.sl-panel').scrollTop = document.querySelector('.sl-panel').scrollHeight, true) : false`);

  const postScrollMetrics = await transport.evalJson(`[
    document.querySelector('.sl-panel')?.scrollTop ?? null,
    document.querySelector('.sl-root [data-action="start"]')?.getBoundingClientRect?.().bottom ?? null,
    window.innerHeight
  ]`);
  const postScrollState = {
    panelScrollTop: postScrollMetrics[0],
    startButtonBottom: postScrollMetrics[1],
    viewportHeight: postScrollMetrics[2],
  };

  const loadoutClicked = await transport.clickByText('시작하기');
  if (!loadoutClicked) {
    throw new Error('Failed to click loadout start button after scrolling');
  }
  await sleep(250);
  await transport.evalJson('window.__ASHEN_DEBUG__?.advanceTime?.(136), true');
  const playState = await transport.pollEval(
    'window.__ASHEN_DEBUG__?.getSnapshot?.() ?? null',
    (state) => state?.scene === 'PlayScene',
    5000,
    200,
  );

  const summary = {
    scenario: 'title_loadout_accessibility',
    dialogState,
    postScrollState,
    playState,
    assertions: {
      viewportApplied: dialogState?.viewport?.width === 390 && dialogState?.viewport?.height === 640,
      panelWithinViewport: typeof dialogState?.panelRect?.top === 'number'
        && dialogState.panelRect.top >= 0
        && dialogState.panelRect.bottom <= dialogState.viewport.height,
      panelScrollable: dialogState?.panelScrollable === true && dialogState?.panelOverflowY === 'auto',
      stickyActions: dialogState?.actionsPosition === 'sticky',
      initialFocusInsideDialog: dialogState?.focusInsideDialog === true,
      hasAdvancedSummary: typeof dialogState?.advancedSummary === 'string' && dialogState.advancedSummary.length > 0,
      advancedClosedByDefault: dialogState?.advancedDisplay === 'none',
      escapeCloses: closedByEscape === true,
      tabMovesWithinDialog: tabFocusInsideDialog === true,
      startButtonReachableAfterScroll: typeof postScrollState?.startButtonBottom === 'number'
        && postScrollState.startButtonBottom <= postScrollState.viewportHeight,
      startRunWorks: playState?.scene === 'PlayScene',
    },
  };
  writeScenarioJson(path.join(artifactDir, 'summary.json'), summary);
  return summary;
}

export async function runTitleCodexScenario(url, artifactDir, transport) {
  ensureScenarioDir(artifactDir);

  await transport.open(withDebugRuntime(url));
  await transport.pollEval(
    `Boolean(document.querySelector('[data-action="codex"]'))`,
    (value) => value === true,
    5000,
    150,
  );
  let codexClicked = await transport.clickByText('Codex');
  if (!codexClicked) {
    await transport.runCode(`(() => {
      const button = document.querySelector('[data-action="codex"]');
      if (button) {
        button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        button.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
        button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      }
      return true;
    })()`);
    codexClicked = true;
  }
  const codexReady = await transport.pollEval(
    "Boolean(document.querySelector('.cx-root')) && Boolean(document.querySelector('.cx-tab[data-tab=\"accessory\"]'))",
    (value) => value === true,
    5000,
    200,
  );
  if (!codexClicked || codexReady !== true) {
    throw new Error('Failed to open Codex scene');
  }
  const state = { scene: codexReady ? 'CodexScene' : null };

  let accessoryTabClicked = await transport.clickByText('장신구');
  if (!accessoryTabClicked) {
    accessoryTabClicked = await transport.evalJson(
      `document.querySelector('.cx-tab[data-tab="accessory"]')
        ? (document.querySelector('.cx-tab[data-tab="accessory"]').click(), true)
        : false`,
    );
  }
  if (!accessoryTabClicked) {
    throw new Error('Failed to click accessory tab');
  }
  const codexUi = {
    rootVisible: await transport.evalJson(`Boolean(document.querySelector('.cx-root'))`),
    tabCount: await transport.evalJson(`document.querySelectorAll('.cx-tab').length`),
    tabProgressCount: await transport.evalJson(`document.querySelectorAll('.cx-tab-progress').length`),
    discoveryStripCount: await transport.evalJson(`document.querySelectorAll('.cx-disc-pill').length`),
    accessoryTabActive: await transport.evalJson(`Boolean(document.querySelector('#cx-tab-accessory')) && Boolean(document.querySelector('.cx-tab[data-tab="accessory"]'))`),
    accessoryFilterCount: await transport.evalJson(`document.querySelectorAll('#cx-tab-accessory .cx-af').length`),
    effectFilterCount: await transport.evalJson(`document.querySelectorAll('#cx-tab-accessory .cx-ef').length`),
    statusFilterCount: await transport.evalJson(`document.querySelectorAll('#cx-tab-accessory .cx-sf').length`),
    accessoryDetailVisible: await transport.evalJson(`Boolean(document.getElementById('cx-accessory-detail'))`),
    accessoryHintCount: await transport.evalJson(`document.getElementById('cx-tab-accessory') ? document.getElementById('cx-tab-accessory').querySelectorAll('.cx-discovery-hint').length : 0`),
  };
  await transport.takeScreenshot(path.join(artifactDir, 'shot.png'));
  const summary = {
    scenario: 'title_codex',
    state,
    codexUi,
    assertions: {
      scene: state?.scene === 'CodexScene',
      rootVisible: codexUi.rootVisible === true,
      hasTabs: codexUi.tabCount >= 4,
      hasTabProgress: codexUi.tabProgressCount >= 3,
      removedDiscoveryStrip: codexUi.discoveryStripCount === 0,
      hasAccessoryTab: codexUi.accessoryTabActive === true,
      hasAccessoryFilters: codexUi.accessoryFilterCount >= 4 && codexUi.effectFilterCount >= 4 && codexUi.statusFilterCount >= 3,
      hasAccessoryDetail: codexUi.accessoryDetailVisible === true,
      hasHint: codexUi.accessoryHintCount >= 1,
    },
  };
  writeScenarioJson(path.join(artifactDir, 'summary.json'), summary);
  return summary;
}

export async function runTitleMetaShopScenario(url, artifactDir, transport) {
  ensureScenarioDir(artifactDir);

  await transport.open(withDebugRuntime(url));
  await transport.pollEval(
    `Boolean(document.querySelector('[data-action="shop"]'))`,
    (value) => value === true,
    5000,
    150,
  );
  await transport.evalJson(`window.__ASHEN_DEBUG__ ? ((window.__ASHEN_DEBUG__.getGame().session.meta.currency = 999), (window.__ASHEN_DEBUG__.getGame().session.meta.permanentUpgrades = window.__ASHEN_DEBUG__.getGame().session.meta.permanentUpgrades || {}), true) : false`);
  const shopClicked = await transport.clickByText('Meta Shop');
  if (!shopClicked) {
    throw new Error('Failed to click Meta Shop button');
  }

  const state = await transport.pollEval(
    'window.__ASHEN_DEBUG__?.getSnapshot?.() ?? null',
    (value) => value?.scene === 'MetaShopScene',
    5000,
    200,
  );

  const [shopRootVisible, enabledButtons, currencyLabel] = await transport.evalJson(`[Boolean(document.querySelector('.ms-root')), document.querySelectorAll('.ms-buy-btn:not([disabled])').length, document.querySelector('.ms-currency-value')?.textContent?.trim() ?? '']`);
  const shopUiBefore = {
    rootVisible: shopRootVisible,
    enabledButtons,
    currencyLabel,
  };

  const purchasedUpgradeId = await transport.evalJson(`document.querySelector('.ms-buy-btn:not([disabled])')?.dataset?.id ?? null`);
  await transport.evalJson(`document.querySelector('.ms-buy-btn:not([disabled])') ? (document.querySelector('.ms-buy-btn:not([disabled])').click(), true) : false`);

  const persistedSession = await transport.pollEval(
    `JSON.parse(localStorage.getItem('ashenRequiem_session') || 'null')`,
    (value) => Boolean(value?.meta),
    5000,
    200,
  );

  await transport.takeScreenshot(path.join(artifactDir, 'shot.png'));
  const summary = {
    scenario: 'title_meta_shop',
    state,
    shopUiBefore,
    purchasedUpgradeId,
    persistedSession: {
      currency: persistedSession?.meta?.currency ?? null,
      level: purchasedUpgradeId ? persistedSession?.meta?.permanentUpgrades?.[purchasedUpgradeId] ?? 0 : 0,
    },
    assertions: {
      scene: state?.scene === 'MetaShopScene',
      rootVisible: shopUiBefore.rootVisible === true,
      hasEnabledPurchase: shopUiBefore.enabledButtons >= 1,
      purchaseRecorded: typeof purchasedUpgradeId === 'string' && purchasedUpgradeId.length > 0,
      persistedCurrencySpent: typeof persistedSession?.meta?.currency === 'number' && persistedSession.meta.currency < 999,
      persistedUpgradeLevel: !purchasedUpgradeId || (persistedSession?.meta?.permanentUpgrades?.[purchasedUpgradeId] ?? 0) >= 1,
    },
  };
  writeScenarioJson(path.join(artifactDir, 'summary.json'), summary);
  return summary;
}

export async function runTitleSettingsScenario(url, artifactDir, transport) {
  ensureScenarioDir(artifactDir);

  await transport.open(withDebugRuntime(url));
  await transport.pollEval(
    `Boolean(document.querySelector('[data-action="settings"]'))`,
    (value) => value === true,
    5000,
    150,
  );
  const settingsClicked = await transport.clickByText('Settings');
  if (!settingsClicked) {
    throw new Error('Failed to click Settings button');
  }
  const state = await transport.pollEval(
    'window.__ASHEN_DEBUG__?.getSnapshot?.() ?? null',
    (value) => value?.scene === 'SettingsScene',
    5000,
    200,
  );
  const settingsUi = {
    rootVisible: await transport.evalJson(`Boolean(document.querySelector('.sv-root'))`),
    saveLabel: await transport.evalJson(`document.querySelector('.sv-btn-primary')?.textContent?.trim() ?? ''`),
  };
  await transport.takeScreenshot(path.join(artifactDir, 'shot.png'));
  const summary = {
    scenario: 'title_settings',
    state,
    settingsUi,
    assertions: {
      scene: state?.scene === 'SettingsScene',
      rootVisible: settingsUi.rootVisible === true,
      hasSaveButton: typeof settingsUi.saveLabel === 'string'
        && settingsUi.saveLabel.includes('저장하고 닫기'),
    },
  };
  writeScenarioJson(path.join(artifactDir, 'summary.json'), summary);
  return summary;
}

export async function runTitleSettingsPersistScenario(url, artifactDir, transport) {
  ensureScenarioDir(artifactDir);

  await transport.open(withDebugRuntime(url));
  await transport.pollEval(
    `Boolean(document.querySelector('[data-action="settings"]'))`,
    (value) => value === true,
    5000,
    150,
  );
  const settingsClicked = await transport.clickByText('Settings');
  if (!settingsClicked) {
    throw new Error('Failed to click Settings button');
  }

  await transport.pollEval(
    `Boolean(document.querySelector('.sv-root'))`,
    (value) => value === true,
    5000,
    200,
  );

  const changed = await transport.evalJson(`Boolean(document.querySelector('.sv-slider[data-key="masterVolume"]')) && Boolean(document.querySelector('.sv-switch[data-key="soundEnabled"]')) && Boolean(document.querySelector('.sv-btn-primary'))`);
  if (changed) {
    await transport.evalJson(`document.querySelector('.sv-slider[data-key="masterVolume"]').value = '72', document.querySelector('.sv-slider[data-key="masterVolume"]').dispatchEvent(new Event('input', { bubbles: true })), true`);
    await transport.evalJson(`document.querySelector('.sv-switch[data-key="soundEnabled"]')?.getAttribute('aria-checked') !== 'false' ? (document.querySelector('.sv-switch[data-key="soundEnabled"]').click(), true) : true`);
    await transport.evalJson(`document.querySelector('.sv-btn-primary') ? (document.querySelector('.sv-btn-primary').click(), true) : false`);
  }

  const state = await transport.pollEval(
    'window.__ASHEN_DEBUG__?.getSnapshot?.() ?? null',
    (value) => value?.scene === 'TitleScene',
    5000,
    200,
  );

  const persistedSession = await transport.pollEval(
    `JSON.parse(localStorage.getItem('ashenRequiem_session') || 'null')`,
    (value) => typeof value?.options?.masterVolume === 'number',
    5000,
    200,
  );

  await transport.takeScreenshot(path.join(artifactDir, 'shot.png'));
  const summary = {
    scenario: 'title_settings_persist',
    state,
    changed,
    persistedOptions: {
      masterVolume: persistedSession?.options?.masterVolume ?? null,
      soundEnabled: persistedSession?.options?.soundEnabled ?? null,
    },
    assertions: {
      changed: changed === true,
      returnedToTitle: state?.scene === 'TitleScene',
      masterVolumePersisted: persistedSession?.options?.masterVolume === 72,
      soundTogglePersisted: persistedSession?.options?.soundEnabled === false,
    },
  };
  writeScenarioJson(path.join(artifactDir, 'summary.json'), summary);
  return summary;
}
