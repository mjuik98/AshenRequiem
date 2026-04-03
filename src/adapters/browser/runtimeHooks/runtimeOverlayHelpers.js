import { PlayMode, transitionPlayMode } from '../../../state/PlayMode.js';
import { getHookHost, getSceneDebugSurface } from './runtimeDebugSurface.js';
import { buildAuthoringSnapshot } from './runtimeSnapshot.js';

export function openEncounterAuthoringOverlay(game) {
  const host = getHookHost();
  const documentRef = host?.document ?? null;
  if (!documentRef?.createElement || !documentRef.body?.appendChild) {
    return false;
  }

  const existing = documentRef.getElementById('ashen-encounter-authoring-overlay');
  if (existing?.remove) existing.remove();

  const snapshot = buildAuthoringSnapshot(game);
  const panel = documentRef.createElement('div');
  panel.id = 'ashen-encounter-authoring-overlay';
  Object.assign(panel.style, {
    position: 'fixed',
    top: '16px',
    right: '16px',
    zIndex: '9999',
    width: '320px',
    maxWidth: 'calc(100vw - 32px)',
    padding: '14px 16px',
    borderRadius: '16px',
    background: 'rgba(9, 12, 18, 0.92)',
    color: '#f4ede0',
    border: '1px solid rgba(255,255,255,0.14)',
    boxShadow: '0 16px 40px rgba(0,0,0,0.38)',
    fontFamily: "'Segoe UI', sans-serif",
    whiteSpace: 'pre-wrap',
  });
  panel.textContent = [
    'Encounter Authoring',
    `Beat: ${snapshot.currentBeatLabel || '-'}`,
    `Boss ETA: ${Number.isFinite(snapshot.bossEtaSeconds) ? `${snapshot.bossEtaSeconds}s` : '-'}`,
    `Modifier: ${snapshot.stageModifierTitle || '-'}`,
    `Rule: ${snapshot.stageModifierRule || '-'}`,
    `Counterplay: ${snapshot.counterplay || '-'}`,
    `Replay Samples: ${snapshot.replayTraceLength}`,
  ].join('\n');
  documentRef.body.appendChild(panel);
  return true;
}

export function openPauseOverlay(game) {
  const scene = game?.sceneManager?.currentScene ?? null;
  const { ui, gameData } = getSceneDebugSurface(scene);
  const world = scene?.world ?? null;
  if (!ui?.showPause || !world) return false;

  ui.hideLevelUp?.();
  ui.hideResult?.();
  transitionPlayMode(world, PlayMode.PAUSED);

  ui.showPause({
    player: world.entities.player,
    data: gameData ?? game?.gameData ?? {},
    world,
    session: game?.session ?? null,
    onResume: () => {
      transitionPlayMode(world, PlayMode.PLAYING);
      ui.hidePause?.();
    },
    onForfeit: null,
    onOptionsChange: null,
  });

  return ui?.isPaused?.() ?? true;
}

export function openResultOverlay(game, overrides = {}) {
  const scene = game?.sceneManager?.currentScene ?? null;
  const { ui } = getSceneDebugSurface(scene);
  const world = scene?.world ?? null;
  if (!ui?.showResult || !world) return false;

  ui.hidePause?.();
  ui.hideLevelUp?.();

  ui.showResult({
    survivalTime: world.run.elapsedTime ?? 0,
    level: world.entities.player?.level ?? 1,
    killCount: world.run.killCount ?? 0,
    outcome: world.run.runOutcome?.type ?? 'defeat',
    currencyEarned: overrides.currencyEarned ?? 0,
    totalCurrency: overrides.totalCurrency ?? game?.session?.meta?.currency ?? 0,
    ...overrides,
  }, overrides.onRestart ?? (() => {}), overrides.onTitle ?? (() => {}));

  return ui?.isResultVisible?.() ?? true;
}

export function openLevelUpOverlay(game, overrides = {}) {
  const scene = game?.sceneManager?.currentScene ?? null;
  const world = scene?.world ?? null;
  const { ui, levelUpController } = getSceneDebugSurface(scene);
  const player = world?.entities?.player ?? null;
  if (!world || !levelUpController?.show || !player) return false;

  ui?.hidePause?.();
  ui?.hideResult?.();
  world.run ??= {};
  world.progression ??= {};
  world.run.guidance = overrides.guidance ?? {
    ...(world.run.guidance ?? {}),
    recommendedBuild: null,
  };
  player.weapons = [
    { id: 'flame_zone', level: 1, currentCooldown: 0 },
    { id: 'magic_bolt', level: 7, currentCooldown: 0 },
  ];
  player.accessories = [{ id: 'iron_heart', level: 2 }];
  player.acquiredUpgrades = new Set(['up_magic_bolt']);
  world.progression.pendingLevelUpChoices = overrides.choices ?? [
    { id: 'up_flame_zone', type: 'weapon_upgrade', weaponId: 'flame_zone', name: '화염 지대', description: '지속 화염 피해가 강화됩니다.' },
    { id: 'up_iron_heart', type: 'accessory_upgrade', accessoryId: 'iron_heart', name: '강철 심장', description: '생존력이 한 단계 더 올라갑니다.' },
    { id: 'get_boomerang', type: 'weapon_new', weaponId: 'boomerang', name: '부메랑', description: '회전하며 돌아오는 부메랑을 던집니다.' },
    { id: 'get_tome_of_power', type: 'accessory', accessoryId: 'tome_of_power', name: '마력의 고서', description: '모든 무기 데미지가 상승합니다.' },
    { id: 'evolution_arcane_nova', type: 'weapon_evolution', weaponId: 'magic_bolt', resultWeaponId: 'arcane_nova', name: '아케인 노바', description: '비전 폭발 무기로 진화합니다.' },
  ];
  world.progression.pendingLevelUpType = 'levelup';
  world.progression.levelUpActionMode = 'select';
  world.progression.runRerollsRemaining = overrides.rerollsRemaining ?? 1;
  world.progression.runBanishesRemaining = overrides.banishesRemaining ?? 1;
  transitionPlayMode(world, PlayMode.LEVELUP);
  levelUpController.show();
  return ui?.isLevelUpVisible?.() ?? true;
}
