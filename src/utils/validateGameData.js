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
  });

  waveData.forEach((wave, i) => {
    if (wave.spawnPerSecond < 0) { console.error(`[validate] waveData[${i}] spawnPerSecond < 0`); ok = false; }
    if (wave.from >= wave.to)    { console.error(`[validate] waveData[${i}] from >= to`);          ok = false; }
  });

  if (ok) console.debug('[validate] 모든 데이터 무결성 검증 통과');
  return ok;
}
