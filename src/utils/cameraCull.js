/**
 * cameraCull.js
 * 카메라 영역을 기반으로 엔티티의 가시성 및 충돌 대상 여부를 판단하는 유틸리티
 */

/**
 * 카메라의 현재 위치와 마진을 고려하여 컬링 경계 좌표를 계산합니다.
 * @param {object} camera - x, y 좌표를 가진 카메라 객체
 * @param {number} margin - 화면 밖 허용 마진(px)
 * @returns {object} { minX, maxX, minY, maxY } 형태의 경계 객체
 */
export function getCullBounds(camera, margin = 100) {
  // 기본적으로 캔버스 크기를 1280x720으로 가정 (또는 GameConfig 등에서 가져와야 함)
  // 여기서는 CollisionSystem의 기존 로직을 안전하게 대체하기 위해 보수적인 경계를 사용
  // 실제 프로젝트의 캔버스 크기에 맞춰 조정될 수 있도록 설계
  const width = window.innerWidth || 1280;
  const height = window.innerHeight || 720;

  return {
    minX: camera.x - margin,
    maxX: camera.x + width + margin,
    minY: camera.y - margin,
    maxY: camera.y + height + margin
  };
}

/**
 * 엔티티가 주어진 경계 내에 있는지 확인합니다.
 * @param {object} entity - x, y 및 radius를 가진 엔티티 객체
 * @param {object} bounds - getCullBounds에서 반환된 경계 객체
 * @returns {boolean} 영역 내에 있으면 true
 */
export function isInsideBounds(entity, bounds) {
  const r = entity.radius || 0;
  return (
    entity.x + r >= bounds.minX &&
    entity.x - r <= bounds.maxX &&
    entity.y + r >= bounds.minY &&
    entity.y - r <= bounds.maxY
  );
}
