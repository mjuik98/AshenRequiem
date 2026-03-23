#!/usr/bin/env node
/**
 * scripts/validateData.js — 데이터 무결성 검증
 *
 * CHANGE(P0-①): KNOWN_WEAPON_BEHAVIORS 하드코딩 제거
 *   Before: const KNOWN_WEAPON_BEHAVIORS = new Set(['targetProjectile', 'orbit', 'areaBurst']);
 *           → 새 behaviorId 추가 시 이 파일도 수동 업데이트 필요 (드리프트 위험)
 *   After:  weaponBehaviorRegistry에서 getRegisteredBehaviorIds()를 import해 자동 동기화
 *           → 레지스트리에 등록하면 즉시 검증 목록에 반영됨
 *
 * FIX(Q-③): KNOWN_ENEMY_BEHAVIORS에 'dash', 'circle_dash' 추가
 *   Before: new Set([...listEnemyBehaviors()])
 *           → elite_golem/elite_bat(dash), elite_skeleton/boss_lich(circle_dash) 경고 발생
 *   After:  new Set([...listEnemyBehaviors(), 'dash', 'circle_dash'])
 *           → EliteBehaviorSystem 전용 행동 패턴 예외 처리로 경고 제거
 */

import { getRegisteredBehaviorIds } from '../src/behaviors/weaponBehaviorRegistry.js';
import { listEnemyBehaviors }       from '../src/behaviors/enemyBehaviors/enemyBehaviorRegistry.js';
import { validateCoreGameData }     from '../src/data/gameDataValidation.js';

let errors   = 0;
let warnings = 0;

function err(msg)  { console.error(`  ✗ ${msg}`);   errors++; }
function warn(msg) { console.warn(`  ⚠ ${msg}`);    warnings++; }
function ok(msg)   { console.log(`  ✓ ${msg}`); }

// ── 레지스트리에서 동적으로 로드 ─────────────────────────────────────
// 추가/삭제 시 이 파일 수정 불필요 — 레지스트리만 관리하면 됨
const KNOWN_WEAPON_BEHAVIORS = getRegisteredBehaviorIds();

// FIX(Q-③): 'dash', 'circle_dash'는 EliteBehaviorSystem 전용 행동 패턴으로
// enemyBehaviorRegistry에 등록하지 않고 EliteBehaviorSystem이 직접 처리함.
// validateData에서만 예외로 허용 목록에 추가한다.
const KNOWN_ENEMY_BEHAVIORS  = new Set([...listEnemyBehaviors(), 'dash', 'circle_dash']);

function checkNoDuplicateIds(arr, label) {
  const seen = new Set();
  for (const item of arr) {
    if (!item.id) { err(`${label}: id가 없는 항목 발견`); continue; }
    if (seen.has(item.id)) err(`${label}: 중복 id "${item.id}"`);
    else seen.add(item.id);
  }
}

function getIds(arr) {
  return new Set(arr.map(x => x.id).filter(Boolean));
}

async function loadData() {
  const [
    { enemyData },
    { weaponData },
    { upgradeData },
    { waveData },
    { statusEffectData },
    { synergyData },
  ] = await Promise.all([
    import('../src/data/enemyData.js'),
    import('../src/data/weaponData.js'),
    import('../src/data/upgradeData.js'),
    import('../src/data/waveData.js'),
    import('../src/data/statusEffectData.js'),
    import('../src/data/synergyData.js'),
  ]);

  return { enemyData, weaponData, upgradeData, waveData, statusEffectData, synergyData };
}

function validateEnemyData(enemyData) {
  console.log('\n[enemyData]');
  checkNoDuplicateIds(enemyData, 'enemyData');

  const enemyIds = getIds(enemyData);
  const required = ['id', 'name', 'hp', 'moveSpeed', 'damage', 'xpValue', 'radius'];

  for (const e of enemyData) {
    for (const field of required) {
      if (e[field] === undefined || e[field] === null) {
        err(`enemy "${e.id}": 필수 필드 "${field}" 없음`);
      }
    }
    if (e.hp <= 0)          err(`enemy "${e.id}": hp(${e.hp}) <= 0`);
    if (e.moveSpeed < 0)    err(`enemy "${e.id}": moveSpeed(${e.moveSpeed}) < 0`);
    if (e.radius <= 0)      err(`enemy "${e.id}": radius(${e.radius}) <= 0`);

    if (e.behaviorId && !KNOWN_ENEMY_BEHAVIORS.has(e.behaviorId)) {
      warn(`enemy "${e.id}": behaviorId "${e.behaviorId}"가 레지스트리에 없음 (오타 확인)`);
    }
    if (e.deathSpawn) {
      if (!enemyIds.has(e.deathSpawn.enemyId)) {
        err(`enemy "${e.id}": deathSpawn.enemyId "${e.deathSpawn.enemyId}" 존재하지 않음`);
      }
    }
  }
  ok(`총 ${enemyData.length}개 검증 완료`);
}

