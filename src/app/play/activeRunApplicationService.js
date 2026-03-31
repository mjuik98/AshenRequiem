import { persistSession } from '../session/sessionPersistenceService.js';

function cloneWeapons(weapons = []) {
  return (weapons ?? []).map((weapon) => ({ ...weapon }));
}

function cloneAccessories(accessories = []) {
  return (accessories ?? []).map((accessory) => ({ ...accessory }));
}

function cloneStageBackground(background = null) {
  if (!background || typeof background !== 'object') return undefined;
  return {
    ...background,
    palette: background.palette ? { ...background.palette } : undefined,
    layers: Array.isArray(background.layers) ? background.layers.map((layer) => ({ ...layer })) : undefined,
  };
}

function cloneRunStage(stage = null) {
  if (!stage || typeof stage !== 'object') return null;
  return {
    ...stage,
    background: cloneStageBackground(stage.background),
  };
}

export function captureActiveRunSnapshot(world) {
  const player = world?.entities?.player;
  if (!world?.run || !player) return null;

  return {
    savedAt: Date.now(),
    run: {
      elapsedTime: world.run.elapsedTime ?? 0,
      killCount: world.run.killCount ?? 0,
      runCurrencyEarned: world.run.runCurrencyEarned ?? 0,
      bossKillCount: world.run.bossKillCount ?? 0,
      ascensionLevel: world.run.ascensionLevel ?? 0,
      ascension: world.run.ascension ? { ...world.run.ascension } : null,
      archetypeId: world.run.archetypeId ?? 'vanguard',
      archetype: world.run.archetype ? { ...world.run.archetype } : null,
      riskRelicId: world.run.riskRelicId ?? null,
      riskRelic: world.run.riskRelic ? { ...world.run.riskRelic } : null,
      stageId: world.run.stageId ?? 'ash_plains',
      stage: cloneRunStage(world.run.stage),
      seedMode: world.run.seedMode ?? 'none',
      seedLabel: world.run.seedLabel ?? '',
      lastDamageSource: world.run.lastDamageSource ? { ...world.run.lastDamageSource } : null,
      runOutcome: world.run.runOutcome ? { ...world.run.runOutcome } : null,
    },
    player: {
      x: player.x ?? 0,
      y: player.y ?? 0,
      hp: player.hp ?? 0,
      maxHp: player.maxHp ?? 0,
      moveSpeed: player.moveSpeed ?? 0,
      radius: player.radius ?? 0,
      color: player.color ?? '#ffffff',
      facingX: player.facingX ?? 1,
      facingY: player.facingY ?? 0,
      xp: player.xp ?? 0,
      level: player.level ?? 1,
      weapons: cloneWeapons(player.weapons),
      accessories: cloneAccessories(player.accessories),
      archetypeId: player.archetypeId ?? null,
      riskRelicId: player.riskRelicId ?? null,
      unlockedWeapons: [...(player.unlockedWeapons ?? [])],
      unlockedAccessories: [...(player.unlockedAccessories ?? [])],
      invincibleDuration: player.invincibleDuration ?? 0.5,
      lifesteal: player.lifesteal ?? 0,
      upgradeCounts: { ...(player.upgradeCounts ?? {}) },
      maxWeaponSlots: player.maxWeaponSlots ?? 3,
      maxAccessorySlots: player.maxAccessorySlots ?? 3,
      bonusProjectileCount: player.bonusProjectileCount ?? 0,
      critChance: player.critChance ?? 0,
      critMultiplier: player.critMultiplier ?? 2,
      globalDamageMult: player.globalDamageMult ?? 1,
      cooldownMult: player.cooldownMult ?? 1,
      projectileSpeedMult: player.projectileSpeedMult ?? 1,
      projectileSizeMult: player.projectileSizeMult ?? 1,
      xpMult: player.xpMult ?? 1,
      currencyMult: player.currencyMult ?? 1,
      projectileLifetimeMult: player.projectileLifetimeMult ?? 1,
      curse: player.curse ?? 0,
      acquiredUpgrades: [...(player.acquiredUpgrades ?? [])],
      activeSynergies: [...(player.activeSynergies ?? [])],
    },
    progression: {
      runRerollsRemaining: world.progression?.runRerollsRemaining ?? 0,
      runBanishesRemaining: world.progression?.runBanishesRemaining ?? 0,
      banishedUpgradeIds: [...(world.progression?.banishedUpgradeIds ?? [])],
      chestRewardQueue: world.progression?.chestRewardQueue ?? 0,
      levelUpActionMode: world.progression?.levelUpActionMode ?? 'select',
    },
    camera: world.presentation?.camera
      ? {
          x: world.presentation.camera.x ?? 0,
          y: world.presentation.camera.y ?? 0,
          targetX: world.presentation.camera.targetX ?? 0,
          targetY: world.presentation.camera.targetY ?? 0,
        }
      : null,
  };
}

