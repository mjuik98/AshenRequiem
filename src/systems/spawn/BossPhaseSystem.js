/**
 * BossPhaseSystem — 보스 HP 임계값 기반 페이즈 전환 이벤트 발행
 *
 * WHY(P3): SpawnSystem에 bossData 스폰은 구현됐지만,
 *   보스 HP 50%에서 행동 패턴 변경, 분열, 특수 공격 같은
 *   페이즈 전환 구조가 없다.
 *   이 시스템은 HP 임계값을 감시하고 events.bossPhaseChanged를 발행한다.
 *   EliteBehaviorSystem(또는 EnemyMovementSystem)이 이 이벤트를 읽어
 *   enemy.behaviorId를 교체한다.
 *
 * 파이프라인 등록 위치: DamageSystem 바로 뒤 (priority 75)
 *
 *   pipeline.register(BossPhaseSystem, { priority: 75 });
 *
 * bossData.js 확장 형식:
 *
 *   export const bossData = [
 *     {
 *       enemyId: 'boss_01',
 *       at: 120,
 *       phases: [
 *         { hpThreshold: 0.7, behaviorId: 'boss_enrage',   announceText: '분노!' },
 *         { hpThreshold: 0.4, behaviorId: 'boss_berserk',  announceText: '광란!' },
 *         { hpThreshold: 0.15, behaviorId: 'boss_final',   announceText: '최후의 발악!' },
 *       ],
 *     },
 *   ];
 *
 * events.bossPhaseChanged 이벤트 소비 예 (EliteBehaviorSystem):
 *
 *   for (const evt of world.events.bossPhaseChanged) {
 *     evt.enemy.behaviorId = evt.newBehaviorId;
 *     // 연출 요청: world.spawnQueue.push({ type: 'effect', config: {...} });
 *   }
 */
export const BossPhaseSystem = {
  update({ world, data: { bossData } }) {
    if (!bossData || !world.events.bossPhaseChanged) return;

    for (let i = 0; i < world.enemies.length; i++) {
      const enemy = world.enemies[i];
      if (!enemy.isAlive || enemy.pendingDestroy || !enemy.isBoss) continue;

      // 이 보스 엔티티에 매핑된 bossData 항목을 찾는다
      const bossDef = bossData.find(b => b.enemyId === enemy.enemyId);
      if (!bossDef?.phases) continue;

      // 아직 초기화 안 된 경우
      if (!enemy._phaseFlags) {
        enemy._phaseFlags = new Array(bossDef.phases.length).fill(false);
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

/**
 * createWorld.js events 확장 — bossPhaseChanged 필드 추가
 *
 * createWorld.js 의 events 객체에 아래 필드를 추가한다:
 *
 *   events: {
 *     hits:              [],
 *     deaths:            [],
 *     pickupCollected:   [],
 *     levelUpRequested:  [],
 *     spawnRequested:    [],
 *     bossPhaseChanged:  [],   // ← 추가
 *   },
 *
 * clearFrameEvents() 에도 추가:
 *
 *   world.events.bossPhaseChanged.length = 0;
 */
