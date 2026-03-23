/**
 * src/systems/event/chestRewardHandler.js — 상자 보상 핸들러
 *
 * chestCollected 이벤트를 수신하여 world.chestRewardQueue에 보상 횟수를 추가한다.
 *
 * 보상 횟수 확률:
 *   60% — 1회 (기본)
 *   30% — 2회 (추가 보상 1개)
 *   10% — 3회 (추가 보상 2개, 뱀파이어 서바이버 스타일)
 *
 * R-14 준수: session 접근 없음. world는 EventRegistry 핸들러 2번째 인수로 전달됨.
 */

/**
 * @param {import('./EventRegistry.js').EventRegistry} registry
 */
import { nextFloat } from '../../utils/random.js';

export function registerChestRewardHandler(registry) {
  if (!registry) return;

  registry.register('chestCollected', (_event, world) => {
    const roll = nextFloat(world?.rng);
    let count;
    if      (roll < 0.10) count = 3;   // 10% — 3회
    else if (roll < 0.40) count = 2;   // 30% — 2회
    else                  count = 1;   // 60% — 1회

    world.chestRewardQueue = (world.chestRewardQueue ?? 0) + count;
  });
}
