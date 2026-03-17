/**
 * BossPhaseSystem — 보스 HP 임계값 기반 페이즈 전환 이벤트 발행
 *
 * BUGFIX:
 *   BUG-4: enemy.maxHp가 0 또는 undefined인 경우 hpRatio 계산 결과가
 *          NaN(undefined/undefined) 또는 Infinity(n/0)가 되어
 *          모든 phase.hpThreshold 비교(<=)가 false로 평가됨
 *          → 보스 페이즈 전환이 영구적으로 발동되지 않는 침묵 버그
 *
 *   수정: maxHp 존재 및 양수 여부를 미리 검증, 실패 시 해당 적 스킵
 *
 * 파이프라인 등록 위치: DamageSystem 바로 뒤 (priority 75)
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
      // maxHp가 없거나 0 이하이면 hpRatio = NaN or Infinity → 모든 threshold 비교 실패
      // 스폰 직후 maxHp가 아직 세팅되지 않은 프레임에도 안전하게 스킵
      if (!enemy.maxHp || enemy.maxHp <= 0) {
        console.warn(`[BossPhaseSystem] ${enemy.enemyId} maxHp 미설정 — 페이즈 검사 스킵`);
        continue;
      }

      const hpRatio = enemy.hp / enemy.maxHp;

      for (let pi = 0; pi < bossDef.phases.length; pi++) {
        if (enemy._phaseFlags[pi]) continue; // 이미 발동된 페이즈

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
