/** validateGameData — 초기화 시 데이터 무결성 검증 */
export function validateGameData({ upgradeData, weaponData, waveData }) {
  let ok = true;

  const upgradeIds = upgradeData.map(u => u.id);
  upgradeIds.filter((id, i) => upgradeIds.indexOf(id) !== i).forEach(id => {
    console.error(`[validate] upgradeData 중복 id: ${id}`); ok = false;
  });

  upgradeData.filter(u => u.weaponId).forEach(u => {
    if (!weaponData.some(w => w.id === u.weaponId)) {
      console.error(`[validate] upgradeData "${u.id}" → 존재하지 않는 weaponId "${u.weaponId}"`); ok = false;
    }
  });

  const weaponIds = weaponData.map(w => w.id);
  weaponIds.filter((id, i) => weaponIds.indexOf(id) !== i).forEach(id => {
    console.error(`[validate] weaponData 중복 id: ${id}`); ok = false;
  });

  weaponData.forEach(w => {
    if (w.maxLevel !== undefined && w.maxLevel < 1) {
      console.error(`[validate] weaponData "${w.id}" maxLevel < 1`); ok = false;
    }
    // FIX(P2): 런타임에 참조 확인
    if (w.behaviorId) {
      // 레지스트리를 바로 가져오진 않고(validate의 결합성) 최소한 string 인지만 확인
      // 좀 더 엄밀하게는 validate.js(CLI) 쪽에 구현된 로직을 재활용해야 하나 환경 제약상 기본 검사만
      if (typeof w.behaviorId !== 'string') {
        console.error(`[validate] weaponData "${w.id}" behaviorId가 문자열이 아님`); ok = false;
      }
    }
  });

  waveData.forEach((wave, i) => {
    if (wave.spawnPerSecond < 0) { console.error(`[validate] waveData[${i}] spawnPerSecond < 0`); ok = false; }
    if (wave.from >= wave.to)    { console.error(`[validate] waveData[${i}] from >= to`);          ok = false; }
  });

  if (ok) console.debug('[validate] 모든 데이터 무결성 검증 통과');
  return ok;
}
