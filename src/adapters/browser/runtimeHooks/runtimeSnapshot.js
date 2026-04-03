import {
  getSceneDebugSurface,
  getSceneName,
} from './runtimeDebugSurface.js';

export function buildAuthoringSnapshot(game) {
  const scene = game?.sceneManager?.currentScene ?? null;
  const world = scene?.world ?? null;
  if (!world) {
    return {
      currentBeatLabel: '',
      counterplay: '',
      replayTraceLength: 0,
      stageModifierTitle: '',
      stageModifierRule: '',
    };
  }

  const replayTrace = world.runtime?.replayTrace ?? [];
  return {
    currentBeatLabel: world.run?.encounterState?.currentBeat?.label ?? '',
    encounterSummary: world.run?.encounterState?.currentBeat?.summaryText ?? '',
    bossEtaSeconds: world.run?.encounterState?.nextBossStartsIn ?? null,
    stageModifierTitle: world.run?.guidance?.stageModifier?.title ?? '',
    stageModifierRule: world.run?.guidance?.stageModifier?.ruleText ?? '',
    counterplay: world.run?.guidance?.stageModifier?.counterplay ?? '',
    replayTraceLength: replayTrace.length,
    replayTraceTail: replayTrace.slice(-5),
  };
}

export function buildSnapshot(game) {
  const scene = game?.sceneManager?.currentScene ?? null;
  const world = scene?.world ?? null;
  const { ui } = getSceneDebugSurface(scene);

  if (!scene) {
    return { scene: 'none' };
  }

  if (!world) {
    return { scene: getSceneName(scene) };
  }

  return {
    scene: getSceneName(scene),
    playMode: world.run.playMode ?? null,
    elapsedTime: world.run.elapsedTime ?? 0,
    killCount: world.run.killCount ?? 0,
    runCurrencyEarned: world.run.runCurrencyEarned ?? 0,
    player: world.entities.player
      ? {
          hp: world.entities.player.hp ?? 0,
          maxHp: world.entities.player.maxHp ?? 0,
          level: world.entities.player.level ?? 1,
          weapons: (world.entities.player.weapons ?? []).map((weapon) => weapon.id),
          accessories: (world.entities.player.accessories ?? []).map((accessory) => accessory.id),
        }
      : null,
    boss: (world.entities.enemies ?? [])
      .filter((enemy) => enemy?.isBoss && !enemy?.pendingDestroy)
      .map((enemy) => ({
        id: enemy.id ?? enemy.enemyDataId ?? 'boss',
        name: enemy.name ?? enemy.enemyDataId ?? 'BOSS',
        hp: enemy.hp ?? 0,
        maxHp: enemy.maxHp ?? 0,
      }))[0] ?? null,
    rerollsRemaining: world.progression.runRerollsRemaining ?? null,
    banishesRemaining: world.progression.runBanishesRemaining ?? null,
    pendingLevelUpChoices: (world.progression.pendingLevelUpChoices ?? []).map((choice) => choice?.id).filter(Boolean),
    encounter: {
      label: world.run.encounterState?.currentBeat?.label ?? '',
      summaryText: world.run.encounterState?.currentBeat?.summaryText ?? '',
      nextBossStartsIn: world.run.encounterState?.nextBossStartsIn ?? null,
      objectiveTitle: world.run.guidance?.primaryObjective?.title ?? '',
      stageDirectiveTitle: world.run.guidance?.stageDirective?.title ?? '',
    },
    seedMode: world.run.seedMode ?? null,
    seedLabel: world.run.seedLabel ?? '',
    authoring: buildAuthoringSnapshot(game),
    ui: {
      pauseVisible: ui?.isPaused?.() ?? false,
      levelUpVisible: ui?.isLevelUpVisible?.() ?? false,
      resultVisible: ui?.isResultVisible?.() ?? false,
    },
  };
}
