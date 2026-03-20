/**
 * IRenderer - 렌더러 추상화 인터페이스
 * 
 * 게임 로직(System)은 구체적인 Canvas 2D API나 WebGL API를 몰라야 합니다.
 * 이 인터페이스 규격을 따르는 구현체를 Game 초기화 시 주입하여,
 * 향후 렌더링 백엔드 교체를 용이하게 합니다.
 */
export class IRenderer {
  /**
   * 프레임 시작 전 화면을 지웁니다.
   */
  clear() {}

  /**
   * 배경을 그립니다.
   * @param {object} camera 
   */
  drawBackground(camera) {}

  /**
   * 픽업 아이템 목록을 그립니다.
   * @param {object[]} pickups 
   * @param {object} camera 
   */
  drawPickups(pickups, camera) {}

  /**
   * 적 목록을 그립니다.
   * @param {object[]} enemies 
   * @param {object} camera 
   * @param {number} timestamp 
   */
  drawEnemies(enemies, camera, timestamp) {}

  /**
   * 투사체 목록을 그립니다.
   * @param {object[]} projectiles 
   * @param {object} camera 
   * @param {boolean} lowQuality 
   */
  drawProjectiles(projectiles, camera, lowQuality) {}

  /**
   * 플레이어를 그립니다.
   * @param {object} player 
   * @param {object} camera 
   */
  drawPlayer(player, camera) {}

  /**
   * 이펙트 목록을 그립니다.
   * 데미지 텍스트는 내부적으로 별도 레이어(최상단)로 분리되어 처리될 수 있습니다.
   * @param {object[]} effects 
   * @param {object} camera 
   * @param {number} dpr 
   */
  drawEffects(effects, camera, dpr) {}

  /**
   * 렌더러 품질 최적화 모드를 설정합니다.
   * @param {boolean} lowQuality 글로우 비활성화 등 
   */
  setQuality(lowQuality) {}
}
