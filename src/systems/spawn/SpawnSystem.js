import { randomPick, randomRange } from '../../utils/random.js';
import { GameConfig }              from '../../core/GameConfig.js';

/**
 * SpawnSystem — 시간 기반 적 스폰
 *
 * FIX(code): 싱글톤 상태 → PlayScene.enter() 에서 반드시 reset() 호출 필요
 * FIX(balance): 보스 등장 후 BOSS_SUPPRESSION_DURATION 동안 일반 스폰 억제
 */
const BOSS_SUPPRESSION_DURATION = 30;
const BOSS_SPAWN_MULTIPLIER     = 0.45;

export const SpawnSystem = {
  _spawnAccumulator: 0,
  _spawnedBossAt:    new Set(),
  _lastBossSpawnTime: -Infinity,

  reset() {
    this._spawnAccumulator  = 0;
    this._spawnedBossAt.clear();
    this._lastBossSpawnTime = -Infinity;
    console.debug('[SpawnSystem] reset 완료');
  },

  getDebugInfo(elapsedTime) {
    const timeSinceBoss = elapsedTime - this._lastBossSpawnTime;
    const isSuppressed  = timeSinceBoss >= 0 && timeSinceBoss < BOSS_SUPPRESSION_DURATION;
    return {
      hasBossSpawned:       this._lastBossSpawnTime > -Infinity,
      isSuppressed,
      suppressionRemaining: isSuppressed ? BOSS_SUPPRESSION_DURATION - timeSinceBoss : 0,
      bossSpawnedAt:        this._lastBossSpawnTime > -Infinity ? this._lastBossSpawnTime : null,
    };
  },

  update({ elapsedTime, waveData, bossData, player, spawnQueue, deltaTime }) {
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
  },

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
  },
};
