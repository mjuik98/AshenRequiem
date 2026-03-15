import { createWorld, clearFrameEvents } from '../state/createWorld.js';
import { createUiState } from '../state/createUiState.js';
import { createPlayer } from '../entities/createPlayer.js';
import { createEnemy } from '../entities/createEnemy.js';
import { createProjectile } from '../entities/createProjectile.js';
import { createPickup } from '../entities/createPickup.js';
import { createEffect } from '../entities/createEffect.js';
import { waveData } from '../data/waveData.js';
import { generateId } from '../utils/ids.js';
import { EFFECT_DEFAULTS } from '../data/constants.js';

// Systems
import { PlayerMovementSystem } from '../systems/movement/PlayerMovementSystem.js';
import { EnemyMovementSystem } from '../systems/movement/EnemyMovementSystem.js';
import { WeaponSystem } from '../systems/combat/WeaponSystem.js';
import { ProjectileSystem } from '../systems/combat/ProjectileSystem.js';
import { CollisionSystem } from '../systems/combat/CollisionSystem.js';
import { DamageSystem } from '../systems/combat/DamageSystem.js';
import { StatusEffectSystem } from '../systems/combat/StatusEffectSystem.js';
import { DeathSystem } from '../systems/combat/DeathSystem.js';
import { ExperienceSystem } from '../systems/progression/ExperienceSystem.js';
import { LevelSystem } from '../systems/progression/LevelSystem.js';
import { UpgradeSystem } from '../systems/progression/UpgradeSystem.js';
import { SpawnSystem } from '../systems/spawn/SpawnSystem.js';
import { CameraSystem } from '../systems/camera/CameraSystem.js';
import { RenderSystem } from '../systems/render/RenderSystem.js';
import { SoundSystem } from '../systems/sound/SoundSystem.js';

// Managers
import { ObjectPool } from '../managers/ObjectPool.js';

// UI
import { mountUI } from '../ui/dom/mountUI.js';
import { HudView } from '../ui/hud/HudView.js';
import { LevelUpView } from '../ui/levelup/LevelUpView.js';
import { ResultView } from '../ui/result/ResultView.js';

