/**
 * GameConfig — 전역 설정값
 */
export const GameConfig = {
  /** 캔버스 기본 해상도 (리사이즈 시 동적 변경) */
  canvasWidth: 1280,
  canvasHeight: 720,

  /** deltaTime 상한 (초). 탭 전환 후 폭발적 dt 방지 */
  maxDeltaTime: 0.1,

  /** devicePixelRatio 대응 */
  useDevicePixelRatio: true,
};
