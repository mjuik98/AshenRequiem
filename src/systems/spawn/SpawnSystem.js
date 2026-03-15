import { randomPick, randomRange } from '../../utils/random.js';
import { GameConfig } from '../../core/GameConfig.js';

/**
 * SpawnSystem — 시간 기반 적 스폰
 *
 * 계약:
 *   입력: elapsedTime, waveData, bossData, player 위치, spawnQueue, deltaTime
 *   쓰기: 직접 배열 삽입 금지
 *   출력: spawnQueue 에 적 생성 요청
 *
 * 보스: bossData[].at 시각에 1회만 스폰
 * 엘리트: waveData[].eliteChance 확률로 일반 적 대신 엘리트 스폰
 *
 * FIX(balance): 보스 등장 후 일정 시간(BOSS_SUPPRESSION_DURATION) 동안
 *   일반 스폰을 억제 (spawnPerSecond × BOSS_SPAWN_MULTIPLIER).
 *   이전: 보스 등장 중에도 일반 스폰율 그대로 유지 → 혼돈
 *   이후: 보스 등장 직후 30초는 스폰율 50%로 감소
 *
 * FIX(code): 모듈 레벨 싱글톤 상태 의존성 명시.
 *   PlayScene.enter() 에서 반드시 SpawnSystem.reset() 을 호출해야 함.
 *   (현재 구조상 인스턴스 기반으로 이전 시 영향 범위가 넓으므로 reset 방식 유지)
 */

/** 보스 등장 후 일반 스폰 억제 구간 (초) */
const BOSS_SUPPRESSION_DURATION = 30;
/** 억제 구간 중 spawnPerSecond 배율 */
const BOSS_SPAWN_MULTIPLIER = 0.45;

export const SpawnSystem = {
  /** @type {number} 누적 스폰 카운터 */
  _spawnAccumulator: 0,
  /** @type {Set<number>} 이미 스폰된 보스 at 값 */
  _spawnedBossAt: new Set(),
  /**
   * FIX(balance): 마지막 보스 스폰 시각 (elapsedTime 기준).
   * -Infinity 면 보스가 아직 등장하지 않음.
   */
  _lastBossSpawnTime: -Infinity,

  reset() {
    this._spawnAccumulator = 0;
    this._spawnedBossAt.clear();
    this._lastBossSpawnTime = -Infinity;
  },

  update({ elapsedTime, waveData, bossData, player, spawnQueue, deltaTime }) {
    if (!player || !player.isAlive) return;

    // ─── 보스 스폰 (타이밍 기반, 1회) ───────────────────────
    if (bossData) {
      for (let b = 0; b < bossData.length; b++) {
        const boss = bossData[b];
        if (elapsedTime >= boss.at && !this._spawnedBossAt.has(boss.at)) {
          this._spawnedBossAt.add(boss.at);
          // FIX: 보스 스폰 시각 기록
          this._lastBossSpawnTime = elapsedTime;
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

    // FIX(balance): 보스 활성 구간 판단 → 스폰율 감소
    const timeSinceLastBoss = elapsedTime - this._lastBossSpawnTime;
    const isBossActive = timeSinceLastBoss >= 0 && timeSinceLastBoss < BOSS_SUPPRESSION_DURATION;
    const effectiveRate = isBossActive
      ? activeWave.spawnPerSecond * BOSS_SPAWN_MULTIPLIER
      : activeWave.spawnPerSecond;

    this._spawnAccumulator += effectiveRate * deltaTime;

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
