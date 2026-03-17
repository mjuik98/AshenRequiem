import { randomPick, randomRange } from '../../utils/random.js';
import { GameConfig }              from '../../core/GameConfig.js';

/**
 * SpawnSystem — 시간 기반 적 스폰
 *
 * CHANGE(P1-①): 싱글톤 객체 리터럴 → 클래스로 전환
 *   - 이전: `export const SpawnSystem = { ... }` + 수동 reset() 호출 필수
 *   - 이후: `new SpawnSystem()` 으로 PlayScene.enter() 에서 인스턴스 생성
 *   - 재시작 시 PlayScene이 새 인스턴스를 만들면 상태 오염이 구조적으로 불가능
 *   - reset() 메서드 유지 (혹시 동일 인스턴스를 재사용하는 경우를 위한 안전망)
 */

const BOSS_SUPPRESSION_DURATION = 30;
const BOSS_SPAWN_MULTIPLIER     = 0.45;

export class SpawnSystem {
  constructor() {
    this._spawnAccumulator  = 0;
    this._spawnedBossAt     = new Set();
    this._lastBossSpawnTime = -Infinity;
  }

  /** 동일 인스턴스 재사용 시 안전망용 — 새 인스턴스 생성이 권장 방식 */
  reset() {
    this._spawnAccumulator  = 0;
    this._spawnedBossAt.clear();
    this._lastBossSpawnTime = -Infinity;
    console.debug('[SpawnSystem] reset 완료');
  }

  getDebugInfo(elapsedTime) {
    const timeSinceBoss = elapsedTime - this._lastBossSpawnTime;
    const isSuppressed  = timeSinceBoss >= 0 && timeSinceBoss < BOSS_SUPPRESSION_DURATION;
    return {
      hasBossSpawned:       this._lastBossSpawnTime > -Infinity,
      isSuppressed,
      suppressionRemaining: isSuppressed ? BOSS_SUPPRESSION_DURATION - timeSinceBoss : 0,
      bossSpawnedAt:        this._lastBossSpawnTime > -Infinity ? this._lastBossSpawnTime : null,
    };
  }

  update({ world: { elapsedTime, player, spawnQueue, deltaTime }, data: { waveData, bossData } }) {
    if (!player?.isAlive) return;

    // 보스 스폰
    if (bossData) {
      for (let b = 0; b < bossData.length; b++) {
        const boss = bossData[b];
        if (elapsedTime >= boss.at && !this._spawnedBossAt.has(boss.at)) {
          this._spawnedBossAt.add(boss.at);
          this._lastBossSpawnTime = elapsedTime;
          const pos = this._randomOffscreenPosition(player);
          spawnQueue.push({ type: 'enemy', config: { enemyId: boss.enemyId, x: pos.x, y: pos.y } });
        }
      }
    }

    // 일반 / 엘리트 스폰
    let activeWave = null;
    for (let i = 0; i < waveData.length; i++) {
      const w = waveData[i];
      if (elapsedTime >= w.from && elapsedTime < w.to) { activeWave = w; break; }
    }
    if (!activeWave) return;

    const timeSinceBoss = elapsedTime - this._lastBossSpawnTime;
    const isBossActive  = timeSinceBoss >= 0 && timeSinceBoss < BOSS_SUPPRESSION_DURATION;
    const effectiveRate = isBossActive
      ? activeWave.spawnPerSecond * BOSS_SPAWN_MULTIPLIER
      : activeWave.spawnPerSecond;

    this._spawnAccumulator += effectiveRate * deltaTime;

    while (this._spawnAccumulator >= 1) {
      this._spawnAccumulator -= 1;

      let enemyId;
      if (activeWave.eliteChance > 0 && activeWave.eliteIds?.length > 0
          && Math.random() < activeWave.eliteChance) {
        enemyId = randomPick(activeWave.eliteIds);
      } else {
        enemyId = randomPick(activeWave.enemyIds);
      }

      const pos = this._randomOffscreenPosition(player);
      spawnQueue.push({ type: 'enemy', config: { enemyId, x: pos.x, y: pos.y } });
    }
  }

  _randomOffscreenPosition(player) {
    const margin = 80;
    const halfW  = GameConfig.canvasWidth  / 2 + margin;
    const halfH  = GameConfig.canvasHeight / 2 + margin;
    const side   = Math.floor(Math.random() * 4);
    let x, y;
    switch (side) {
      case 0: x = player.x + randomRange(-halfW, halfW); y = player.y - halfH; break;
      case 1: x = player.x + randomRange(-halfW, halfW); y = player.y + halfH; break;
      case 2: x = player.x - halfW; y = player.y + randomRange(-halfH, halfH); break;
      default:x = player.x + halfW; y = player.y + randomRange(-halfH, halfH); break;
    }
    return { x, y };
  }
}
