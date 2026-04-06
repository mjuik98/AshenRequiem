import { logRuntimeWarn } from '../utils/runtimeLogger.js';

/**
 * src/state/PlayMode.js — playMode 상태 전이 규칙 집중화
 *
 * 개선 P3-8: playMode 변경 책임이 여러 시스템에 분산된 문제 해결
 *
 * Before:
 *   world.run.playMode = 'levelup'   (LevelSystem.js)
 *   world.run.playMode = 'dead'      (DeathSystem.js)
 *   active run restore / scene resume가 직접 playing 상태를 되돌리기도 함
 *   → 허용된 전이가 어디에도 문서화되지 않음
 *   → 잘못된 전이(예: 'dead' → 'levelup')가 감지되지 않음
 *
 * After:
 *   transitionPlayMode(world, PlayMode.LEVELUP)
 *   → 전이 규칙 검증 포함
 *   → 허용되지 않은 전이 시 개발 환경에서 경고
 *   → 전이 규칙이 한 파일에 집중화되어 추적 용이
 */

/** @readonly */
export const PlayMode = Object.freeze({
  PLAYING: 'playing',
  LEVELUP: 'levelup',
  DEAD:    'dead',
  PAUSED:  'paused',
});

/**
 * 허용된 상태 전이 테이블
 * key: 현재 상태, value: 전이 가능한 상태 목록
 *
 * 상태 전이 다이어그램:
 *   playing ──► levelup ──► playing
 *   playing ──► dead    ──► playing
 *   playing ──► paused  ──► playing
 *   paused  ──────────────► dead    (백그라운드 사망 허용)
 *
 * @type {Record<string, string[]>}
 */
const ALLOWED_TRANSITIONS = {
  [PlayMode.PLAYING]: [PlayMode.LEVELUP, PlayMode.DEAD, PlayMode.PAUSED],
  [PlayMode.LEVELUP]: [PlayMode.PLAYING],
  [PlayMode.DEAD]:    [PlayMode.PLAYING],
  [PlayMode.PAUSED]:  [PlayMode.PLAYING, PlayMode.DEAD],
};

/**
 * playMode 상태를 안전하게 전이한다.
 *
 * 허용되지 않은 전이는 개발 환경에서 경고 후 그대로 적용한다(hard fail 없음).
 * 프로덕션 환경에서의 복원력을 위해 경고만 출력하고 전이는 수행한다.
 *
 * @param {{ run: { playMode: string } }} world
 * @param {string} nextMode  PlayMode 상수 중 하나
 */
export function transitionPlayMode(world, nextMode) {
  const currentMode = world?.run?.playMode;
  const allowed = ALLOWED_TRANSITIONS[currentMode];

  if (!allowed) {
    logRuntimeWarn('PlayMode', `알 수 없는 현재 상태: "${currentMode}"`);
  } else if (!allowed.includes(nextMode)) {
    logRuntimeWarn(
      'PlayMode',
      `허용되지 않은 전이: "${currentMode}" → "${nextMode}"`,
      `허용 전이: [${allowed.join(', ')}]`,
    );
  }

  world.run.playMode = nextMode;
}
