#!/usr/bin/env node
/**
 * scripts/validateData.js — 데이터 무결성 검증
 *
 * ▶ 다운로드 개선판의 로직을 통합하여 검증 항목 강화
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

let errors   = 0;
let warnings = 0;

function err(msg)  { console.error(`  ✗ ${msg}`);   errors++; }
function warn(msg) { console.warn(`  ⚠ ${msg}`);    warnings++; }
function ok(msg)   { console.log(`  ✓ ${msg}`); }

// 알려진 behaviorId 목록 (레지스트리와 동기화)
const KNOWN_WEAPON_BEHAVIORS = new Set(['targetProjectile', 'orbit', 'areaBurst']);
const KNOWN_ENEMY_BEHAVIORS  = new Set(['chase', 'charge', 'circle', 'keepDistance', 'swarm', 'dash', 'circle_dash']);

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
  ] = await Promise.all([
    import('../src/data/enemyData.js'),
    import('../src/data/weaponData.js'),
    import('../src/data/upgradeData.js'),
    import('../src/data/waveData.js'),
    import('../src/data/statusEffectData.js'),
  ]);

  return { enemyData, weaponData, upgradeData, waveData, statusEffectData };
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
  checkNoDuplicateIds(weaponData, 'weaponData');

  const required = ['id', 'name', 'damage', 'cooldown', 'behaviorId', 'maxLevel'];

  for (const w of weaponData) {
    for (const field of required) {
      if (w[field] === undefined || w[field] === null) {
        err(`weapon "${w.id}": 필수 필드 "${field}" 없음`);
      }
    }
    if (w.cooldown <= 0)  err(`weapon "${w.id}": cooldown은 양수여야 함`);
    if (w.maxLevel < 1)   err(`weapon "${w.id}": maxLevel은 1 이상이어야 함`);
    if (w.damage < 0)     err(`weapon "${w.id}": damage는 0 이상이어야 함`);
    
    if (w.behaviorId && !KNOWN_WEAPON_BEHAVIORS.has(w.behaviorId)) {
      warn(`weapon "${w.id}": behaviorId "${w.behaviorId}"가 레지스트리에 없음 (오타 확인)`);
    }
  }
  ok(`총 ${weaponData.length}개 검증 완료`);
}

function validateUpgradeData(upgradeData, weaponIds) {
  console.log('\n[upgradeData]');
  checkNoDuplicateIds(upgradeData, 'upgradeData');

  for (const u of upgradeData) {
    if (!u.id)          { err(`upgrade: id 없음`); continue; }
    if (!u.type)        err(`upgrade "${u.id}": type 없음`);
    if (!u.name)        err(`upgrade "${u.id}": name 없음`);
    if (u.maxLevel < 1) err(`upgrade "${u.id}": maxLevel은 1 이상이어야 함`);

    if (u.type === 'weapon' && u.weaponId) {
      if (!weaponIds.has(u.weaponId)) {
        err(`upgrade "${u.id}": weaponId "${u.weaponId}" 존재하지 않음`);
      }
    }
  }
  ok(`총 ${upgradeData.length}개 검증 완료`);
}

function validateWaveData(waveData, enemyIds) {
  console.log('\n[waveData]');

  for (let i = 0; i < waveData.length; i++) {
    const w = waveData[i];
    const label = `waveData[${i}]`;

    if (w.from >= w.to)          err(`${label}: from(${w.from}) >= to(${w.to})`);
    if (w.spawnPerSecond < 0)    err(`${label}: spawnPerSecond는 0 이상이어야 함`);
    
    for (const enemyId of (w.enemyIds ?? [])) {
      if (!enemyIds.has(enemyId)) {
        err(`${label}: enemyPool에 "${enemyId}" 존재하지 않음`);
      }
    }
  }
  ok(`총 ${waveData.length}개 검증 완료`);
}

function validateStatusEffectData(statusEffectData) {
  console.log('\n[statusEffectData]');
  const entries = Object.values(statusEffectData);
  checkNoDuplicateIds(entries, 'statusEffectData');
  ok(`총 ${entries.length}개 검증 완료`);
}

async function main() {
  console.log('╔══════════════════════════════════════╗');
  console.log('║   AshenRequiem 데이터 검증             ║');
  console.log('╚══════════════════════════════════════╝');

  let data;
  try {
    data = await loadData();
  } catch (e) {
    console.error('\n[FATAL] 데이터 파일 로드 실패:', e.message);
    process.exit(1);
  }

  const { enemyData, weaponData, upgradeData, waveData, statusEffectData } = data;
  const enemyIds  = getIds(enemyData);
  const weaponIds = getIds(weaponData);

  validateEnemyData(enemyData);
  validateWeaponData(weaponData);
  validateUpgradeData(upgradeData, weaponIds);
  validateWaveData(waveData, enemyIds);
  validateStatusEffectData(statusEffectData);

  console.log('\n══════════════════════════════════════');
  if (errors > 0) {
    console.error(`결과: ✗ ${errors}개 오류, ${warnings}개 경고`);
    process.exit(1);
  } else {
    console.log(`결과: ✓ 오류 없음 (경고 ${warnings}개)`);
    process.exit(0);
  }
}

main();
