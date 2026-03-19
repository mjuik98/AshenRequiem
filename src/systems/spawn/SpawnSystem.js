import { randomPick, randomRange } from '../../utils/random.js';
import { GameConfig }              from '../../core/GameConfig.js';

/**
 * SpawnSystem — 시간 기반 적 스폰
 *
 * REFACTOR: class → 팩토리 함수(createSpawnSystem)
 */

const BOSS_SUPPRESSION_DURATION = 30;
const BOSS_SPAWN_MULTIPLIER     = 0.45;

export function createSpawnSystem() {
  let _spawnAccumulator  = 0;
  let _spawnedBossAt     = new Set();
  let _lastBossSpawnTime = -Infinity;

  function _randomOffscreenPosition(player) {
    const margin = 80;
    const w = GameConfig.canvasWidth  + margin * 2;
    const h = GameConfig.canvasHeight + margin * 2;

    const side = Math.floor(Math.random() * 4);
    let x, y;
    switch (side) {
      case 0: x = randomRange(-margin, w - margin); y = -margin;        break;
      case 1: x = randomRange(-margin, w - margin); y = h - margin;     break;
      case 2: x = -margin;                          y = randomRange(-margin, h - margin); break;
      default:x = w - margin;                       y = randomRange(-margin, h - margin); break;
    }
    return {
      x: player.x + x - GameConfig.canvasWidth  / 2,
      y: player.y + y - GameConfig.canvasHeight / 2,
    };
  }

  return {
    update({ world: { elapsedTime, player, spawnQueue, deltaTime, playMode }, data: { waveData, bossData } }) {
      if (playMode !== 'playing') return;
      if (!player?.isAlive) return;

      // 보스 스폰
      if (bossData) {
        for (let b = 0; b < bossData.length; b++) {
          const boss = bossData[b];
          if (elapsedTime >= boss.at && !_spawnedBossAt.has(boss.at)) {
            _spawnedBossAt.add(boss.at);
            _lastBossSpawnTime = elapsedTime;
            const pos = _randomOffscreenPosition(player);
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

      const timeSinceBoss = elapsedTime - _lastBossSpawnTime;
      const isBossActive  = timeSinceBoss >= 0 && timeSinceBoss < BOSS_SUPPRESSION_DURATION;
      const effectiveRate = isBossActive
        ? activeWave.spawnPerSecond * BOSS_SPAWN_MULTIPLIER
        : activeWave.spawnPerSecond;

      _spawnAccumulator += effectiveRate * deltaTime;

      while (_spawnAccumulator >= 1) {
        _spawnAccumulator -= 1;
        const isElite = activeWave.eliteChance && Math.random() < activeWave.eliteChance;
        const pool    = isElite ? (activeWave.eliteIds ?? activeWave.enemyIds) : activeWave.enemyIds;
        if (!pool?.length) continue;
        const enemyId = randomPick(pool);
        const pos     = _randomOffscreenPosition(player);
        spawnQueue.push({ type: 'enemy', config: { enemyId, x: pos.x, y: pos.y } });
      }
    },

    reset() {
      _spawnAccumulator  = 0;
      _spawnedBossAt     = new Set();
      _lastBossSpawnTime = -Infinity;
    },

    getDebugInfo(elapsedTime) {
      const timeSinceBoss = elapsedTime - _lastBossSpawnTime;
      const isSuppressed  = timeSinceBoss >= 0 && timeSinceBoss < BOSS_SUPPRESSION_DURATION;
      return {
        hasBossSpawned:       _spawnedBossAt.size > 0,
        bossSpawnedAt:        _lastBossSpawnTime !== -Infinity ? _lastBossSpawnTime : null,
        isSuppressed,
        suppressionRemaining: isSuppressed ? (BOSS_SUPPRESSION_DURATION - timeSinceBoss) : 0,
      };
    },
  };
}

/**
 * @deprecated createSpawnSystem() 사용 권장
 */
export class SpawnSystem {
  constructor() {
    const impl = createSpawnSystem();
    this.update       = (ctx) => impl.update(ctx);
    this.reset        = ()    => impl.reset();
    this.getDebugInfo = (t)   => impl.getDebugInfo(t);
  }
}
