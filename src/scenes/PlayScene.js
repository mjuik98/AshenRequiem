import { compactWithPool, compactInPlace } from '../utils/compact.js';
import { resetProjectile, resetEffect } from '../managers/poolResets.js';
import { createWorld, clearFrameEvents } from '../state/createWorld.js';
import { createUiState } from '../state/createUiState.js';
import { createPlayer }     from '../entities/createPlayer.js';
// createProjectile, createEffect: ObjectPool 팩토리 인자로 사용 (직접 제거 불가)
import { createProjectile } from '../entities/createProjectile.js';
import { createEffect }     from '../entities/createEffect.js';
import { waveData } from '../data/waveData.js';
import { bossData } from '../data/bossData.js';
import { EFFECT_DEFAULTS } from '../data/constants.js';

import { PlayerMovementSystem }  from '../systems/movement/PlayerMovementSystem.js';
import { EnemyMovementSystem }   from '../systems/movement/EnemyMovementSystem.js';
import { EliteBehaviorSystem }   from '../systems/movement/EliteBehaviorSystem.js';
import { WeaponSystem }          from '../systems/combat/WeaponSystem.js';
import { ProjectileSystem }      from '../systems/combat/ProjectileSystem.js';
import { CollisionSystem }       from '../systems/combat/CollisionSystem.js';
import { DamageSystem }          from '../systems/combat/DamageSystem.js';
import { StatusEffectSystem }    from '../systems/combat/StatusEffectSystem.js';
import { DeathSystem }           from '../systems/combat/DeathSystem.js';
import { ExperienceSystem }      from '../systems/progression/ExperienceSystem.js';
import { LevelSystem }           from '../systems/progression/LevelSystem.js';
import { UpgradeSystem }         from '../systems/progression/UpgradeSystem.js';
import { SpawnSystem }           from '../systems/spawn/SpawnSystem.js';
import { CameraSystem }          from '../systems/camera/CameraSystem.js';
import { RenderSystem }          from '../systems/render/RenderSystem.js';
import { SoundSystem }           from '../systems/sound/SoundSystem.js';
import { FlushSystem }           from '../systems/spawn/FlushSystem.js';

import { ObjectPool } from '../managers/ObjectPool.js';

import { mountUI }     from '../ui/dom/mountUI.js';
import { HudView }     from '../ui/hud/HudView.js';
import { LevelUpView } from '../ui/levelup/LevelUpView.js';
import { ResultView }  from '../ui/result/ResultView.js';
import { DebugView }   from '../ui/debug/DebugView.js';
import { BossHudView } from '../ui/boss/BossHudView.js';

/**
 * PlayScene — 전투 씬 (16단계 프레임 파이프라인)
 *
 * REF(refactor): _updateEffects() 제거 → FlushSystem.tickEffects() 위임.
 *   이펙트 수명 갱신은 게임 로직이므로 Scene 이 아닌 System 이 담당.
 *   14단계: this._updateEffects(dt) → FlushSystem.tickEffects({ effects, deltaTime })
 *
 * FIX(bug): _showLevelUpUI 에서 spawnQueue.push + _flushQueues() 수동 호출 제거.
 *   이후: effectPool.acquire() 로 직접 world.effects 에 push.
 *
 * REF(safety): SpawnSystem.reset() 을 enter() 최상단으로 이동 (주석 아닌 코드로 보호).
 *   싱글톤 상태 오염 방지 — 재시작 시 보스 미등장 / 스폰 누적 버그 예방.
 *
 * DEBUG: DebugView.update 에 SpawnSystem.getDebugInfo() 결과를 전달.
 *   보스 억제 구간 잔여 시간을 디버그 패널에 실시간 표시.
 */
export class PlayScene {
  constructor(game) {
    this.game = game;
    this.world = null;
    this.uiState = null;
    this.camera = { x: 0, y: 0 };
    this.hudView = null;
    this.levelUpView = null;
    this.resultView = null;
    this.debugView = null;
    this.bossHudView = null;
    this._projectilePool = null;
    this._effectPool = null;
    this._soundSystem = null;
    this._dpr = window.devicePixelRatio || 1;
  }

  enter() {
    // REF(safety): SpawnSystem.reset() 을 enter() 첫 줄에 배치 — 재시작 상태 오염 방지
    SpawnSystem.reset();

    this.world = createWorld();
    this.uiState = createUiState();

    this.world.player = createPlayer(0, 0);

    this._projectilePool = new ObjectPool(
      () => createProjectile({ x: 0, y: 0 }),
      resetProjectile,
      80,
    );
    this._effectPool = new ObjectPool(
      () => createEffect({ x: 0, y: 0 }),
      resetEffect,
      60,
    );

    this._soundSystem = new SoundSystem();
    this._soundSystem.init();

    const uiContainer = mountUI();
    this.hudView     = new HudView(uiContainer);
    this.levelUpView = new LevelUpView(uiContainer);
    this.resultView  = new ResultView(uiContainer);
    this.debugView   = new DebugView(uiContainer);
    this.bossHudView = new BossHudView(uiContainer);
    this.hudView.show();
    this._dpr = window.devicePixelRatio || 1;
  }

