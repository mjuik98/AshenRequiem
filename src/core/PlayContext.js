/**
 * src/core/PlayContext.js — PlayScene 서비스 컨테이너
 *
 * CHANGE(P1): session을 services에서 제거 — R-14 완전 준수
 */

import { ObjectPool }        from '../managers/ObjectPool.js';
import { PipelineBuilder }   from './PipelineBuilder.js';
import { SoundSystem }       from '../systems/sound/SoundSystem.js';
import { NullSoundSystem }   from '../systems/sound/NullSoundSystem.js';
import { PipelineProfiler }  from '../systems/debug/PipelineProfiler.js';
import { EventRegistry }     from '../systems/event/EventRegistry.js';

import { createProjectile, resetProjectile } from '../entities/createProjectile.js';
import { createEffect,     resetEffect }     from '../entities/createEffect.js';
import { createEnemy,      resetEnemy }      from '../entities/createEnemy.js';
import { createPickup,     resetPickup }     from '../entities/createPickup.js';

const POOL_SIZES = {
  projectile: 200,
  effect:     100,
  enemy:      150,
  pickup:     80,
};

export class PlayContext {
  static create({
    canvas,
    renderer         = null,
    soundEnabled     = true,
    profilingEnabled = false,
    poolSizes        = {},
    session          = null,
  } = {}) {
    const ctx   = new PlayContext();
    const sizes = { ...POOL_SIZES, ...poolSizes };

    ctx.session = session;

    // ── Object Pool ──────────────────────────────────────────────────
    ctx.projectilePool = new ObjectPool(createProjectile, resetProjectile, sizes.projectile);
    ctx.effectPool     = new ObjectPool(createEffect,     resetEffect,     sizes.effect);
    ctx.enemyPool      = new ObjectPool(createEnemy,      resetEnemy,      sizes.enemy);
    ctx.pickupPool     = new ObjectPool(createPickup,     resetPickup,     sizes.pickup);

    // ── Sound ────────────────────────────────────────────────────────
    ctx.soundSystem = soundEnabled
      ? (() => { const s = new SoundSystem(); s.init(); return s; })()
      : new NullSoundSystem();

    // ── EventRegistry (인스턴스) ─────────────────────────────────────
    ctx.eventRegistry = new EventRegistry();

    ctx.profiler  = profilingEnabled ? new PipelineProfiler() : null;
    ctx.canvas    = canvas;
    ctx.renderer  = renderer;

    // CHANGE: 연출 뷰는 PlayScene이 주입한다 (buildPipeline 전에 setAnnouncementViews 호출)
    ctx.bossAnnouncementView = null;
    ctx.weaponEvolutionView  = null;

    return ctx;
  }

  constructor() {
    this.projectilePool = null;
    this.effectPool     = null;
    this.enemyPool      = null;
    this.pickupPool     = null;
    this.soundSystem    = null;
    this.eventRegistry  = null;
    this.profiler       = null;
    this.canvas         = null;
    this.renderer       = null;
    this._builder       = null;
    this.session        = null;
    this.bossAnnouncementView = null;
    this.weaponEvolutionView  = null;
  }

  /**
   * PlayScene이 PlayUI 생성 후 뷰를 주입한다.
   * buildPipeline() 전에 호출해야 한다.
   *
   * @param {object} bossAnnouncementView
   * @param {object} weaponEvolutionView
   */
  setAnnouncementViews(bossAnnouncementView, weaponEvolutionView) {
    this.bossAnnouncementView = bossAnnouncementView;
    this.weaponEvolutionView  = weaponEvolutionView;
  }

  /**
   * @param {object} world
   * @param {import('../input/InputManager.js').InputManager} input
   * @param {import('../data/GameDataLoader.js').GameData} data
   */
  buildPipeline(world, input, data = {}) {
    const services = this._buildServices();

    // CHANGE(P1): session을 별도 파라미터로 전달 (services에서 제거)
    this._builder = new PipelineBuilder(
      services,
      this.eventRegistry,
      this.session,
      this.profiler,
    );
    return this._builder.build(world, input, data);
  }

  setSystemEnabled(system, enabled) {
    this._builder?.setSystemEnabled(system, enabled);
  }

  dispose() {
    this.soundSystem?.stopBgm?.();
    this.soundSystem?.destroy?.();
    this.eventRegistry?.dispose();
    this.eventRegistry = null;
    this._builder = null;
  }

  /** @private — session 제거됨 (R-14 완전 준수) */
  _buildServices() {
    return {
      projectilePool: this.projectilePool,
      effectPool:     this.effectPool,
      enemyPool:      this.enemyPool,
      pickupPool:     this.pickupPool,
      soundSystem:    this.soundSystem,
      canvas:         this.canvas,
      renderer:       this.renderer,
      // CHANGE: 연출 뷰를 서비스로 노출
      bossAnnouncementView: this.bossAnnouncementView,
      weaponEvolutionView:  this.weaponEvolutionView,
    };
  }
}
