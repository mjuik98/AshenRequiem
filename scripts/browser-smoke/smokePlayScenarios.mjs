import path from 'node:path';
import {
  bootToPlay,
  ensureScenarioDir,
  findRefByText,
  readSnapshotContent,
  sleep,
  writeScenarioJson,
} from './smokeScenarioShared.mjs';

export async function runPauseOverlayScenario(url, artifactDir, transport) {
  ensureScenarioDir(artifactDir);

  await bootToPlay(url, transport);
  const pauseOpened = await transport.evalJson('window.__ASHEN_DEBUG__?.openPauseOverlay?.() ?? false');
  if (pauseOpened !== true) {
    throw new Error('Pause overlay did not open');
  }
  const state = await transport.pollEval(
    'window.__ASHEN_DEBUG__?.getSnapshot?.() ?? null',
    (value) => value?.ui?.pauseVisible === true,
    3000,
    150,
  );
  const pauseSnapshot = await transport.snapshotPath();
  const weaponRef = findRefByText(readSnapshotContent(pauseSnapshot), '마법탄');
  if (!weaponRef) {
    throw new Error('Failed to find 마법탄 ref from pause snapshot');
  }
  await transport.hover(weaponRef);
  const hover = {
    ok: true,
    weaponRef,
    cardName: await transport.evalJson(`document.querySelector('.pv-slot-card[data-loadout="weapon"] .pv-slot-name')?.textContent ?? ''`),
  };
  const tooltipVisible = await transport.pollEval(
    `!!document.querySelector('.pv-tooltip')
      && getComputedStyle(document.querySelector('.pv-tooltip')).display !== 'none'`,
    (value) => value === true,
    3000,
    150,
  );
  const tooltip = {
    visible: tooltipVisible === true,
    text: await transport.evalJson(`document.querySelector('.pv-tooltip')?.innerText ?? ''`),
  };
  await transport.takeScreenshot(path.join(artifactDir, 'shot.png'));
  const summary = {
    scenario: 'pause_overlay',
    pauseOpened,
    hover,
    state,
    tooltip,
    assertions: {
      pauseVisible: state?.ui?.pauseVisible === true,
      tooltipVisible: tooltip?.visible === true,
      hasTooltipText: typeof tooltip?.text === 'string'
        && tooltip.text.includes(hover?.cardName ?? ''),
    },
  };
  writeScenarioJson(path.join(artifactDir, 'summary.json'), summary);
  return summary;
}

export async function runPauseLayoutScenario(url, artifactDir, transport) {
  ensureScenarioDir(artifactDir);

  const readLayoutState = async (includeVisible = false) => ({
    selected: await transport.evalJson(`document.querySelector('.pv-slot-card.selected')?.dataset.loadoutKey ?? null`),
    grid: await transport.evalJson(`getComputedStyle(document.querySelector('.pv-loadout-panel')).gridTemplateColumns ?? ''`),
    width: await transport.evalJson('window.innerWidth'),
    height: await transport.evalJson('window.innerHeight'),
    ...(includeVisible
      ? { visible: await transport.evalJson(`!!document.querySelector('#pv-tab-loadout.active')`) }
      : {}),
  });

  await bootToPlay(url, transport);
  const pauseOpened = await transport.evalJson('window.__ASHEN_DEBUG__?.openPauseOverlay?.() ?? false');
  if (pauseOpened !== true) {
    throw new Error('Pause overlay did not open');
  }

  await transport.pollEval(
    'window.__ASHEN_DEBUG__?.getSnapshot?.() ?? null',
    (value) => value?.ui?.pauseVisible === true,
    3000,
    150,
  );

  const desktopBefore = await readLayoutState();

  const layoutSnapshot = await transport.snapshotPath();
  const alternateRef = findRefByText(readSnapshotContent(layoutSnapshot), '빈 무기 슬롯');
  if (!alternateRef) {
    throw new Error('Failed to find 빈 무기 슬롯 ref from pause layout snapshot');
  }
  await transport.click(alternateRef);
  await sleep(120);
  const accessorySelection = await transport.evalJson(
    `document.querySelector('.pv-slot-card.selected')?.dataset.loadoutKey ?? null`,
  );

  await transport.press('Escape');
  await sleep(180);
  await transport.press('Escape');
  await sleep(250);

  const desktopReopen = await readLayoutState(true);

  await transport.resize(540, 960);
  await sleep(180);

  const mobile = await readLayoutState();

  await transport.takeScreenshot(path.join(artifactDir, 'shot.png'));
  const summary = {
    scenario: 'pause_layout',
    pauseOpened,
    desktopBefore,
    accessorySelection,
    desktopReopen,
    mobile,
    assertions: {
      pauseVisibleAfterReopen: desktopReopen?.visible === true,
      selectionChanged: Boolean(accessorySelection) && accessorySelection !== desktopBefore?.selected,
      selectionPersisted: Boolean(accessorySelection) && desktopReopen?.selected === accessorySelection,
      mobileStillSelected: mobile?.selected === accessorySelection,
      mobileSingleColumn: String(mobile?.grid ?? '').trim().split(/\s+/).length === 1,
      mobileViewportApplied: mobile?.width <= 540,
    },
  };
  writeScenarioJson(path.join(artifactDir, 'summary.json'), summary);
  return summary;
}

export async function runResultScreenScenario(url, artifactDir, transport) {
  ensureScenarioDir(artifactDir);

  await bootToPlay(url, transport);
  const resultOpened = await transport.evalJson('window.__ASHEN_DEBUG__?.openResultOverlay?.() ?? false');
  if (resultOpened !== true) {
    throw new Error('Result overlay did not open');
  }
  const triggerState = await transport.pollEval(
    'window.__ASHEN_DEBUG__?.getSnapshot?.() ?? null',
    (value) => value?.ui?.resultVisible === true,
    3000,
    150,
  );
  const state = await transport.pollEval(
    'window.__ASHEN_DEBUG__?.getSnapshot?.() ?? null',
    (value) => value?.ui?.resultVisible === true,
    3000,
    150,
  );
  const resultUi = {
    title: await transport.evalJson(`document.querySelector('.result-title')?.textContent?.trim() ?? ''`),
    restart: await transport.evalJson(`document.querySelector('.result-restart-btn')?.textContent?.trim() ?? ''`),
    titleButton: await transport.evalJson(`document.querySelector('.result-title-btn')?.textContent?.trim() ?? ''`),
  };
  await transport.takeScreenshot(path.join(artifactDir, 'shot.png'));
  const summary = {
    scenario: 'result_screen',
    resultOpened,
    triggerState,
    state,
    resultUi,
    assertions: {
      resultVisible: state?.ui?.resultVisible === true,
      hasOutcomeTitle: typeof resultUi?.title === 'string'
        && ['DEFEAT', 'VICTORY'].includes(resultUi.title),
      hasRestartButton: typeof resultUi?.restart === 'string' && resultUi.restart.includes('다시 시작'),
      hasTitleButton: typeof resultUi?.titleButton === 'string'
        && resultUi.titleButton.includes('메인 화면으로'),
    },
  };
  writeScenarioJson(path.join(artifactDir, 'summary.json'), summary);
  return summary;
}
