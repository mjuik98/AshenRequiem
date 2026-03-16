#!/usr/bin/env node
/**
 * scripts/validateData.js — 데이터 무결성 검증
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

let errors   = 0;
let warnings = 0;

function err(msg)  { console.error(`  [ERROR] ${msg}`);   errors++; }
function warn(msg) { console.warn(`  [WARN]  ${msg}`);    warnings++; }
function ok(msg)   { console.log(`  [OK]    ${msg}`); }

function checkNoDuplicateIds(arr, label) {
  const seen = new Set();
  for (const item of arr) {
    if (seen.has(item.id)) err(`${label}: 중복 id "${item.id}"`);
    seen.add(item.id);
  }
}

function getIds(arr) {
  return new Set(arr.map(x => x.id));
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
  }
  ok(`총 ${weaponData.length}개 검증 완료`);
}

function validateUpgradeData(upgradeData, weaponIds) {
  console.log('\n[upgradeData]');
  checkNoDuplicateIds(upgradeData, 'upgradeData');

  for (const u of upgradeData) {
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

    if (w.from >= w.to)          err(`${label}: from >= to`);
    
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
  console.log('=== Vamplike 데이터 검증 ===');

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

  if (errors > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main();