export function restoreActiveRunSnapshot(world, player, snapshot) {
  if (!world || !player || !snapshot?.run || !snapshot?.player) return { restored: false, world, player };

  Object.assign(player, {
    x: snapshot.player.x ?? player.x,
    y: snapshot.player.y ?? player.y,
    hp: snapshot.player.hp ?? player.hp,
    maxHp: snapshot.player.maxHp ?? player.maxHp,
    moveSpeed: snapshot.player.moveSpeed ?? player.moveSpeed,
    radius: snapshot.player.radius ?? player.radius,
    color: snapshot.player.color ?? player.color,
    facingX: snapshot.player.facingX ?? player.facingX,
    facingY: snapshot.player.facingY ?? player.facingY,
    xp: snapshot.player.xp ?? player.xp,
    level: snapshot.player.level ?? player.level,
    weapons: cloneWeapons(snapshot.player.weapons),
    accessories: cloneAccessories(snapshot.player.accessories),
    archetypeId: snapshot.player.archetypeId ?? player.archetypeId,
    riskRelicId: snapshot.player.riskRelicId ?? player.riskRelicId,
    unlockedWeapons: [...(snapshot.player.unlockedWeapons ?? [])],
    unlockedAccessories: [...(snapshot.player.unlockedAccessories ?? [])],
    invincibleDuration: snapshot.player.invincibleDuration ?? player.invincibleDuration,
    lifesteal: snapshot.player.lifesteal ?? player.lifesteal,
    upgradeCounts: { ...(snapshot.player.upgradeCounts ?? {}) },
    maxWeaponSlots: snapshot.player.maxWeaponSlots ?? player.maxWeaponSlots,
    maxAccessorySlots: snapshot.player.maxAccessorySlots ?? player.maxAccessorySlots,
    bonusProjectileCount: snapshot.player.bonusProjectileCount ?? player.bonusProjectileCount,
    critChance: snapshot.player.critChance ?? player.critChance,
    critMultiplier: snapshot.player.critMultiplier ?? player.critMultiplier,
    globalDamageMult: snapshot.player.globalDamageMult ?? player.globalDamageMult,
    cooldownMult: snapshot.player.cooldownMult ?? player.cooldownMult,
    projectileSpeedMult: snapshot.player.projectileSpeedMult ?? player.projectileSpeedMult,
    projectileSizeMult: snapshot.player.projectileSizeMult ?? player.projectileSizeMult,
    xpMult: snapshot.player.xpMult ?? player.xpMult,
    currencyMult: snapshot.player.currencyMult ?? player.currencyMult,
    projectileLifetimeMult: snapshot.player.projectileLifetimeMult ?? player.projectileLifetimeMult,
    curse: snapshot.player.curse ?? player.curse,
    acquiredUpgrades: new Set(snapshot.player.acquiredUpgrades ?? []),
    activeSynergies: [...(snapshot.player.activeSynergies ?? [])],
  });

  Object.assign(world.run, {
    ...world.run,
    ...snapshot.run,
    ascension: snapshot.run.ascension ? { ...snapshot.run.ascension } : world.run.ascension,
    archetype: snapshot.run.archetype ? { ...snapshot.run.archetype } : world.run.archetype,
    riskRelic: snapshot.run.riskRelic ? { ...snapshot.run.riskRelic } : world.run.riskRelic,
    stage: cloneRunStage(snapshot.run.stage) ?? world.run.stage,
    lastDamageSource: snapshot.run.lastDamageSource ? { ...snapshot.run.lastDamageSource } : null,
    runOutcome: snapshot.run.runOutcome ? { ...snapshot.run.runOutcome } : null,
    playMode: 'playing',
  });

  world.progression.runRerollsRemaining = snapshot.progression?.runRerollsRemaining ?? world.progression.runRerollsRemaining;
  world.progression.runBanishesRemaining = snapshot.progression?.runBanishesRemaining ?? world.progression.runBanishesRemaining;
  world.progression.banishedUpgradeIds = [...(snapshot.progression?.banishedUpgradeIds ?? [])];
  world.progression.chestRewardQueue = snapshot.progression?.chestRewardQueue ?? 0;
  world.progression.levelUpActionMode = snapshot.progression?.levelUpActionMode ?? 'select';
  world.progression.pendingLevelUpChoices = null;
  world.progression.pendingLevelUpType = null;
  world.progression.pendingUpgrade = null;
  world.progression.pendingEventQueue = null;

  if (world.presentation?.camera && snapshot.camera) {
    Object.assign(world.presentation.camera, snapshot.camera);
  }

  return { restored: true, world, player };
}

export function saveActiveRunAndPersist(session, world, {
  captureActiveRunSnapshotImpl = captureActiveRunSnapshot,
  persistSessionImpl = persistSession,
} = {}) {
  if (!session || !world?.entities?.player || world?.run?.runOutcome) {
    return { saved: false, activeRun: session?.activeRun ?? null };
  }

  const snapshot = captureActiveRunSnapshotImpl(world);
  if (!snapshot) {
    return { saved: false, activeRun: session?.activeRun ?? null };
  }

  session.activeRun = snapshot;
  persistSessionImpl(session);
  return { saved: true, activeRun: snapshot };
}

export function clearActiveRunAndPersist(session, {
  persistSessionImpl = persistSession,
} = {}) {
  if (!session) return { saved: false, activeRun: null };
  session.activeRun = null;
  persistSessionImpl(session);
  return { saved: true, activeRun: null };
}
