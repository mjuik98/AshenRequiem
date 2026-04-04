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

export function encodeActiveRunSnapshot(world) {
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

export function decodeActiveRunSnapshot(snapshot) {
  if (!snapshot?.run || !snapshot?.player) return null;

  return {
    savedAt: Number(snapshot.savedAt) || 0,
    run: {
      ...snapshot.run,
      ascension: snapshot.run.ascension ? { ...snapshot.run.ascension } : null,
      archetype: snapshot.run.archetype ? { ...snapshot.run.archetype } : null,
      riskRelic: snapshot.run.riskRelic ? { ...snapshot.run.riskRelic } : null,
      stage: cloneRunStage(snapshot.run.stage),
      lastDamageSource: snapshot.run.lastDamageSource ? { ...snapshot.run.lastDamageSource } : null,
      runOutcome: snapshot.run.runOutcome ? { ...snapshot.run.runOutcome } : null,
    },
    player: {
      ...snapshot.player,
      weapons: cloneWeapons(snapshot.player.weapons),
      accessories: cloneAccessories(snapshot.player.accessories),
      unlockedWeapons: [...(snapshot.player.unlockedWeapons ?? [])],
      unlockedAccessories: [...(snapshot.player.unlockedAccessories ?? [])],
      upgradeCounts: { ...(snapshot.player.upgradeCounts ?? {}) },
      acquiredUpgrades: [...(snapshot.player.acquiredUpgrades ?? [])],
      activeSynergies: [...(snapshot.player.activeSynergies ?? [])],
    },
    progression: {
      runRerollsRemaining: snapshot.progression?.runRerollsRemaining ?? 0,
      runBanishesRemaining: snapshot.progression?.runBanishesRemaining ?? 0,
      banishedUpgradeIds: [...(snapshot.progression?.banishedUpgradeIds ?? [])],
      chestRewardQueue: snapshot.progression?.chestRewardQueue ?? 0,
      levelUpActionMode: snapshot.progression?.levelUpActionMode ?? 'select',
    },
    camera: snapshot.camera
      ? {
          x: snapshot.camera.x ?? 0,
          y: snapshot.camera.y ?? 0,
          targetX: snapshot.camera.targetX ?? 0,
          targetY: snapshot.camera.targetY ?? 0,
        }
      : null,
  };
}

export function applyActiveRunSnapshot(world, player, snapshot) {
  if (!world || !player) return { restored: false, world, player };

  const decoded = decodeActiveRunSnapshot(snapshot);
  if (!decoded?.run || !decoded?.player) {
    return { restored: false, world, player };
  }

  Object.assign(player, {
    x: decoded.player.x ?? player.x,
    y: decoded.player.y ?? player.y,
    hp: decoded.player.hp ?? player.hp,
    maxHp: decoded.player.maxHp ?? player.maxHp,
    moveSpeed: decoded.player.moveSpeed ?? player.moveSpeed,
    radius: decoded.player.radius ?? player.radius,
    color: decoded.player.color ?? player.color,
    facingX: decoded.player.facingX ?? player.facingX,
    facingY: decoded.player.facingY ?? player.facingY,
    xp: decoded.player.xp ?? player.xp,
    level: decoded.player.level ?? player.level,
    weapons: cloneWeapons(decoded.player.weapons),
    accessories: cloneAccessories(decoded.player.accessories),
    archetypeId: decoded.player.archetypeId ?? player.archetypeId,
    riskRelicId: decoded.player.riskRelicId ?? player.riskRelicId,
    unlockedWeapons: [...(decoded.player.unlockedWeapons ?? [])],
    unlockedAccessories: [...(decoded.player.unlockedAccessories ?? [])],
    invincibleDuration: decoded.player.invincibleDuration ?? player.invincibleDuration,
    lifesteal: decoded.player.lifesteal ?? player.lifesteal,
    upgradeCounts: { ...(decoded.player.upgradeCounts ?? {}) },
    maxWeaponSlots: decoded.player.maxWeaponSlots ?? player.maxWeaponSlots,
    maxAccessorySlots: decoded.player.maxAccessorySlots ?? player.maxAccessorySlots,
    bonusProjectileCount: decoded.player.bonusProjectileCount ?? player.bonusProjectileCount,
    critChance: decoded.player.critChance ?? player.critChance,
    critMultiplier: decoded.player.critMultiplier ?? player.critMultiplier,
    globalDamageMult: decoded.player.globalDamageMult ?? player.globalDamageMult,
    cooldownMult: decoded.player.cooldownMult ?? player.cooldownMult,
    projectileSpeedMult: decoded.player.projectileSpeedMult ?? player.projectileSpeedMult,
    projectileSizeMult: decoded.player.projectileSizeMult ?? player.projectileSizeMult,
    xpMult: decoded.player.xpMult ?? player.xpMult,
    currencyMult: decoded.player.currencyMult ?? player.currencyMult,
    projectileLifetimeMult: decoded.player.projectileLifetimeMult ?? player.projectileLifetimeMult,
    curse: decoded.player.curse ?? player.curse,
    acquiredUpgrades: new Set(decoded.player.acquiredUpgrades ?? []),
    activeSynergies: [...(decoded.player.activeSynergies ?? [])],
  });

  Object.assign(world.run, {
    ...world.run,
    ...decoded.run,
    playMode: 'playing',
  });

  world.progression.runRerollsRemaining = decoded.progression.runRerollsRemaining ?? world.progression.runRerollsRemaining;
  world.progression.runBanishesRemaining = decoded.progression.runBanishesRemaining ?? world.progression.runBanishesRemaining;
  world.progression.banishedUpgradeIds = [...(decoded.progression.banishedUpgradeIds ?? [])];
  world.progression.chestRewardQueue = decoded.progression.chestRewardQueue ?? 0;
  world.progression.levelUpActionMode = decoded.progression.levelUpActionMode ?? 'select';
  world.progression.pendingLevelUpChoices = null;
  world.progression.pendingLevelUpType = null;
  world.progression.pendingUpgrade = null;
  world.progression.pendingEventQueue = null;

  if (world.presentation?.camera && decoded.camera) {
    Object.assign(world.presentation.camera, decoded.camera);
  }

  return { restored: true, world, player };
}
