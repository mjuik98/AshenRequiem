/**
 * src/systems/combat/BossPhaseSystem.js — 보스 HP 임계값 기반 페이즈 전환
 *
 * FIX(BUG-6): enemyId vs enemyDataId 필드명 불일치 수정
 */
export const BossPhaseSystem = {
  update({ world, data: { bossData } }) {
    if (!bossData || !world.queues.events.bossPhaseChanged) return;

    for (let i = 0; i < world.entities.enemies.length; i++) {
      const enemy = world.entities.enemies[i];
      if (!enemy.isAlive || enemy.pendingDestroy || !enemy.isBoss) continue;

      // FIX(BUG-6): enemy.enemyId → enemy.enemyDataId
      const bossDef = bossData.find(b => b.enemyId === enemy.enemyDataId);
      if (!bossDef?.phases) continue;

      if (!Array.isArray(enemy.bossPhaseState?.triggered) || enemy.bossPhaseState.triggered.length !== bossDef.phases.length) {
        enemy.bossPhaseState = {
          triggered: new Array(bossDef.phases.length).fill(false),
        };
      }

      if (!enemy.maxHp || enemy.maxHp <= 0) {
        console.warn(`[BossPhaseSystem] ${enemy.enemyDataId} maxHp 미설정 — 페이즈 검사 스킵`);
        continue;
      }

      const hpRatio = enemy.hp / enemy.maxHp;
      const triggered = enemy.bossPhaseState.triggered;

      for (let pi = 0; pi < bossDef.phases.length; pi++) {
        if (triggered[pi]) continue;

        const phase = bossDef.phases[pi];
        if (hpRatio <= phase.hpThreshold) {
          triggered[pi] = true;

          world.queues.events.bossPhaseChanged.push({
            enemy,
            enemyId:       enemy.enemyDataId,  // FIX: enemyDataId 사용
            phaseIndex:    pi,
            newBehaviorId: phase.behaviorId,
            announceText:  phase.announceText ?? '',
            hpThreshold:   phase.hpThreshold,
            phaseAction:   phase.phaseAction ?? null,
          });
        }
      }
    }
  },
};
