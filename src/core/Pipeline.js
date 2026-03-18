/**
 * Pipeline — 등록형 게임 파이프라인
 *
 * WHY(P1): PlayScene._runGamePipeline()이 17단계를 선형으로 하드코딩하면
 *   보스 페이즈/신규 씬 추가 때마다 배열을 복사하거나 조건 분기가 누적된다.
 *   등록형으로 전환하면 PlayScene은 "어떤 시스템을 어떤 순서로 쓸 것인가"만
 *   선언하고, 실행 책임은 Pipeline에 위임한다.
 *
 * USAGE (PlayScene.enter() 내부):
 *
 *   this._pipeline = new Pipeline();
 *   this._pipeline
 *     .register(this._spawnSystem,    { priority: 10 })
 *     .register(PlayerMovementSystem, { priority: 20 })
 *     .register(EnemyMovementSystem,  { priority: 30 })
 *     .register(EliteBehaviorSystem,  { priority: 35 })
 *     .register(WeaponSystem,         { priority: 40 })
 *     .register(ProjectileSystem,     { priority: 50 })
 *     .register(CollisionSystem,      { priority: 60 })
 *     .register(StatusEffectSystem,   { priority: 65 })
 *     .register(DamageSystem,         { priority: 70 })
 *     .register(DeathSystem,          { priority: 80 })
 *     .register(ExperienceSystem,     { priority: 90 })
 *     .register(LevelSystem,          { priority: 100 })
 *     .register(this._flushSystem,    { priority: 110 })
 *     .register(CameraSystem,         { priority: 120 })
 *     .register(RenderSystem,         { priority: 130 });
 *
 * USAGE (_runGamePipeline 교체):
 *   _runGamePipeline(context) {
 *     clearFrameEvents(this.world);
 *     this._pipeline.run(context);
 *   }
 *
 * DISABLE 예시 (레벨업 일시정지 중 스폰 억제):
 *   this._pipeline.setEnabled(this._spawnSystem, false);
 */
export class Pipeline {
  constructor() {
    /** @type {Array<{system: object, priority: number, enabled: boolean}>} */
    this._entries = [];
    this._sorted  = false;
  }

  /**
   * 시스템을 파이프라인에 등록한다.
   * @param {object} system   update(context) 메서드를 가진 시스템 객체
   * @param {object} [opts]
   * @param {number}  [opts.priority=0]   낮을수록 먼저 실행
   * @param {boolean} [opts.enabled=true]
   * @returns {Pipeline} 체이닝 지원
   */
  register(system, { priority = 0, enabled = true } = {}) {
    if (!system || typeof system.update !== 'function') {
      console.warn('[Pipeline] register: system.update()가 없습니다.', system);
      return this;
    }
    this._entries.push({ system, priority, enabled });
    this._sorted = false;
    return this;
  }

  /**
   * 프로파일러를 설정한다. (Monkey-patching via PipelineProfiler)
   * @param {object} profiler
   */
  setProfiler(profiler) {
    if (profiler && typeof profiler.wrap === 'function') {
      profiler.wrap(this);
    }
  }

  /**
   * 특정 시스템의 enabled 상태를 변경한다.
   * @param {object}  system
   * @param {boolean} enabled
   */
  setEnabled(system, enabled) {
    const entry = this._entries.find(e => e.system === system);
    if (entry) entry.enabled = enabled;
    else console.warn('[Pipeline] setEnabled: 등록되지 않은 시스템입니다.', system);
  }

  /**
   * priority 오름차순으로 활성 시스템을 모두 실행한다.
   * @param {object} context 각 시스템 update()에 전달되는 공통 컨텍스트
   */
  run(context) {
    if (!this._sorted) {
      this._entries.sort((a, b) => a.priority - b.priority);
      this._sorted = true;
    }
    for (let i = 0; i < this._entries.length; i++) {
      const entry = this._entries[i];
      if (entry.enabled) entry.system.update(context);
    }
  }

  /** 등록된 시스템 목록을 priority 순으로 반환한다. (디버그용) */
  inspect() {
    return this._entries
      .slice()
      .sort((a, b) => a.priority - b.priority)
      .map(e => ({
        name:     e.system.constructor?.name ?? '(anonymous)',
        priority: e.priority,
        enabled:  e.enabled,
      }));
  }

  /** 모든 등록을 해제한다. */
  clear() {
    this._entries.length = 0;
    this._sorted = false;
  }
}
