/**
 * src/scenes/PlayScene.js
 *
 * CHANGE(Settings): session.options 기반 설정 적용 추가
 *   - PlayContext.create() 시 soundEnabled를 session.options에서 읽음
 *   - _applySessionOptions(): 볼륨 및 품질 프리셋 반영
 *
 * PATCH:
 * - pause 메뉴에서 메인메뉴 이동 시 중복 전환 방지
 * - 비동기 import 레이스 방지용 플래그 추가
 * - devicePixelRatio 변화를 추적해 렌더 파이프라인에 반영
 */
import { PlayContext }                  from '../core/PlayContext.js';
import { createWorld }                  from '../state/createWorld.js';
import { createPlayer }                 from '../entities/createPlayer.js';
import { GameConfig }                   from '../core/GameConfig.js';
import { GameDataLoader }               from '../data/GameDataLoader.js';
import { mountUI }                      from '../ui/dom/mountUI.js';
import { PlayUI }                       from './play/PlayUI.js';
import { PlayResultHandler }            from './play/PlayResultHandler.js';
import { createLevelUpController }      from './play/levelUpController.js';
import { PlayModeStateMachine }         from '../core/PlayModeStateMachine.js';
import { transitionPlayMode, PlayMode } from '../state/PlayMode.js';
import { TitleScene }                   from './TitleScene.js';
import { recordWeaponAcquired }         from '../systems/event/codexHandler.js';
import {
  applySessionOptionsToRuntime,
  getEffectiveDevicePixelRatio,
  normalizeSessionOptions,
} from '../state/sessionOptions.js';
import { updateSessionOptionsAndSave } from '../state/sessionFacade.js';

export class PlayScene {
  constructor(game) {
    this.game               = game;
    this.sceneId            = 'PlayScene';
    this.world              = null;
    this._ctx               = null;
    this._pipeline          = null;
    this._pipelineCtx       = null;
    this._systems           = null;
    this._dpr               = 1;

    this._ui                = null;
    this._resultHandler     = null;
    this._uiState           = null;
    this._gameData          = null;
    this._levelUpController = null;

    this._pauseWasDown      = false;
    this._isSceneChanging   = false;
  }

  enter() {
    this.world        = createWorld();
    this.world.player = createPlayer(0, 0, this.game.session);
    this.world.runRerollsRemaining = this.game.session?.meta?.permanentUpgrades?.reroll_charge ?? 0;
    this.world.runBanishesRemaining = this.game.session?.meta?.permanentUpgrades?.banish_charge ?? 0;
    this.world.banishedUpgradeIds = [];
    this.world.levelUpActionMode = 'select';

    this._gameData = GameDataLoader.clone(this.game.gameData);

    // CHANGE(Settings): soundEnabled를 session.options에서 읽음
    const opts = normalizeSessionOptions(this.game.session?.options);

    this._ctx = PlayContext.create({
      canvas:           this.game.canvas,
      renderer:         this.game.renderer,
      soundEnabled:     opts.soundEnabled ?? true,
      profilingEnabled: true,
      session:          this.game.session,
    });

    this._ui = new PlayUI(mountUI());
    this._ui.showHud();

    this._ctx.setAnnouncementViews(
      this._ui.getBossAnnouncementView(),
      this._ui.getWeaponEvolutionView(),
    );

    const { pipeline, pipelineCtx, systems } = this._ctx.buildPipeline(
      this.world,
      this.game.input,
      this._gameData,
    );
    this._pipeline    = pipeline;
    this._pipelineCtx = pipelineCtx;
    this._systems     = systems;

    // CHANGE(Settings): 볼륨·품질 설정 반영
    this._applySessionOptions();

    this._resultHandler = new PlayResultHandler(this.game.session);
    this._levelUpController = createLevelUpController({
      getWorld: () => this.world,
      isBlocked: () => this._isSceneChanging,
      showLevelUp: (config) => this._ui.showLevelUp(config),
    });

    this._uiState = new PlayModeStateMachine({
      onLevelUp: () => this._levelUpController?.show(),
      onDead:    () => this._showResultUI(),
      onResume:  () => {
        this._ui.hidePause();
        this._ui.hideLevelUp();
      },
    });

    this._dpr             = this._getEffectiveDpr();

    // Record initial starting weapons for Codex
    if (this.world.player && this.world.player.weapons) {
       this.world.player.weapons.forEach(w => {
         recordWeaponAcquired(this.game.session, w.id);
       });
    }

    this._pauseWasDown    = false;
    this._isSceneChanging = false;
  }

