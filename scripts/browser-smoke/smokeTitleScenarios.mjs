import path from 'node:path';
import {
  ensureScenarioDir,
  withDebugRuntime,
  writeScenarioJson,
  bootToPlay,
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

export async function runTitleCodexScenario(url, artifactDir, transport) {
  ensureScenarioDir(artifactDir);

  await transport.open(withDebugRuntime(url));
  await transport.pollEval(
    `Boolean(document.querySelector('[data-action="codex"]'))`,
    (value) => value === true,
    5000,
    150,
  );
  const codexClicked = await transport.clickByText('Codex');
  if (!codexClicked) {
    throw new Error('Failed to click Codex button');
  }
  const codexReady = await transport.pollEval(
    "Boolean(document.querySelector('.cx-root')) && Boolean(document.querySelector('.cx-tab[data-tab=\"accessory\"]'))",
    (value) => value === true,
    5000,
    200,
  );
  const state = { scene: codexReady ? 'CodexScene' : null };

  const discoveryStripCount = await transport.evalJson(`document.querySelectorAll('.cx-disc-pill').length`);
  const accessoryTabClicked = await transport.clickByText('장신구 도감');
  if (!accessoryTabClicked) {
    throw new Error('Failed to click accessory tab');
  }
  const codexUi = {
    rootVisible: await transport.evalJson(`Boolean(document.querySelector('.cx-root'))`),
    tabCount: await transport.evalJson(`document.querySelectorAll('.cx-tab').length`),
    discoveryStripCount,
    accessoryTabActive: await transport.evalJson(`Boolean(document.querySelector('#cx-tab-accessory')) && Boolean(document.querySelector('.cx-tab[data-tab="accessory"]'))`),
    accessoryFilterCount: await transport.evalJson(`document.querySelectorAll('#cx-tab-accessory .cx-af').length`),
    effectFilterCount: await transport.evalJson(`document.querySelectorAll('#cx-tab-accessory .cx-ef').length`),
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
      hasDiscoveryStrip: codexUi.discoveryStripCount >= 3,
      hasAccessoryTab: codexUi.accessoryTabActive === true,
      hasAccessoryFilters: codexUi.accessoryFilterCount >= 4 && codexUi.effectFilterCount >= 4,
      hasAccessoryDetail: codexUi.accessoryDetailVisible === true,
      hasHint: codexUi.accessoryHintCount >= 1,
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
