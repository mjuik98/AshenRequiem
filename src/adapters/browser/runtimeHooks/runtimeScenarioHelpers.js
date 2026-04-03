import { PlayMode, transitionPlayMode } from '../../../state/PlayMode.js';
import { getSceneDebugSurface } from './runtimeDebugSurface.js';

export function openBossReadabilityOverlay(game) {
  const scene = game?.sceneManager?.currentScene ?? null;
  const { ui } = getSceneDebugSurface(scene);
  const world = scene?.world ?? null;
  if (!world?.entities?.player || !ui?.update) return false;

  ui.hidePause?.();
  ui.hideLevelUp?.();
  ui.hideResult?.();

  world.run ??= {};
  transitionPlayMode(world, PlayMode.PLAYING);
  world.run.stageId ??= 'frost_harbor';
  world.run.stage ??= { id: world.run.stageId, name: 'Frost Harbor' };
  world.run.guidance ??= {};
  world.run.guidance.primaryObjective ??= { title: '교전 유지' };
  world.run.guidance.stageDirective ??= { title: world.run.stage?.name ?? 'Boss Arena' };
  world.run.encounterState ??= {};
  world.run.encounterState.currentBeat ??= {
    label: '보스 압박',
    summaryText: '보스 HUD와 guidance surface를 함께 읽을 수 있어야 합니다.',
  };
  world.run.encounterState.nextBossStartsIn = 0;

  world.entities.enemies = [
    {
      id: 'debug-boss-seraph',
      enemyDataId: 'boss_seraph',
      name: 'SERAPH',
      isBoss: true,
      isAlive: true,
      pendingDestroy: false,
      x: world.entities.player.x ?? 0,
      y: (world.entities.player.y ?? 0) - 120,
      radius: 30,
      hp: 860,
      maxHp: 1000,
      color: '#fff4a3',
    },
  ];

  ui.update(world);
  return true;
}
