/**
 * src/systems/combat/BossPhaseSystem.js — 보스 HP 임계값 기반 페이즈 전환
 */
export const BossPhaseSystem = {
  update({ world, data: { bossData } }) {
    if (!bossData || !world.events.bossPhaseChanged) return;

    for (let i = 0; i < world.enemies.length; i++) {
      const enemy = world.enemies[i];
      if (!enemy.isAlive || enemy.pendingDestroy || !enemy.isBoss) continue;

      const bossDef = bossData.find(b => b.enemyId === enemy.enemyId);
      if (!bossDef?.phases) continue;

      if (!enemy._phaseFlags) {
        enemy._phaseFlags = new Array(bossDef.phases.length).fill(false);
      }

      // FIX(BUG-4): maxHp 가드
      if (!enemy.maxHp || enemy.maxHp <= 0) {
        console.warn(`[BossPhaseSystem] ${enemy.enemyId} maxHp 미설정 — 페이즈 검사 스킵`);
        continue;
      }

      const hpRatio = enemy.hp / enemy.maxHp;

      for (let pi = 0; pi < bossDef.phases.length; pi++) {
        if (enemy._phaseFlags[pi]) continue;

        const phase = bossDef.phases[pi];
        if (hpRatio <= phase.hpThreshold) {
          enemy._phaseFlags[pi] = true;

          world.events.bossPhaseChanged.push({
            enemy,
            enemyId:       enemy.enemyId,
            phaseIndex:    pi,
            newBehaviorId: phase.behaviorId,
            announceText:  phase.announceText ?? '',
            hpThreshold:   phase.hpThreshold,
          });
        }
      }
    }
  },
};
