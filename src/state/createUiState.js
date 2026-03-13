/**
 * createUiState — UI 상태 생성
 */
export function createUiState() {
  return {
    /** HUD 표시 여부 */
    showHud: false,

    /** 레벨업 오버레이 */
    levelUp: {
      visible: false,
      choices: [],       // 업그레이드 선택지 배열
      onSelect: null,    // 선택 콜백
    },

    /** 결과 화면 */
    result: {
      visible: false,
      killCount: 0,
      survivalTime: 0,
      level: 1,
    },
  };
}