/**
 * PlayScene — 전투 씬 (15단계 프레임 파이프라인)
 *
 * Scene는 흐름 제어만 담당. 계산은 System에 위임.
 * ObjectPool로 투사체·이펙트 GC 부담 감소.
 * StatusEffectSystem으로 슬로우·독·스턴 지원.
 * SoundSystem으로 절차적 효과음 지원.
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

    /** @type {ObjectPool|null} */
    this._projectilePool = null;
    /** @type {ObjectPool|null} */
    this._effectPool = null;
    /** @type {SoundSystem|null} */
    this._soundSystem = null;
  }

  enter() {
    // 상태 초기화
    this.world = createWorld();
    this.uiState = createUiState();
    SpawnSystem.reset();

    // 플레이어 생성 (화면 중앙)
    this.world.player = createPlayer(0, 0);

    // ─── 오브젝트 풀 초기화 ───
    this._projectilePool = new ObjectPool(
      () => createProjectile({ x: 0, y: 0 }),
      _resetProjectile,
      40,
    );

    this._effectPool = new ObjectPool(
      () => createEffect({ x: 0, y: 0 }),
      _resetEffect,
      60,
    );

    // ─── 사운드 시스템 초기화 ───
    this._soundSystem = new SoundSystem();
    this._soundSystem.init();

    // UI 초기화
    const uiContainer = mountUI();
    this.hudView = new HudView(uiContainer);
    this.levelUpView = new LevelUpView(uiContainer);
    this.resultView = new ResultView(uiContainer);
    this.hudView.show();
  }

  update(dt) {
    const world = this.world;
    const input = this.game.input;

    // 사망 상태 → 아무것도 안 함
    if (world.playMode === 'dead') return;

    // 레벨업 중 → 일시정지 (UI 대기)
    if (world.playMode === 'levelup') return;

    // ─── 15단계 프레임 파이프라인 ───

    // 1. 프레임 이벤트 초기화
    clearFrameEvents(world);

    // 2. 게임 시간 갱신
    world.deltaTime = dt;
    world.time += dt;
    world.elapsedTime += dt;

    // 3. 스폰 처리
    SpawnSystem.update({
      elapsedTime: world.elapsedTime,
      waveData,
      player: world.player,
      spawnQueue: world.spawnQueue,
      deltaTime: dt,
    });

    // 4. 플레이어 이동
    PlayerMovementSystem.update({
      input,
      player: world.player,
      deltaTime: dt,
    });

    // 5. 적 이동 (스턴된 적은 내부에서 스킵)
    EnemyMovementSystem.update({
      player: world.player,
      enemies: world.enemies,
      deltaTime: dt,
    });

    // 6. 무기 발동 및 공격 생성 요청
    WeaponSystem.update({
      player: world.player,
      enemies: world.enemies,
      deltaTime: dt,
      spawnQueue: world.spawnQueue,
    });

    // 7. 투사체 이동
    ProjectileSystem.update({
      projectiles: world.projectiles,
      deltaTime: dt,
    });

    // 8. 충돌 판정
    CollisionSystem.update({
      player: world.player,
      enemies: world.enemies,
      projectiles: world.projectiles,
      pickups: world.pickups,
      events: world.events,
    });

    // 9. 데미지 적용
    DamageSystem.update({
      events: world.events,
      player: world.player,
      spawnQueue: world.spawnQueue,
    });

    // 9.5. 상태이상 적용 (이번 프레임 hits 기반)
    StatusEffectSystem.applyFromHits({
      hits: world.events.hits,
    });

    // 9.7. 상태이상 틱 (지속 효과 처리 + 독 데미지)
    StatusEffectSystem.tick({
      enemies: world.enemies,
      player: world.player,
      deltaTime: dt,
      events: world.events,
      spawnQueue: world.spawnQueue,
    });

    // 10. 사망 처리 및 드랍 생성
    DeathSystem.update({
      events: world.events,
      world,
      spawnQueue: world.spawnQueue,
    });

    // 10.5. 사운드 처리 (이번 프레임 이벤트 기반)
    this._soundSystem.processEvents(world.events);

    // 11. 경험치 흡수 처리
    ExperienceSystem.update({
      events: world.events,
      player: world.player,
      pickups: world.pickups,
      deltaTime: dt,
    });

    // 12. 레벨업 여부 확인
    LevelSystem.update({
      player: world.player,
      world,
    });

    // 13. 생성 큐 / 삭제 큐 반영 (풀 포함)
    this._flushQueues();

    // 14. 이펙트 수명 갱신
    this._updateEffects(dt);

    // 15. 카메라 갱신
    CameraSystem.update({
      player: world.player,
      camera: this.camera,
    });

    // ─── 후처리 ───

    // 레벨업 상태 전환 감지
    if (world.playMode === 'levelup') {
      this._showLevelUpUI();
    }

    // 사망 상태 전환 감지
    if (world.playMode === 'dead') {
      this._showResultUI();
    }

    // HUD 업데이트
    this.hudView.update(world.player, world);
  }

  render() {
    // 렌더링 (읽기 전용)
    RenderSystem.update({
      world: this.world,
      camera: this.camera,
      renderer: this.game.renderer,
    });
  }

  exit() {
    if (this.hudView) this.hudView.destroy();
    if (this.levelUpView) this.levelUpView.destroy();
    if (this.resultView) this.resultView.destroy();
    if (this._soundSystem) this._soundSystem.destroy();
    this._projectilePool = null;
    this._effectPool = null;
    this._soundSystem = null;
  }

  // ─── 큐 플러시 (오브젝트 풀 적용) ───

  _flushQueues() {
    const world = this.world;

    // 생성 큐 반영
    for (let i = 0; i < world.spawnQueue.length; i++) {
      const req = world.spawnQueue[i];
      switch (req.type) {
        case 'enemy': {
          const enemy = createEnemy(req.config.enemyId, req.config.x, req.config.y);
          if (enemy) world.enemies.push(enemy);
          break;
        }
        case 'projectile': {
          const proj = this._projectilePool.acquire(req.config);
          world.projectiles.push(proj);
          break;
        }
        case 'pickup': {
          const pickup = createPickup(req.config.x, req.config.y, req.config.xpValue);
          world.pickups.push(pickup);
          break;
        }
        case 'effect': {
          const effect = this._effectPool.acquire(req.config);
          world.effects.push(effect);
          break;
        }
      }
    }
    world.spawnQueue.length = 0;

    // ⑤ 삭제 큐 반영 — 배열을 새로 할당하지 않고 인플레이스로 압축
    //    풀 반납이 필요한 projectiles·effects는 release 후 제거,
    //    enemies·pickups는 제거만 수행.
    _compactWithPool(world.projectiles, this._projectilePool);
    _compactInPlace(world.enemies);
    _compactInPlace(world.pickups);
    _compactWithPool(world.effects, this._effectPool);
  }

  _updateEffects(dt) {
    for (let i = 0; i < this.world.effects.length; i++) {
      const e = this.world.effects[i];
      if (!e.isAlive) continue;
      e.lifetime += dt;
      if (e.lifetime >= e.maxLifetime) {
        e.isAlive = false;
        e.pendingDestroy = true;
      }
    }
  }

  // ─── UI 전환 ───

  _showLevelUpUI() {
    this._soundSystem.play('levelup');

    const choices = UpgradeSystem.generateChoices(this.world.player);
    if (choices.length === 0) {
      // 선택지 없으면 자동 통과
      this.world.playMode = 'playing';
      return;
    }

    this.levelUpView.show(choices, (selectedUpgrade) => {
      UpgradeSystem.applyUpgrade(this.world.player, selectedUpgrade);
      this.world.playMode = 'playing';
    });
  }

  _showResultUI() {
    this.hudView.hide();
    this.resultView.show(
      {
        killCount: this.world.killCount,
        survivalTime: this.world.elapsedTime,
        level: this.world.player.level,
      },
      () => {
        // 재시작: 새 PlayScene
        const newScene = new PlayScene(this.game);
        this.game.sceneManager.changeScene(newScene);
      },
    );
  }
}