  update(dt) {
    const world = this.world;
    const input = this.game.input;

    if (world.playMode === 'dead') return;
    if (world.playMode === 'levelup') return;

    // ─── 프레임 파이프라인 ─────────────────────────────────────

    // 1. 프레임 이벤트 초기화
    clearFrameEvents(world);

    // 2. 게임 시간 갱신
    world.deltaTime = dt;
    world.elapsedTime += dt;

    // 3. 스폰 처리
    SpawnSystem.update({
      elapsedTime: world.elapsedTime,
      waveData, bossData,
      player: world.player,
      spawnQueue: world.spawnQueue,
      deltaTime: dt,
    });

    // 4. 플레이어 이동
    PlayerMovementSystem.update({ input, player: world.player, deltaTime: dt });

    // 5. 적 이동
    EnemyMovementSystem.update({ player: world.player, enemies: world.enemies, deltaTime: dt });

    // 5.5. 엘리트/보스 행동 패턴
    EliteBehaviorSystem.update({
      enemies: world.enemies,
      player:  world.player,
      deltaTime: dt,
      spawnQueue: world.spawnQueue,
    });

    // 6. 무기 발동
    WeaponSystem.update({
      player: world.player, enemies: world.enemies,
      deltaTime: dt, spawnQueue: world.spawnQueue,
    });

    // 7. 투사체 이동
    ProjectileSystem.update({
      projectiles: world.projectiles,
      player:      world.player,
      deltaTime:   dt,
    });

    // 8. 충돌 판정
    CollisionSystem.update({
      player:      world.player,
      enemies:     world.enemies,
      projectiles: world.projectiles,
      pickups:     world.pickups,
      events:      world.events,
      camera:      this.camera,
    });

    // 9. 상태이상 부여
    StatusEffectSystem.applyFromHits({ hits: world.events.hits });

    // 9.5. 상태이상 틱
    StatusEffectSystem.tick({
      enemies:   world.enemies,
      player:    world.player,
      deltaTime: dt,
      events:    world.events,
    });

    // 9.7. 데미지 적용
    DamageSystem.update({ events: world.events, player: world.player, spawnQueue: world.spawnQueue });

    // 10. 사망 처리
    DeathSystem.update({ events: world.events, worldState: world, spawnQueue: world.spawnQueue });

    // 10.5. 사운드 처리
    this._soundSystem.processEvents(world.events);

    // 11. 경험치 흡수
    ExperienceSystem.update({
      events:    world.events,
      player:    world.player,
      pickups:   world.pickups,
      deltaTime: dt,
    });

    // 12. 레벨업 확인
    LevelSystem.update({ player: world.player, worldState: world });

    // 13. 큐 플러시
    FlushSystem.update({
      world,
      pools: { projectile: this._projectilePool, effect: this._effectPool }
    });

    // 14. 이펙트 수명 갱신 — REF: FlushSystem.tickEffects() 위임
    FlushSystem.tickEffects({ effects: world.effects, deltaTime: dt });

    // 15. 카메라 갱신
    CameraSystem.update({ player: world.player, camera: this.camera });

    // ─── 후처리 ──────────────────────────────────────────────

    if (world.playMode === 'levelup') this._showLevelUpUI();
    if (world.playMode === 'dead')    this._showResultUI();

    this.hudView.update(world.player, world);
    this.bossHudView.update(world.enemies);

    this.debugView.handleInput(input);
    // DEBUG: SpawnSystem.getDebugInfo 를 전달 → 보스 억제 상태 표시
    this.debugView.update(
      world,
      { projectilePool: this._projectilePool, effectPool: this._effectPool },
      dt,
      waveData,
      SpawnSystem.getDebugInfo(world.elapsedTime),
    );
  }

  render() {
    RenderSystem.update({
      world: this.world,
      camera: this.camera,
      renderer: this.game.renderer,
      dpr: this._dpr,
    });
  }

  exit() {
    if (this.hudView)      this.hudView.destroy();
    if (this.levelUpView)  this.levelUpView.destroy();
    if (this.resultView)   this.resultView.destroy();
    if (this.debugView)    this.debugView.destroy();
    if (this.bossHudView)  this.bossHudView.destroy();
    if (this._soundSystem) this._soundSystem.destroy();

    // GC leaks 방지
    this.world           = null;
    this.uiState         = null;
    this._projectilePool = null;
    this._effectPool     = null;
    this._soundSystem    = null;
  }

  /**
   * FIX(bug): spawnQueue.push + _flushQueues() 수동 호출 → effectPool.acquire 직접 push.
   * levelFlash 이펙트는 단순 시각 효과이므로 풀에서 직접 꺼내 effects 에 넣는다.
   */
  _showLevelUpUI() {
    this._soundSystem.play('levelup');

    this.world.effects.push(this._effectPool.acquire({
      x: this.world.player.x,
      y: this.world.player.y,
      effectType: 'levelFlash',
      color: '#ffd54f',
      radius: 1,
      duration: EFFECT_DEFAULTS.levelFlashDuration,
    }));

    const choices = UpgradeSystem.generateChoices(this.world.player);
    if (choices.length === 0) { this.world.playMode = 'playing'; return; }

    this.levelUpView.show(choices, (selectedUpgrade) => {
      UpgradeSystem.applyUpgrade(this.world.player, selectedUpgrade);
      this.world.playMode = 'playing';
    });
  }

  _showResultUI() {
    this.hudView.hide();
    this.resultView.show(
      {
        killCount:    this.world.killCount,
        survivalTime: this.world.elapsedTime,
        level:        this.world.player.level,
      },
      () => { this.game.sceneManager.changeScene(new PlayScene(this.game)); },
    );
  }
}
