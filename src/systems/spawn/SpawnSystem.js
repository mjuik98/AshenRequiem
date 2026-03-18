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

  // ... (Using content from files/SpawnSystem.js)
  // FIX(BUG-SPAWN-MODE): playMode를 destructure에 추가
  update({ world: { elapsedTime, player, spawnQueue, deltaTime, playMode }, data: { waveData, bossData } }) {
    // FIX(BUG-SPAWN-MODE): playing 상태가 아니면 스폰 중단
    // dead / levelup / paused 세 상태 모두 포함
    if (playMode !== 'playing') return;
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

      const isElite = activeWave.eliteChance && Math.random() < activeWave.eliteChance;
      const pool    = isElite ? (activeWave.eliteIds ?? activeWave.enemyIds) : activeWave.enemyIds;
      if (!pool?.length) continue;

      const enemyId = randomPick(pool);
      const pos     = this._randomOffscreenPosition(player);
      spawnQueue.push({ type: 'enemy', config: { enemyId, x: pos.x, y: pos.y } });
    }
  }

  _randomOffscreenPosition(player) {
    const margin = 80;
    const w = GameConfig.canvasWidth  + margin * 2;
    const h = GameConfig.canvasHeight + margin * 2;

    const side = Math.floor(Math.random() * 4);
    let x, y;
    switch (side) {
      case 0: x = randomRange(-margin, w - margin); y = -margin;        break; // top
      case 1: x = randomRange(-margin, w - margin); y = h - margin;     break; // bottom
      case 2: x = -margin;                          y = randomRange(-margin, h - margin); break; // left
      default:x = w - margin;                       y = randomRange(-margin, h - margin); break; // right
    }
    return {
      x: player.x + x - GameConfig.canvasWidth  / 2,
      y: player.y + y - GameConfig.canvasHeight / 2,
    };
  }

  /**
   * 디버그 정보를 반환한다.
   * @param {number} elapsedTime
   * @returns {object}
   */
  getDebugInfo(elapsedTime) {
    const timeSinceBoss = elapsedTime - this._lastBossSpawnTime;
    const isSuppressed   = timeSinceBoss >= 0 && timeSinceBoss < BOSS_SUPPRESSION_DURATION;

    return {
      hasBossSpawned:       this._spawnedBossAt.size > 0,
      bossSpawnedAt:        this._lastBossSpawnTime !== -Infinity ? this._lastBossSpawnTime : null,
      isSuppressed:         isSuppressed,
      suppressionRemaining: isSuppressed ? (BOSS_SUPPRESSION_DURATION - timeSinceBoss) : 0,
    };
  }
}
