import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import {
  buildStartLoadoutAdvancedSummary,
  buildStartLoadoutSeedPreviewText,
} from '../src/domain/meta/loadout/startLoadoutPresentation.js';

console.log('\n[StartLoadoutRuntime]');

const { test, summary } = createRunner('StartLoadoutRuntime');

let startLoadoutRuntime = null;

try {
  startLoadoutRuntime = await import('../src/domain/meta/loadout/startLoadoutDomain.js');
} catch (error) {
  startLoadoutRuntime = { error };
}

function getRuntime() {
  assert.ok(!startLoadoutRuntime.error, startLoadoutRuntime.error?.message ?? 'startLoadoutDomain import 실패');
  return startLoadoutRuntime;
}

test('start weapon selection runtime은 타이틀 후보와 선택 무기를 같은 기준으로 해석한다', () => {
  const { resolveStartWeaponSelection } = getRuntime();
  const resolved = resolveStartWeaponSelection({
    weaponData: [
      { id: 'magic_bolt', damage: 10, behaviorId: 'targetProjectile', isEvolved: false },
      { id: 'boomerang', damage: 14, behaviorId: 'boomerang', isEvolved: false },
      { id: 'solar_requiem', damage: 40, behaviorId: 'laserBeam', isEvolved: true },
      { id: 'debug_only', damage: 99, behaviorId: 'targetProjectile', isEvolved: false },
    ],
    unlockData: [
      { id: 'unlock_debug_only', targetType: 'weapon', targetId: 'debug_only' },
    ],
  }, {
    meta: {
      permanentUpgrades: {},
      selectedStartWeaponId: 'boomerang',
      unlockedWeapons: ['magic_bolt', 'boomerang'],
      unlockedAccessories: [],
    },
  });

  assert.deepEqual(
    resolved.availableStartWeapons.map((weapon) => weapon.id),
    ['magic_bolt', 'boomerang'],
    '타이틀 후보와 플레이 시작 무기 해석 기준이 분리되면 안 됨',
  );
  assert.equal(resolved.selectedStartWeaponId, 'boomerang');
  assert.equal('startWeapons' in resolved, false, 'selection runtime이 플레이 스폰 패키지까지 반환하면 안 됨');
  assert.equal('permanentUpgrades' in resolved, false, 'selection runtime이 영구 업그레이드까지 노출하면 안 됨');
});

test('start weapon selection runtime은 잘못된 선택값을 기본 시작 무기로 보정한다', () => {
  const { resolveStartWeaponSelection } = getRuntime();
  const resolved = resolveStartWeaponSelection({
    weaponData: [
      { id: 'magic_bolt', damage: 10, behaviorId: 'targetProjectile', isEvolved: false },
      { id: 'boomerang', damage: 14, behaviorId: 'boomerang', isEvolved: false },
    ],
    unlockData: [],
  }, {
    meta: {
      permanentUpgrades: {},
      selectedStartWeaponId: 'locked_weapon',
      unlockedWeapons: ['magic_bolt'],
      unlockedAccessories: [],
    },
  });

  assert.equal(resolved.selectedStartWeaponId, 'magic_bolt');
  assert.equal('startWeapons' in resolved, false, 'selection runtime이 플레이 시작 무기를 직접 조립하면 안 됨');
});

test('start weapon selection runtime은 주입된 weaponData 없이 정적 weaponData로 폴백하지 않는다', () => {
  const { resolveStartWeaponSelection } = getRuntime();
  const resolved = resolveStartWeaponSelection({
    weaponData: [],
    unlockData: [],
  }, {
    meta: {
      permanentUpgrades: {},
      selectedStartWeaponId: 'magic_bolt',
      unlockedWeapons: ['magic_bolt'],
      unlockedAccessories: [],
    },
  });

  assert.deepEqual(resolved.availableStartWeapons, [], '주입 데이터 없이 정적 weaponData를 읽으면 안 됨');
  assert.deepEqual(resolved.unlockedWeapons, ['magic_bolt'], '주입 데이터 없이 정적 기본 해금 규칙으로 unlockedWeapons를 부풀리면 안 됨');
});

test('공용 start loadout runtime은 시작 무기 해석과 해금 목록 계산에 같은 주입 데이터 소스를 사용한다', () => {
  const { resolveSelectedStartWeaponId } = getRuntime();
  const selectedWeaponId = resolveSelectedStartWeaponId({
    weaponData: [
      { id: 'magic_bolt', isEvolved: false },
      { id: 'fire_orb', isEvolved: false },
    ],
    unlockData: [
      { id: 'unlock_fire_orb', targetType: 'weapon', targetId: 'fire_orb' },
    ],
  }, {
    meta: {
      unlockedWeapons: ['magic_bolt'],
      selectedStartWeaponId: 'fire_orb',
      unlockedAccessories: [],
    },
  }, 'fire_orb');

  assert.equal(selectedWeaponId, 'magic_bolt', '선택 정규화가 별도 정적 unlock 규칙에 기대면 안 됨');
});

test('start weapon selection runtime은 표시용 seed preview와 advanced summary를 공용 presentation helper로 계산한다', () => {
  const { resolveStartWeaponSelection } = getRuntime();
  const resolved = resolveStartWeaponSelection({
    weaponData: [
      { id: 'magic_bolt', isEvolved: false },
    ],
    archetypeData: [
      { id: 'spellweaver', name: 'Spellweaver' },
    ],
    stageData: [
      { id: 'ember_hollow', name: 'Ember Hollow' },
    ],
    unlockData: [],
  }, {
    meta: {
      selectedStartWeaponId: 'magic_bolt',
      unlockedWeapons: ['magic_bolt'],
      unlockedAccessories: [],
      selectedAscensionLevel: 2,
      selectedArchetypeId: 'spellweaver',
      selectedStageId: 'ember_hollow',
      selectedSeedMode: 'custom',
      selectedSeedText: 'ashen-seed',
    },
  });

  assert.equal(
    resolved.seedPreviewText,
    buildStartLoadoutSeedPreviewText({
      seedMode: 'custom',
      seedText: 'ashen-seed',
    }),
    'seed preview text가 공용 presentation helper 규칙과 다름',
  );
  assert.equal(
    resolved.advancedSummary,
    buildStartLoadoutAdvancedSummary({
      ascensionChoices: resolved.ascensionChoices,
      selectedAscensionLevel: resolved.selectedAscensionLevel,
      archetypes: resolved.archetypes,
      selectedArchetypeId: resolved.selectedArchetypeId,
      stages: resolved.stages,
      selectedStageId: resolved.selectedStageId,
    }),
    'advanced summary가 공용 presentation helper 규칙과 다름',
  );
});

summary();
