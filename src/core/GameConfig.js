/** GameConfig — 전역 게임 설정 */
export const GameConfig = {
  /** 논리 해상도 (resize 시 갱신) */
  canvasWidth:  800,
  canvasHeight: 600,
  /** devicePixelRatio 대응 여부 */
  useDevicePixelRatio: true,
  /** deltaTime 상한 (탭 전환, 백그라운드 후 복귀 대비) */
  maxDeltaTime: 0.1,
};