  /**
   * 세션 설정을 실행 중인 시스템에 반영한다.
   * enter() 직후 1회 호출된다.
   *
   * - 볼륨: SoundSystem.setVolume(master, bgm, sfx)
   * - 품질: CanvasRenderer.setQualityPreset(preset)
   */
  _applySessionOptions() {
    applySessionOptionsToRuntime(this.game.session?.options, {
      soundSystem: this._ctx.soundSystem,
      renderer: this.game.renderer,
    });
  }

  _getEffectiveDpr() {
    return getEffectiveDevicePixelRatio(
      this.game.session?.options,
      window.devicePixelRatio || 1,
      GameConfig.useDevicePixelRatio,
    );
  }

  update(dt) {
    if (!this.world || !this._ctx || !this._uiState || this._isSceneChanging) return;

    const nextDpr = this._getEffectiveDpr();
    if (nextDpr !== this._dpr) {
      this._dpr = nextDpr;
    }

    const inputState = this.game.inputState ?? this.game.input.poll();

    const pauseDown = inputState.isAction('pause');
    if (pauseDown && !this._pauseWasDown) {
      this._handlePauseToggle();
    }
    this._pauseWasDown = pauseDown;

    if (this._uiState.tick(this.world.playMode)) return;

    this._runGamePipeline(dt);
  }

  _runGamePipeline(dt) {
    if (!this.world || !this._pipeline || !this._pipelineCtx) return;
    this.world.deltaTime  = dt;
    this._pipelineCtx.dt  = dt;
    this._pipelineCtx.dpr = this._dpr;
    this._pipeline.run(this._pipelineCtx);
    this._ui.update(this.world);
  }

  render() {}

  exit() {
    this._ui?.destroy();
    this._uiState?.reset();
    this._ctx?.dispose();
    this._ui               = null;
    this._resultHandler    = null;
    this._uiState          = null;
    this._ctx              = null;
    this._pipeline         = null;
    this._pipelineCtx      = null;
    this._systems          = null;
    this._gameData         = null;
    this._levelUpController = null;
    this.world             = null;
    this._pauseWasDown     = false;
    this._isSceneChanging  = false;
  }

  // ── 내부 핸들러 ───────────────────────────────────────────────────────

  _handlePauseToggle() {
    if (!this.world || this._isSceneChanging) return;

    const mode = this.world.playMode;
    if (mode === PlayMode.PLAYING) {
      transitionPlayMode(this.world, PlayMode.PAUSED);

      this._ui.showPause({
        player: this.world.player,
        data: this._gameData,
        world: this.world,
        session: this.game.session,
        onResume: () => {
          if (!this.world || this._isSceneChanging) return;
          transitionPlayMode(this.world, PlayMode.PLAYING);
          this._ui.hidePause();
        },
        onForfeit: () => {
          if (!this.world || this._isSceneChanging) return;
          this.world.runOutcome = { type: 'defeat' };
          this._ui.hidePause();
          transitionPlayMode(this.world, PlayMode.DEAD);
        },
        onOptionsChange: (nextOptions) => this._updatePauseOptions(nextOptions),
      });
    } else if (mode === PlayMode.PAUSED) {
      transitionPlayMode(this.world, PlayMode.PLAYING);
      this._ui.hidePause();
    }
  }

  _updatePauseOptions(nextOptions) {
    if (!this.game.session) return;
    updateSessionOptionsAndSave(this.game.session, nextOptions);
    this._applySessionOptions();
  }

  _showResultUI() {
    if (this._isSceneChanging) return;
    const stats = this._resultHandler.process(this.world);
    this._ui.showResult(
      stats,
      () => {
        if (this._isSceneChanging) return;
        this._isSceneChanging = true;
        this.game.sceneManager.changeScene(new PlayScene(this.game));
      },
      () => {
        if (this._isSceneChanging) return;
        this._isSceneChanging = true;
        this.game.sceneManager.changeScene(new TitleScene(this.game));
      },
    );
  }
}
