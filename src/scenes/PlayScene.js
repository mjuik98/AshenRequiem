import { createWorld, clearFrameEvents } from '../state/createWorld.js';
import { createUiState } from '../state/createUiState.js';
import { createPlayer } from '../entities/createPlayer.js';
import { createEnemy } from '../entities/createEnemy.js';
import { createProjectile } from '../entities/createProjectile.js';
import { createPickup } from '../entities/createPickup.js';
import { createEffect } from '../entities/createEffect.js';
import { GameConfig } from '../core/GameConfig.js';
import { waveData } from '../data/waveData.js';

// Systems
import { PlayerMovementSystem } from '../systems/movement/PlayerMovementSystem.js';
import { EnemyMovementSystem } from '../systems/movement/EnemyMovementSystem.js';
import { WeaponSystem } from '../systems/combat/WeaponSystem.js';
import { ProjectileSystem } from '../systems/combat/ProjectileSystem.js';
import { CollisionSystem } from '../systems/combat/CollisionSystem.js';
import { DamageSystem } from '../systems/combat/DamageSystem.js';
import { DeathSystem } from '../systems/combat/DeathSystem.js';
import { ExperienceSystem } from '../systems/progression/ExperienceSystem.js';
import { LevelSystem } from '../systems/progression/LevelSystem.js';
import { UpgradeSystem } from '../systems/progression/UpgradeSystem.js';
import { SpawnSystem } from '../systems/spawn/SpawnSystem.js';
import { CameraSystem } from '../systems/camera/CameraSystem.js';
import { RenderSystem } from '../systems/render/RenderSystem.js';

// UI
import { mountUI } from '../ui/dom/mountUI.js';
import { HudView } from '../ui/hud/HudView.js';
import { LevelUpView } from '../ui/levelup/LevelUpView.js';
import { ResultView } from '../ui/result/ResultView.js';

/**
 * PlayScene — 전투 씬 (15단계 프레임 파이프라인)
 *
 * Scene는 흐름 제어만 담당. 계산은 System에 위임.
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
  }

  enter() {
    // 상태 초기화
    this.world = createWorld();
    this.uiState = createUiState();
    SpawnSystem.reset();

    // 플레이어 생성 (화면 중앙)
    this.world.player = createPlayer(0, 0);

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

    // 5. 적 이동
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

    // 10. 사망 처리 및 드랍 생성
    DeathSystem.update({
      events: world.events,
      world,
      spawnQueue: world.spawnQueue,
    });

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

    // 13. 생성 큐 / 삭제 큐 반영
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
  }

  // ─── 큐 플러시 ───

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
          const proj = createProjectile(req.config);
          world.projectiles.push(proj);
          break;
        }
        case 'pickup': {
          const pickup = createPickup(req.config.x, req.config.y, req.config.xpValue);
          world.pickups.push(pickup);
          break;
        }
        case 'effect': {
          const effect = createEffect(req.config);
          world.effects.push(effect);
          break;
        }
      }
    }
    world.spawnQueue.length = 0;

    // 삭제 큐 반영 (pendingDestroy 플래그 기반 필터링)
    world.enemies = world.enemies.filter(e => !e.pendingDestroy);
    world.projectiles = world.projectiles.filter(p => !p.pendingDestroy);
    world.pickups = world.pickups.filter(pk => !pk.pendingDestroy);
    world.effects = world.effects.filter(ef => !ef.pendingDestroy);
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