function validateWeaponData(weaponData) {
  console.log('\n[weaponData]');

  const required = ['id', 'name', 'damage', 'cooldown', 'behaviorId', 'maxLevel'];

  for (const w of weaponData) {
    for (const field of required) {
      if (w[field] === undefined || w[field] === null) {
        err(`weapon "${w.id}": 필수 필드 "${field}" 없음`);
      }
    }
    if (w.cooldown <= 0)  err(`weapon "${w.id}": cooldown(${w.cooldown}) <= 0`);
    if (w.damage  < 0)    err(`weapon "${w.id}": damage(${w.damage}) < 0`);

    // CHANGE(P0-①): 레지스트리에서 동적으로 검증 — 하드코딩 불필요
    if (w.behaviorId && !KNOWN_WEAPON_BEHAVIORS.has(w.behaviorId)) {
      warn(`weapon "${w.id}": behaviorId "${w.behaviorId}"가 레지스트리에 없음 (오타 또는 미등록)`);
    }
  }
  ok(`총 ${weaponData.length}개 검증 완료`);
}

function validateUpgradeData(upgradeData) {
  console.log('\n[upgradeData]');

  for (const u of upgradeData) {
    if (!u.id)   { err(`upgrade: id 없음`); continue; }
    if (!u.name) err(`upgrade "${u.id}": name 없음`);

    // FIX(Q-⑤): u.type === 'weapon' 은 항상 false였음
    //   실제 값은 'weapon_new' 또는 'weapon_upgrade'
    if (u.type === 'weapon_new' || u.type === 'weapon_upgrade') {
      if (!u.weaponId) {
        err(`upgrade "${u.id}": type="${u.type}"인데 weaponId 없음`);
      }
    }

    if (u.maxCount !== undefined && u.maxCount < 1) {
      warn(`upgrade "${u.id}": maxCount(${u.maxCount}) < 1`);
    }
  }
  ok(`총 ${upgradeData.length}개 검증 완료`);
}

function validateSynergyData(synergyData, upgradeData, weaponData) {
  console.log('\n[synergyData]');
  checkNoDuplicateIds(synergyData, 'synergyData');

  const upgradeIds = getIds(upgradeData);
  const weaponIds  = getIds(weaponData);

  for (const s of synergyData) {
    if (!s.id)      { err(`synergy: id 없음`); continue; }
    if (!s.name)    err(`synergy "${s.id}": name 없음`);
    if (!s.requires || s.requires.length < 2) {
      warn(`synergy "${s.id}": requires 항목이 2개 미만 — 시너지 의미 없음`);
    }
    for (const reqId of (s.requires ?? [])) {
      if (!upgradeIds.has(reqId) && !weaponIds.has(reqId)) {
        warn(`synergy "${s.id}": requires "${reqId}"가 upgradeData 및 weaponData에 없음`);
      }
    }
    if (!s.bonus || Object.keys(s.bonus).length === 0) {
      warn(`synergy "${s.id}": bonus가 비어있음`);
    }
  }
  ok(`총 ${synergyData.length}개 검증 완료`);
}

function validateWaveData(waveData, enemyData) {
  console.log('\n[waveData]');
  const enemyIds = getIds(enemyData);

  for (const w of waveData) {
    if (w.spawnPerSecond <= 0) err(`wave [${w.from}~${w.to}]: spawnPerSecond <= 0`);
    for (const eid of (w.enemyIds ?? [])) {
      if (!enemyIds.has(eid)) {
        err(`wave [${w.from}~${w.to}]: enemyId "${eid}" 존재하지 않음`);
      }
    }
  }
  ok(`총 ${waveData.length}개 검증 완료`);
}

async function main() {
  console.log('=== 데이터 무결성 검증 시작 ===');
  console.log(`등록된 무기 behaviorId: [${[...KNOWN_WEAPON_BEHAVIORS].join(', ')}]`);
  console.log(`등록된 적 behaviorId:   [${[...KNOWN_ENEMY_BEHAVIORS].join(', ')}]`);

  let data;
  try {
    data = await loadData();
  } catch (e) {
    console.error('데이터 로드 실패:', e.message);
    process.exit(1);
  }

  const coreReport = validateCoreGameData({
    upgradeData: data.upgradeData,
    weaponData: data.weaponData,
    waveData: data.waveData,
  });
  coreReport.errors.forEach((message) => err(message.replace('[validate] ', '')));
  coreReport.warnings.forEach((message) => warn(message.replace('[validate] ', '')));

  validateEnemyData(data.enemyData);
  validateWeaponData(data.weaponData);
  validateUpgradeData(data.upgradeData);
  validateSynergyData(data.synergyData, data.upgradeData, data.weaponData);
  validateWaveData(data.waveData, data.enemyData);

  console.log('\n=== 결과 ===');
  if (errors > 0)   console.error(`오류 ${errors}개`);
  if (warnings > 0) console.warn(`경고 ${warnings}개`);
  if (errors === 0 && warnings === 0) console.log('모든 검증 통과 ✓');

  process.exit(errors > 0 ? 1 : 0);
}

main();
