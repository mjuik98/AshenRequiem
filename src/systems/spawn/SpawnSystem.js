import { randomPick, randomRange } from '../../utils/random.js';
import { GameConfig } from '../../core/GameConfig.js';

/**
 * SpawnSystem — 시간 기반 적 스폰
 *
 * 계약:
 *   입력: elapsedTime, waveData, bossData, player 위치, spawnQueue, deltaTime
 *   쓰기: 직접 배열 삽입 금지
 *   출력: spawnQueue에 적 생성 요청
 *
 * 보스: bossData[].at 시각에 1회만 스폰
 * 엘리트: waveData[].eliteChance 확률로 일반 적 대신 엘리트 스폰
 */
export const SpawnSystem = {
  _spawnAccumulator: 0,
  /** @type {Set<number>} 이미 스폰된 보스 at 값 */
  _spawnedBossAt: new Set(),

  reset() {
    this._spawnAccumulator = 0;
    this._spawnedBossAt.clear();
  },

  update({ elapsedTime, waveData, bossData, player, spawnQueue, deltaTime }) {
    if (!player || !player.isAlive) return;

    // ─── 보스 스폰 (타이밍 기반, 1회) ───────────────────────
    if (bossData) {
      for (let b = 0; b < bossData.length; b++) {
        const boss = bossData[b];
        if (elapsedTime >= boss.at && !this._spawnedBossAt.has(boss.at)) {
          this._spawnedBossAt.add(boss.at);
          const pos = this._randomOffscreenPosition(player);
          spawnQueue.push({ type: 'enemy', config: { enemyId: boss.enemyId, x: pos.x, y: pos.y } });
        }
      }
    }

    // ─── 일반/엘리트 스폰 ────────────────────────────────────
    let activeWave = null;
    for (let i = 0; i < waveData.length; i++) {
      const w = waveData[i];
      if (elapsedTime >= w.from && elapsedTime < w.to) { activeWave = w; break; }
    }
    if (!activeWave) return;

    this._spawnAccumulator += activeWave.spawnPerSecond * deltaTime;

    while (this._spawnAccumulator >= 1) {
      this._spawnAccumulator -= 1;

      let enemyId;
      if (
        activeWave.eliteChance > 0 &&
        activeWave.eliteIds?.length > 0 &&
        Math.random() < activeWave.eliteChance
      ) {
        enemyId = randomPick(activeWave.eliteIds);
      } else {
        enemyId = randomPick(activeWave.enemyIds);
      }

      const pos = this._randomOffscreenPosition(player);
      spawnQueue.push({ type: 'enemy', config: { enemyId, x: pos.x, y: pos.y } });
    }
  },

  /** 화면 밖 랜덤 위치 생성 */
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
      default: x = player.x + halfW; y = player.y + randomRange(-halfH, halfH); break;
    }
    return { x, y };
  },
};