// ─── 오브젝트 풀 리셋 함수 (배열 내부 재사용, 신규 할당 최소화) ───

/**
 * 투사체 오브젝트 인플레이스 초기화
 * hitTargets 배열은 length=0으로 재사용해 GC 부담을 줄인다.
 */
function _resetProjectile(obj, cfg) {
  obj.id = generateId();
  obj.type = 'projectile';
  obj.x = cfg.x || 0;
  obj.y = cfg.y || 0;
  obj.dirX = cfg.dirX || 0;
  obj.dirY = cfg.dirY || 0;
  obj.speed = cfg.speed || 300;
  obj.damage = cfg.damage || 1;
  obj.radius = cfg.radius || 5;
  obj.color = cfg.color || '#ffee58';
  obj.pierce = cfg.pierce || 1;
  obj.hitCount = 0;
  obj.hitTargets.length = 0;    // 배열 재사용
  obj.maxRange = cfg.maxRange || 400;
  obj.distanceTraveled = 0;
  obj.behaviorId = cfg.behaviorId || 'targetProjectile';
  obj.lifetime = cfg.lifetime || 0;
  obj.maxLifetime = cfg.maxLifetime || 0.3;
  obj.ownerId = cfg.ownerId || null;
  obj.statusEffectId = cfg.statusEffectId || null;
  obj.statusEffectChance = cfg.statusEffectChance ?? 1.0;
  obj.isAlive = true;
  obj.pendingDestroy = false;
}

/**
 * 이펙트 오브젝트 인플레이스 초기화
 */
function _resetEffect(obj, cfg) {
  obj.id = generateId();
  obj.type = 'effect';
  obj.x = cfg.x || 0;
  obj.y = cfg.y || 0;
  obj.effectType = cfg.effectType || 'burst';
  obj.color = cfg.color || '#ff5722';
  obj.text = cfg.text || '';
  obj.radius = cfg.radius || 15;
  obj.lifetime = 0;
  obj.maxLifetime = cfg.duration || EFFECT_DEFAULTS.duration;
  obj.isAlive = true;
  obj.pendingDestroy = false;
}

// ─── 배열 압축 헬퍼 ───

/**
 * pendingDestroy 항목을 풀에 반납하고 배열에서 제거 (인플레이스, 신규 배열 할당 없음)
 * @param {Array}      arr
 * @param {ObjectPool} pool
 */
function _compactWithPool(arr, pool) {
  let write = 0;
  for (let read = 0; read < arr.length; read++) {
    const item = arr[read];
    if (item.pendingDestroy) {
      pool.release(item);
    } else {
      arr[write++] = item;
    }
  }
  arr.length = write;
}

/**
 * pendingDestroy 항목을 배열에서 제거 (인플레이스, 신규 배열 할당 없음)
 * @param {Array} arr
 */
function _compactInPlace(arr) {
  let write = 0;
  for (let read = 0; read < arr.length; read++) {
    if (!arr[read].pendingDestroy) {
      arr[write++] = arr[read];
    }
  }
  arr.length = write;
}
