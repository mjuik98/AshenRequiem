/**
 * src/utils/spawnUtils.js — 스폰 위치 계산 유틸리티
 *
 * 개선 P2-6: SpawnSystem 내 _randomOffscreenPosition() 인라인 로직 추출
 *
 * Before:
 *   _randomOffscreenPosition(player) 가 SpawnSystem 내부에만 존재.
 *   향후 BossSpawnSystem, 이벤트 스폰 등 다른 스폰 시스템이
 *   동일 로직을 복붙해야 하는 구조.
 *
 * After:
 *   공유 유틸로 추출 — 모든 스폰 관련 시스템에서 import해 재사용 가능.
 */

import { GameConfig } from '../core/GameConfig.js';
import { randomRange } from './random.js';

/**
 * 플레이어 기준 화면 바깥 랜덤 위치를 월드 좌표로 반환한다.
 *
 * 상/하/좌/우 4면 중 하나의 바깥 임의 지점을 선택한다.
 * 반환값은 플레이어 위치 기준 화면 바깥 월드 좌표이다.
 *
 * @param {{ x: number, y: number }} player
 * @param {number} [margin=80]  화면 경계에서 얼마나 더 바깥에 스폰할지 (px)
 * @returns {{ x: number, y: number }}
 */
export function randomOffscreenPosition(player, margin = 80) {
  const w = GameConfig.canvasWidth  + margin * 2;
  const h = GameConfig.canvasHeight + margin * 2;

  const side = Math.floor(Math.random() * 4);
  let x, y;

  switch (side) {
    case 0:  // 위
      x = randomRange(-margin, w - margin);
      y = -margin;
      break;
    case 1:  // 아래
      x = randomRange(-margin, w - margin);
      y = h - margin;
      break;
    case 2:  // 왼쪽
      x = -margin;
      y = randomRange(-margin, h - margin);
      break;
    default: // 오른쪽
      x = w - margin;
      y = randomRange(-margin, h - margin);
      break;
  }

  return {
    x: player.x + x - GameConfig.canvasWidth  / 2,
    y: player.y + y - GameConfig.canvasHeight / 2,
  };
}
