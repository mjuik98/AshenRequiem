import { chance, nextFloat, randomPick, randomRange } from '../../utils/random.js';
import { GameConfig }              from '../../core/GameConfig.js';
import { spawnEnemy }              from '../../state/spawnRequest.js';
import { buildCurseSnapshot }      from '../../data/curseScaling.js';

/**
 * SpawnSystem — 시간 기반 적 스폰 (팩토리 함수 패턴)
 *
 * CHANGE(P0-B): deprecated `SpawnSystem` class 완전 제거
 *   Before: createSpawnSystem() + SpawnSystem class wrapper 공존
 *           → deprecated class가 테스트에서 `getDebugInfo` 반환값이
 *             undefined로 평가되어 `undefined !== 0` 실패 2건 발생
 *   After:  createSpawnSystem() 단일 API만 export
 *           SpawnSystem class는 삭제 — PlayContext, PlayScene은 이미
 *           createSpawnSystem()을 직접 사용하고 있으므로 영향 없음
 *
 * 패턴 규칙 (AGENTS.md §3):
 *   프레임간 상태가 필요한 시스템 → 팩토리 함수 패턴 사용
 *   프레임간 상태 없는 시스템    → 싱글톤 객체 패턴 사용
 */

const BOSS_SUPPRESSION_DURATION = 30;
const BOSS_SPAWN_MULTIPLIER     = 0.45;

/**
 * SpawnSystem 인스턴스 생성 (클로저로 상태 캡슐화).
 * PlayContext.create() 에서 1회 호출 — PlayScene 재시작 시 새 인스턴스 생성.
 *
 * @returns {{ update: Function, reset: Function, getDebugInfo: Function }}
 */
