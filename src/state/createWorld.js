/**
 * src/state/createWorld.js
 *
 * CHANGE: chestRewardQueue, pendingLevelUpType 필드 추가
 *   - chestRewardQueue  : 처리 대기 중인 상자 보상 횟수
 *   - pendingLevelUpType: 현재 레벨업 UI의 원인 ('levelup' | 'chest' | null)
 */

import { EVENT_TYPES }        from '../data/constants/events.js';
import { createSynergyState }  from './createSynergyState.js';
import { createRng }           from '../utils/random.js';

/** createWorld — 월드 상태 초기화 */
export function createWorld() {
  const events = {};
  for (const type of EVENT_TYPES) events[type] = [];

  return {
    // ── 엔티티 ────────────────────────────────────────────────────────
    player:      null,
    enemies:     [],
    projectiles: [],
    effects:     [],
    pickups:     [],

    // ── 이벤트 큐 (frame-local) ───────────────────────────────────────
    events,

    // ── 스폰 요청 버퍼 ────────────────────────────────────────────────
    spawnQueue: [],

    // ── 카메라 상태 ───────────────────────────────────────────────────
    camera: { x: 0, y: 0, targetX: 0, targetY: 0 },

    // ── 난수 소스 (런타임 주입 가능) ──────────────────────────────────
    rng: createRng(),

    // ── 프레임 시간 ───────────────────────────────────────────────────
    deltaTime: 0,

    // ── 게임 진행 메타 ────────────────────────────────────────────────
    elapsedTime: 0,
    killCount:   0,
    runCurrencyEarned: 0,
    bossKillCount: 0,
    playMode:    'playing',
    runOutcome:  null,

    // ── 업그레이드 대기열 ─────────────────────────────────────────────
    pendingUpgrade:        null,
    pendingLevelUpChoices: null,
    runRerollsRemaining:   0,
    runBanishesRemaining:  0,
    banishedUpgradeIds:    [],
    levelUpActionMode:     'select',

    /**
     * 현재 레벨업 UI의 원인.
     * 'levelup' = 경험치 레벨업 / 'chest' = 상자 보상 / null = 없음
     * @type {'levelup'|'chest'|null}
     */
    pendingLevelUpType: null,

    /**
     * 처리 대기 중인 상자 보상 횟수.
     * chestRewardHandler에서 증가, LevelSystem에서 감소.
     */
    chestRewardQueue: 0,

    // ── 시너지 추적 상태 ──────────────────────────────────────────────
    synergyState: createSynergyState(),
  };
}
