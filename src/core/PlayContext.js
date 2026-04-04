/**
 * src/core/PlayContext.js — PlayScene 서비스 컨테이너
 *
 * CHANGE(P1): session을 services에서 제거 — R-14 완전 준수
 */

import { PipelineBuilder }   from './PipelineBuilder.js';
import {
  createPlayContextRuntimeState,
  createPlayContextServices,
} from './playContextRuntime.js';

export class PlayContext {
  static create({
    canvas,
    renderer         = null,
    soundEnabled     = true,
    profilingEnabled = false,
    poolSizes        = {},
    session          = null,
    registerEventHandlersImpl = null,
    nowSeconds       = undefined,
    createAudioContext = undefined,
  } = {}) {
    const ctx = new PlayContext();
    Object.assign(ctx, createPlayContextRuntimeState({
      canvas,
      renderer,
      soundEnabled,
      profilingEnabled,
      poolSizes,
      session,
      registerEventHandlersImpl,
      ...(nowSeconds ? { nowSeconds } : {}),
      ...(createAudioContext ? { createAudioContext } : {}),
    }));
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
    this.registerEventHandlersImpl = null;
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
      this.registerEventHandlersImpl,
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
    return createPlayContextServices(this);
  }
}
