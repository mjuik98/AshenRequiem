import { logRuntimeInfo } from '../../../utils/runtimeLogger.js';
import { queueBossPhaseAction } from './bossPhaseActionRegistry.js';

function resetPhaseBehaviorState(enemy) {
  enemy.behaviorState = null;
  enemy.chargeState = undefined;
  enemy.circleAngle = undefined;
}

export function registerBossPhaseHandler(services, registry) {
  if (!registry) return;

  registry.register('bossPhaseChanged', (event, world) => {
    const {
      enemy,
      announceText,
      phaseIndex,
      hpThreshold,
      newBehaviorId,
      phaseAction,
      phaseActions,
    } = event;

    if (newBehaviorId) {
      enemy.behaviorId = newBehaviorId;
      resetPhaseBehaviorState(enemy);
    }

    const effect = services.effectPool?.acquire({
      effectType: 'damageText',
      x: enemy.x,
      y: enemy.y - enemy.radius - 20,
      text: announceText || `페이즈 ${phaseIndex + 2} 돌입!`,
      color: phaseIndex === 0 ? '#FF8C00' : '#FF2222',
      maxLifetime: 2.5,
    });

    if (effect) {
      world.entities.effects?.push(effect);
    }

    const actions = Array.isArray(phaseActions) && phaseActions.length > 0
      ? phaseActions
      : (phaseAction ? [phaseAction] : []);

    for (const action of actions) {
      queueBossPhaseAction(world, enemy, action);
    }

    logRuntimeInfo(
      'BossPhaseHandler',
      `${enemy.enemyDataId ?? enemy.enemyId} 페이즈 ${phaseIndex + 2} 발동 `
        + `(HP ≤ ${Math.round(hpThreshold * 100)}%)`,
    );
  });
}
