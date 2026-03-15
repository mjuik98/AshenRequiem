export function createUiState() {
  return {
    showHud: false,
    levelUp: { visible: false, choices: [], onSelect: null },
    result:  { visible: false, killCount: 0, survivalTime: 0, level: 1 },
  };
}
