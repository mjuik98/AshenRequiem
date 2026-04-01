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
  let hoverUsedFallback = false;
  if (weaponRef) {
    await transport.hover(weaponRef);
  } else if (typeof transport.runCode === 'function') {
    await transport.runCode(`async (page) => {
      const hovered = await page.evaluate(() => {
        const card = document.querySelector('.pv-slot-card[data-loadout="weapon"]');
        if (!card) return false;
        card.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, cancelable: true }));
        card.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, cancelable: true }));
        card.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, cancelable: true }));
        return true;
      });
      if (!hovered) {
        throw new Error('Failed to dispatch hover events for pause overlay weapon card');
      }
    }`);
    hoverUsedFallback = true;
  } else {
    throw new Error('Failed to find 마법탄 ref from pause snapshot');
  }
  const hover = {
    ok: true,
    weaponRef,
    usedFallback: hoverUsedFallback,
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
  const keyboardState = {
    focusInsideDialog: await transport.evalJson(`Boolean(document.querySelector('.pv-panel') && document.activeElement && (document.activeElement === document.querySelector('.pv-panel') || document.querySelector('.pv-panel').contains(document.activeElement)))`),
  };
  const overviewPresent = await transport.evalJson(`Boolean(document.querySelector('.pv-loadout-overview'))`);
  await transport.press('Tab');
  await sleep(120);
  keyboardState.tabMovesWithinDialog = await transport.evalJson(`Boolean(document.querySelector('.pv-panel') && document.activeElement && document.activeElement !== document.querySelector('.pv-panel') && document.querySelector('.pv-panel').contains(document.activeElement))`);
  await transport.takeScreenshot(path.join(artifactDir, 'shot.png'));
  await transport.press('Escape');
  let resumedState = await transport.pollEval(
    'window.__ASHEN_DEBUG__?.getSnapshot?.() ?? null',
    (value) => value?.ui?.pauseVisible === false,
    3000,
    150,
  );
  if (resumedState?.ui?.pauseVisible !== false) {
    await sleep(180);
    await transport.press('Escape');
    resumedState = await transport.pollEval(
      'window.__ASHEN_DEBUG__?.getSnapshot?.() ?? null',
      (value) => value?.ui?.pauseVisible === false,
      3000,
      150,
    );
  }
  keyboardState.escapeResumes = resumedState?.ui?.pauseVisible === false;
  const summary = {
    scenario: 'pause_overlay',
    pauseOpened,
    hover,
    state,
    tooltip,
    keyboardState,
    assertions: {
      pauseVisible: state?.ui?.pauseVisible === true,
      tooltipVisible: tooltip?.visible === true,
      hasTooltipText: typeof tooltip?.text === 'string'
        && tooltip.text.includes(hover?.cardName ?? ''),
      overviewRemoved: overviewPresent === false,
      focusInsideDialog: keyboardState?.focusInsideDialog === true,
      tabMovesWithinDialog: keyboardState?.tabMovesWithinDialog === true,
      escapeResumes: keyboardState?.escapeResumes === true,
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

export async function runLevelUpOverlayScenario(url, artifactDir, transport) {
  ensureScenarioDir(artifactDir);

  await bootToPlay(url, transport);
  const levelUpOpened = await transport.evalJson('window.__ASHEN_DEBUG__?.openLevelUpOverlay?.() ?? false');
  if (levelUpOpened !== true) {
    throw new Error('Level up overlay did not open');
  }
  const state = await transport.pollEval(
    'window.__ASHEN_DEBUG__?.getSnapshot?.() ?? null',
    (value) => value?.ui?.levelUpVisible === true,
    3000,
    150,
  );
  const overlayUi = {
    progression: await transport.evalJson(`document.querySelector('.card-progression')?.textContent?.trim() ?? ''`),
    summary: await transport.evalJson(`document.querySelector('.card-summary')?.textContent?.trim() ?? ''`),
    current: await transport.evalJson(`document.querySelector('.card-current-text')?.textContent?.trim() ?? ''`),
    preview: await transport.evalJson(`document.querySelector('.card-preview-text')?.textContent?.trim() ?? ''`),
    discovery: await transport.evalJson(`document.querySelector('.card-discovery-chip')?.textContent?.trim() ?? ''`),
    relatedHintCount: await transport.evalJson(`document.querySelectorAll('.card-related-chip').length`),
    firstPriorityHint: await transport.evalJson(`document.querySelector('.card-priority-hint')?.textContent?.trim() ?? ''`),
    secondPriorityHint: await transport.evalJson(`document.querySelectorAll('.card-priority-hint')[1]?.textContent?.trim() ?? ''`),
  };
  const keyboardState = {
    focusInsideDialog: await transport.evalJson(`Boolean(document.querySelector('.levelup-stage') && document.activeElement && (document.activeElement === document.querySelector('.levelup-stage') || document.querySelector('.levelup-stage').contains(document.activeElement)))`),
  };
  await transport.press('Tab');
  await sleep(120);
  keyboardState.tabMovesWithinDialog = await transport.evalJson(`Boolean(document.querySelector('.levelup-stage') && document.activeElement && document.activeElement !== document.querySelector('.levelup-stage') && document.querySelector('.levelup-stage').contains(document.activeElement))`);
  await transport.takeScreenshot(path.join(artifactDir, 'shot.png'));
  const summary = {
    scenario: 'levelup_overlay',
    levelUpOpened,
    state,
    overlayUi,
    keyboardState,
    assertions: {
      levelUpVisible: state?.ui?.levelUpVisible === true,
      onlyLevelUpVisible: state?.ui?.pauseVisible === false && state?.ui?.resultVisible === false,
      hasProgression: overlayUi.progression === 'Lv 1 → Lv 2',
      hasSummary: overlayUi.summary === '화염 지대 데미지 +1',
      noLegacyComparison: overlayUi.current === '' && overlayUi.preview === '',
      hasDiscovery: overlayUi.discovery === '도감 신규',
      hasPromotedRelationHint: overlayUi.firstPriorityHint === '시너지 빌드 연결'
        && overlayUi.secondPriorityHint === '진화 빌드 연결',
      relationHintsRemainVisible: overlayUi.relatedHintCount >= 2,
      focusInsideDialog: keyboardState?.focusInsideDialog === true,
      tabMovesWithinDialog: keyboardState?.tabMovesWithinDialog === true,
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
  const keyboardState = {
    focusInsideDialog: await transport.evalJson(`Boolean(document.querySelector('.result-card') && document.activeElement && (document.activeElement === document.querySelector('.result-card') || document.querySelector('.result-card').contains(document.activeElement)))`),
  };
  await transport.press('Tab');
  await sleep(120);
  keyboardState.tabMovesWithinDialog = await transport.evalJson(`Boolean(document.querySelector('.result-card') && document.activeElement && document.activeElement !== document.querySelector('.result-card') && document.querySelector('.result-card').contains(document.activeElement))`);
  await transport.takeScreenshot(path.join(artifactDir, 'shot.png'));
  const summary = {
    scenario: 'result_screen',
    resultOpened,
    triggerState,
    state,
    resultUi,
    keyboardState,
    assertions: {
      resultVisible: state?.ui?.resultVisible === true,
      hasOutcomeTitle: typeof resultUi?.title === 'string'
        && ['DEFEAT', 'VICTORY'].includes(resultUi.title),
      hasRestartButton: typeof resultUi?.restart === 'string' && resultUi.restart.includes('다시 시작'),
      hasTitleButton: typeof resultUi?.titleButton === 'string'
        && resultUi.titleButton.includes('메인 화면으로'),
      focusInsideDialog: keyboardState?.focusInsideDialog === true,
      tabMovesWithinDialog: keyboardState?.tabMovesWithinDialog === true,
    },
  };
  writeScenarioJson(path.join(artifactDir, 'summary.json'), summary);
  return summary;
}

export async function runCombatPressureScenario(url, artifactDir, transport) {
  ensureScenarioDir(artifactDir);

  const state = await bootToPlay(url, transport);
  await sleep(180);
  const guidanceHudPresent = await transport.evalJson(`Boolean(
    document.querySelector('.hud-guidance-row')
    || document.querySelector('.hud-threat-chip')
    || document.querySelector('.hud-boss-chip')
    || document.querySelector('.hud-stage-chip')
    || document.querySelector('.hud-objective-chip')
    || document.querySelector('.hud-guidance-note')
  )`);
  const encounter = await transport.evalJson('window.__ASHEN_DEBUG__?.getSnapshot?.()?.encounter ?? null');
  await transport.takeScreenshot(path.join(artifactDir, 'shot.png'));

  const summary = {
    scenario: 'combat_pressure',
    state,
    encounter,
    guidanceHudPresent,
    assertions: {
      inPlayScene: state?.scene === 'PlayScene',
      guidanceHudRemoved: guidanceHudPresent === false,
      hasEncounterLabel: typeof encounter?.label === 'string' && encounter.label.length > 0,
      hasObjectiveTitle: typeof encounter?.objectiveTitle === 'string' && encounter.objectiveTitle.length > 0,
      hasStageDirectiveTitle: typeof encounter?.stageDirectiveTitle === 'string' && encounter.stageDirectiveTitle.length > 0,
    },
  };

  writeScenarioJson(path.join(artifactDir, 'summary.json'), summary);
  return summary;
}

export async function runBossReadabilityScenario(url, artifactDir, transport) {
  ensureScenarioDir(artifactDir);

  await bootToPlay(url, transport);
  const opened = await transport.evalJson('window.__ASHEN_DEBUG__?.openBossReadabilityOverlay?.() ?? false');
  if (opened !== true) {
    throw new Error('Boss readability overlay did not open');
  }

  await sleep(180);
  const bossName = await transport.evalJson(`document.querySelector('.boss-hud .boss-name')?.textContent?.trim() ?? ''`);
  const bossLabel = await transport.evalJson(`document.querySelector('.boss-hud .boss-hp-label')?.textContent?.trim() ?? ''`);
  const guidanceHudPresent = await transport.evalJson(`Boolean(
    document.querySelector('.hud-guidance-row')
    || document.querySelector('.hud-stage-chip')
    || document.querySelector('.hud-guidance-note')
  )`);
  await transport.takeScreenshot(path.join(artifactDir, 'shot.png'));

  const summary = {
    scenario: 'boss_readability',
    opened,
    bossName,
    bossLabel,
    guidanceHudPresent,
    assertions: {
      bossHudVisible: bossName.length > 0,
      bossHpVisible: bossLabel.includes('/'),
      guidanceHudRemoved: guidanceHudPresent === false,
    },
  };

  writeScenarioJson(path.join(artifactDir, 'summary.json'), summary);
  return summary;
}

export async function runTouchHudMobileScenario(url, artifactDir, transport) {
  ensureScenarioDir(artifactDir);

  const state = await bootToPlay(url, transport, {
    runtimeFlags: { forceTouchHud: true },
    viewport: { width: 390, height: 844 },
  });
  await sleep(180);

  const hudState = await transport.evalJson(`(() => {
    const root = document.querySelector('.touch-hud');
    const pauseButton = document.querySelector('.touch-pause-button');
    const joystick = document.querySelector('.touch-joystick-base');
    const moveGuide = document.querySelector('.touch-move-guide');
    const actionGuide = document.querySelector('.touch-action-guide');
    const viewportHeight = window.innerHeight;
    return {
      hudVisible: Boolean(root) && getComputedStyle(root).display !== 'none',
      pauseButtonVisible: Boolean(pauseButton) && getComputedStyle(pauseButton).display !== 'none',
      joystickVisible: Boolean(joystick) && getComputedStyle(joystick).display !== 'none',
      moveGuideText: moveGuide?.textContent?.trim() ?? '',
      actionGuideText: actionGuide?.textContent?.trim() ?? '',
      pauseBottom: pauseButton?.getBoundingClientRect?.().bottom ?? null,
      joystickBottom: joystick?.getBoundingClientRect?.().bottom ?? null,
      viewportHeight,
    };
  })()`);

  await transport.takeScreenshot(path.join(artifactDir, 'shot.png'));
  const summary = {
    scenario: 'touch_hud_mobile',
    state,
    hudState,
    assertions: {
      inPlayScene: state?.scene === 'PlayScene',
      touchHudVisible: hudState?.hudVisible === true,
      pauseButtonVisible: hudState?.pauseButtonVisible === true,
      joystickVisible: hudState?.joystickVisible === true,
      hasMoveGuide: typeof hudState?.moveGuideText === 'string' && hudState.moveGuideText.length > 0,
      hasActionGuide: typeof hudState?.actionGuideText === 'string' && hudState.actionGuideText.length > 0,
      pauseButtonInViewport: typeof hudState?.pauseBottom === 'number' && hudState.pauseBottom <= hudState.viewportHeight,
      joystickInViewport: typeof hudState?.joystickBottom === 'number' && hudState.joystickBottom <= hudState.viewportHeight,
    },
  };

  writeScenarioJson(path.join(artifactDir, 'summary.json'), summary);
  return summary;
}

export async function runDailySeedScenario(url, artifactDir, transport) {
  ensureScenarioDir(artifactDir);

  const state = await bootToPlay(url, transport, {
    beforeStartRun: async (activeTransport) => {
      const selected = await activeTransport.evalJson(`(() => {
        const button = document.querySelector('[data-seed-mode="daily"]');
        if (!button) return null;
        button.click();
        return {
          selectedSeedMode: button.dataset.seedMode ?? null,
          seedPreview: document.querySelector('.sl-seed-preview')?.textContent?.trim() ?? '',
        };
      })()`);
      return selected;
    },
  });
  await sleep(180);

  const dailyState = await transport.evalJson(`(() => ({
    seedMode: window.__ASHEN_DEBUG__?.getSnapshot?.()?.seedMode ?? null,
    seedLabel: window.__ASHEN_DEBUG__?.getSnapshot?.()?.seedLabel ?? '',
  }))()`);
  await transport.takeScreenshot(path.join(artifactDir, 'shot.png'));

  const summary = {
    scenario: 'daily_seed_run',
    state,
    dailyState,
    assertions: {
      inPlayScene: state?.scene === 'PlayScene',
      dailySeedMode: dailyState?.seedMode === 'daily',
      hasDailySeedLabel: typeof dailyState?.seedLabel === 'string' && dailyState.seedLabel.startsWith('daily-'),
    },
  };

  writeScenarioJson(path.join(artifactDir, 'summary.json'), summary);
  return summary;
}
