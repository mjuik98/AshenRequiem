/**
 * validateGameData — 게임 데이터 초기화 시 무결성 검증
 *
 * SAFETY(refactor): 데이터 id 중복, weaponId 존재 여부, 필수 수치 범위를 초기화 시 1회 검사.
 *   이전: 오타 있는 id / weaponId 는 런타임 중 조용히 undefined 접근 또는 잘못된 선택지 제공.
 *   이후: Game 또는 main.js 초기화 시 validateGameData() 1회 호출 → 문제 즉시 콘솔 노출.
 *
 * 사용법:
 *   import { validateGameData } from '../utils/validateGameData.js';
 *   validateGameData({ upgradeData, weaponData, waveData }); // 개발 빌드에서만 호출 권장
 *
 * 검증 항목:
 *   - upgradeData id 중복
 *   - upgradeData.weaponId 가 weaponData 에 실제 존재하는가
 *   - weaponData id 중복
 *   - weaponData maxLevel >= 1
 *   - waveData spawnPerSecond >= 0
 *   - waveData from < to
 */
export function validateGameData({ upgradeData, weaponData, waveData }) {
  let hasError = false;

  // ── upgradeData id 중복 검사 ─────────────────────────────
  const upgradeIds = upgradeData.map(u => u.id);
  const upgradeDupes = upgradeIds.filter((id, i) => upgradeIds.indexOf(id) !== i);
  if (upgradeDupes.length > 0) {
    console.error('[validateGameData] upgradeData 중복 id:', upgradeDupes);
    hasError = true;
  }

  // ── upgradeData.weaponId 참조 검사 ───────────────────────
  upgradeData
    .filter(u => u.weaponId)
    .forEach(u => {
      const exists = weaponData.some(w => w.id === u.weaponId);
      if (!exists) {
        console.error(`[validateGameData] upgradeData "${u.id}" 가 존재하지 않는 weaponId "${u.weaponId}" 를 참조합니다.`);
        hasError = true;
      }
    });

  // ── weaponData id 중복 검사 ──────────────────────────────
  const weaponIds = weaponData.map(w => w.id);
  const weaponDupes = weaponIds.filter((id, i) => weaponIds.indexOf(id) !== i);
  if (weaponDupes.length > 0) {
    console.error('[validateGameData] weaponData 중복 id:', weaponDupes);
    hasError = true;
  }

  // ── weaponData maxLevel >= 1 ─────────────────────────────
  weaponData.forEach(w => {
    if (w.maxLevel !== undefined && w.maxLevel < 1) {
      console.error(`[validateGameData] weaponData "${w.id}" maxLevel(${w.maxLevel}) < 1`);
      hasError = true;
    }
  });

  // ── waveData 수치 범위 검사 ──────────────────────────────
  waveData.forEach((wave, idx) => {
    if (wave.spawnPerSecond < 0) {
      console.error(`[validateGameData] waveData[${idx}] spawnPerSecond(${wave.spawnPerSecond}) < 0`);
      hasError = true;
    }
    if (wave.from >= wave.to) {
      console.error(`[validateGameData] waveData[${idx}] from(${wave.from}) >= to(${wave.to})`);
      hasError = true;
    }
  });

  if (!hasError) {
    console.debug('[validateGameData] 모든 데이터 무결성 검증 통과');
  }

  return !hasError;
}
