/**
 * src/systems/camera/CameraSystem.js — 플레이어 중심 카메라 (위치 계산 전담)
 *
 * CHANGE(P1-C): camera.width/height 설정 제거
 *   Before: CameraSystem(priority 120)이 camera.width/height를 직접 설정
 *           → WorldTickSystem(priority 0)이 이미 동일한 값을 설정하므로 중복
 *           → 같은 프레임에 두 번 GameConfig를 읽고 두 번 같은 필드를 덮어씀
 *   After:  CameraSystem은 카메라 x/y 위치 계산만 담당 (단일 책임)
 *           camera.width/height는 WorldTickSystem(priority 0)이 단독 관리
 *
 * 실행 순서:
 *   priority 0:   WorldTickSystem  → camera.width/height 설정
 *   priority 120: CameraSystem     → camera.x/y 위치 계산 (width/height 읽음)
 */
export const CameraSystem = {
  update({ world: { player, camera } }) {
    if (!player) return;

    // camera.width/height는 WorldTickSystem이 이미 설정했으므로 그대로 참조
    camera.x = player.x - camera.width  / 2;
    camera.y = player.y - camera.height / 2;
  },
};
