/**
 * mountUI — DOM UI 컨테이너 반환
 * PlayScene.enter() 마다 호출되어 #ui-container 를 반환한다.
 * 이전 자식 노드는 각 View 의 destroy() 에서 제거하므로 여기서는 클리어하지 않는다.
 */
export function mountUI() {
  return document.getElementById('ui-container');
}
