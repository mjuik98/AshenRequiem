function getHookHost() {
  return typeof globalThis !== 'undefined' ? globalThis : null;
}

function buildSnapshot(game) {
  const scene = game?.sceneManager?.currentScene ?? null;
  const world = scene?.world ?? null;

  if (!scene) {
    return { scene: 'none' };
  }

  if (!world) {
    return { scene: scene.constructor?.name ?? 'UnknownScene' };
  }

  return {
    scene: scene.constructor?.name ?? 'UnknownScene',
    playMode: world.playMode ?? null,
    elapsedTime: world.elapsedTime ?? 0,
    killCount: world.killCount ?? 0,
    player: world.player
      ? {
          hp: world.player.hp ?? 0,
          maxHp: world.player.maxHp ?? 0,
          level: world.player.level ?? 1,
          weapons: (world.player.weapons ?? []).map((weapon) => weapon.id),
          accessories: (world.player.accessories ?? []).map((accessory) => accessory.id),
        }
      : null,
    rerollsRemaining: world.runRerollsRemaining ?? null,
    banishesRemaining: world.runBanishesRemaining ?? null,
    pendingLevelUpChoices: (world.pendingLevelUpChoices ?? []).map((choice) => choice?.id).filter(Boolean),
  };
}

export function registerRuntimeHooks(game) {
  const host = getHookHost();
  if (!host) return;

  host.advanceTime = (ms) => game?.advanceTime?.(ms);
  host.render_game_to_text = () => JSON.stringify(buildSnapshot(game));
}

export function unregisterRuntimeHooks() {
  const host = getHookHost();
  if (!host) return;

  delete host.advanceTime;
  delete host.render_game_to_text;
}