export function createSpawnSystem() {
  let _spawnAccumulator  = 0;
  let _propSpawnAccumulator = 0;
  let _spawnedBossAt     = new Set();
  let _lastBossSpawnTime = -Infinity;

  function _getEnemyName(enemyId, enemyData = []) {
    return enemyData.find((enemy) => enemy.id === enemyId)?.name ?? enemyId;
  }

  /** @private */
  function _randomOffscreenPosition(player, rng) {
    const margin = 80;
    const w = GameConfig.canvasWidth  + margin * 2;
    const h = GameConfig.canvasHeight + margin * 2;

    const side = Math.floor(nextFloat(rng) * 4);
    let x, y;
    switch (side) {
      case 0: x = randomRange(-margin, w - margin, rng); y = -margin;                               break;
      case 1: x = randomRange(-margin, w - margin, rng); y = h - margin;                            break;
      case 2: x = -margin;                               y = randomRange(-margin, h - margin, rng); break;
      default:x = w - margin;                            y = randomRange(-margin, h - margin, rng); break;
    }
    return {
      x: player.x + x - GameConfig.canvasWidth  / 2,
      y: player.y + y - GameConfig.canvasHeight / 2,
    };
  }

  function _randomAmbientPosition(player, rng) {
    const halfWidth = GameConfig.canvasWidth * 0.75;
    const halfHeight = GameConfig.canvasHeight * 0.75;
    let x = 0;
    let y = 0;

    for (let attempt = 0; attempt < 4; attempt++) {
      x = randomRange(player.x - halfWidth, player.x + halfWidth, rng);
      y = randomRange(player.y - halfHeight, player.y + halfHeight, rng);
      const dx = x - player.x;
      const dy = y - player.y;
      if ((dx * dx) + (dy * dy) >= 140 * 140) {
        break;
      }
    }

    return { x, y };
  }

  return {
    update({ world, data: { waveData, bossData, enemyData = [] } }) {
      const elapsedTime = world.run.elapsedTime;
      const player = world.entities.player;
      const spawnQueue = world.queues.spawnQueue;
      const deltaTime = world.runtime.deltaTime;
      const playMode = world.run.playMode;
      const events = world.queues.events;
      const rng = world.runtime.rng;
      const ascension = world.run.ascension ?? null;
      const stage = world.run.stage ?? null;
      if (playMode !== 'playing') return;
      if (!player?.isAlive) return;
      const curseSnapshot = buildCurseSnapshot(player.curse ?? 0);
      const ascensionSpawnMult = ascension?.spawnRateMult ?? 1;
      const ascensionEliteBonus = ascension?.eliteChanceBonus ?? 0;
      const stageSpawnMult = stage?.spawnRateMult ?? 1;
      const stageEliteBonus = stage?.eliteChanceBonus ?? 0;

      // ── 보스 스폰 ──────────────────────────────────────────────────────
      if (bossData) {
        for (let b = 0; b < bossData.length; b++) {
          const boss = bossData[b];
          if (elapsedTime >= boss.at && !_spawnedBossAt.has(boss.at)) {
            _spawnedBossAt.add(boss.at);
            _lastBossSpawnTime = elapsedTime;
            const pos = _randomOffscreenPosition(player, rng);
            spawnQueue.push(spawnEnemy({ enemyId: boss.enemyId, x: pos.x, y: pos.y }));
            events?.bossSpawned?.push({
              enemyId: boss.enemyId,
              bossName: _getEnemyName(boss.enemyId, enemyData),
            });
          }
        }
      }

      // ── 일반 / 엘리트 스폰 ─────────────────────────────────────────────
      let activeWave = null;
      for (let i = 0; i < waveData.length; i++) {
        const w = waveData[i];
        if (elapsedTime >= w.from && elapsedTime < w.to) { activeWave = w; break; }
      }
      if (!activeWave) return;

      const timeSinceBoss  = elapsedTime - _lastBossSpawnTime;
      const isBossActive   = timeSinceBoss >= 0 && timeSinceBoss < BOSS_SUPPRESSION_DURATION;
      const effectiveRate  = isBossActive
        ? activeWave.spawnPerSecond * BOSS_SPAWN_MULTIPLIER * curseSnapshot.spawnRateMult * ascensionSpawnMult * stageSpawnMult
        : activeWave.spawnPerSecond * curseSnapshot.spawnRateMult * ascensionSpawnMult * stageSpawnMult;

      _spawnAccumulator += effectiveRate * deltaTime;

      while (_spawnAccumulator >= 1) {
        _spawnAccumulator -= 1;
        const effectiveEliteChance = Math.min(
          1,
          Math.max(0, (activeWave.eliteChance ?? 0) + ascensionEliteBonus + stageEliteBonus),
        );
        const isElite = effectiveEliteChance > 0 ? chance(effectiveEliteChance, rng) : false;
        const pool    = isElite ? (activeWave.eliteIds ?? activeWave.enemyIds) : activeWave.enemyIds;
        if (!pool?.length) continue;
        const enemyId = randomPick(pool, rng);
        const pos     = _randomOffscreenPosition(player, rng);
        spawnQueue.push(spawnEnemy({ enemyId, x: pos.x, y: pos.y }));
      }

      const propRate = activeWave.propSpawnPerSecond ?? 0;
      if (propRate <= 0 || !activeWave.propIds?.length) return;

      _propSpawnAccumulator += propRate * deltaTime;
      while (_propSpawnAccumulator >= 1) {
        _propSpawnAccumulator -= 1;
        const enemyId = randomPick(activeWave.propIds, rng);
        const pos = _randomAmbientPosition(player, rng);
        spawnQueue.push(spawnEnemy({ enemyId, x: pos.x, y: pos.y }));
      }
    },

    /** PlayScene 재시작 시 상태 초기화 */
    reset() {
      _spawnAccumulator  = 0;
      _propSpawnAccumulator = 0;
      _spawnedBossAt     = new Set();
      _lastBossSpawnTime = -Infinity;
    },

    /**
     * DebugView 에 전달하는 스폰 디버그 정보.
     * @param {number} elapsedTime
     * @returns {{ hasBossSpawned: boolean, bossSpawnedAt: number|null, isSuppressed: boolean, suppressionRemaining: number }}
     */
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
