import assert from 'node:assert/strict';
import { test, summary } from './helpers/testRunner.js';
import { createPlayer } from '../src/entities/createPlayer.js';
import {
  applyPlayerPermanentUpgrades,
  applyPlayerArchetype,
  applyPlayerRiskRelic,
  resolvePlayerSpawnState,
} from '../src/app/play/playerSpawnApplicationService.js';

console.log('\n[StartWeapon]');

function makeGameData() {
  return {
    weaponData: [
      { id: 'magic_bolt', damage: 10, cooldown: 1, behaviorId: 'targetProjectile', isEvolved: false },
      { id: 'boomerang', damage: 14, cooldown: 1.2, behaviorId: 'boomerang', isEvolved: false },
      { id: 'solar_requiem', damage: 40, cooldown: 2.5, behaviorId: 'laserBeam', isEvolved: true },
    ],
    unlockData: [
      { id: 'unlock_boomerang', targetType: 'weapon', targetId: 'boomerang' },
    ],
  };
}

test('해금된 시작 무기 선택이 있으면 해당 무기로 시작한다', () => {
  const spawnState = resolvePlayerSpawnState({
    meta: {
      permanentUpgrades: {},
      selectedStartWeaponId: 'boomerang',
      unlockedWeapons: ['magic_bolt', 'boomerang'],
    },
  }, makeGameData());
  const player = createPlayer(0, 0, spawnState);
  applyPlayerPermanentUpgrades(player, spawnState.permanentUpgrades);

  assert.equal(player.weapons.length, 1, '시작 무기 수는 1개여야 함');
  assert.equal(player.weapons[0]?.id, 'boomerang', '선택한 시작 무기가 적용되지 않음');
});

test('잠겨 있거나 잘못된 시작 무기 선택은 magic_bolt로 대체된다', () => {
  const spawnState = resolvePlayerSpawnState({
    meta: {
      permanentUpgrades: {},
      selectedStartWeaponId: 'boomerang',
      unlockedWeapons: ['magic_bolt'],
    },
  }, makeGameData());
  const player = createPlayer(0, 0, spawnState);
  applyPlayerPermanentUpgrades(player, spawnState.permanentUpgrades);

  assert.equal(player.weapons.length, 1, '시작 무기 수는 1개여야 함');
  assert.equal(player.weapons[0]?.id, 'magic_bolt', '잠긴 시작 무기가 fallback 처리되지 않음');
});

test('영구 업그레이드의 저주 수치는 플레이어 기본 스탯에 반영된다', () => {
  const spawnState = resolvePlayerSpawnState({
    meta: {
      permanentUpgrades: { perm_curse: 2 },
      selectedStartWeaponId: 'magic_bolt',
      unlockedWeapons: ['magic_bolt'],
    },
  }, makeGameData());
  const player = createPlayer(0, 0, spawnState);
  applyPlayerPermanentUpgrades(player, spawnState.permanentUpgrades);

  assert.equal(player.curse, 0.16, 'perm_curse 영구 업그레이드가 플레이어 curse에 반영되지 않음');
});

test('영구 업그레이드의 데미지 배율은 시작 무기 스탯까지 같은 applicator에서 반영된다', () => {
  const spawnState = resolvePlayerSpawnState({
    meta: {
      permanentUpgrades: { perm_damage: 2 },
      selectedStartWeaponId: 'magic_bolt',
      unlockedWeapons: ['magic_bolt'],
    },
  }, makeGameData());
  const player = createPlayer(0, 0, spawnState);
  applyPlayerPermanentUpgrades(player, spawnState.permanentUpgrades);

  assert.equal(Number(player.globalDamageMult.toFixed(2)), 1.10, 'perm_damage 배율이 적용되지 않음');
  assert.equal(player.weapons[0]?.damage, 11, '시작 무기 데미지가 영구 업그레이드 applicator에서 함께 보정되지 않음');
});

test('선택된 archetype과 risk relic은 spawn state와 플레이어 기본 스탯에 반영된다', () => {
  const spawnState = resolvePlayerSpawnState({
    meta: {
      permanentUpgrades: {},
      selectedStartWeaponId: 'magic_bolt',
      selectedArchetypeId: 'spellweaver',
      selectedRiskRelicId: 'glass_censer',
      unlockedWeapons: ['magic_bolt'],
    },
  }, {
    ...makeGameData(),
    archetypeData: [
      { id: 'vanguard', effects: [{ stat: 'maxHp', value: 25 }] },
      { id: 'spellweaver', effects: [{ stat: 'cooldownMult', value: -0.08 }] },
    ],
    riskRelicData: [
      { id: 'glass_censer', effects: [{ stat: 'bonusProjectileCount', value: 1 }, { stat: 'moveSpeed', value: -18 }] },
    ],
  });
  const player = createPlayer(0, 0, spawnState);
  applyPlayerArchetype(player, spawnState.archetype);
  applyPlayerRiskRelic(player, spawnState.riskRelic);

  assert.equal(spawnState.selectedArchetypeId, 'spellweaver');
  assert.equal(spawnState.selectedRiskRelicId, 'glass_censer');
  assert.equal(Number(player.cooldownMult.toFixed(2)), 0.92, 'archetype 효과가 cooldownMult에 반영되지 않음');
  assert.equal(player.bonusProjectileCount, 1, 'risk relic 효과가 투사체 수에 반영되지 않음');
  assert.equal(player.moveSpeed, 182, 'risk relic 페널티가 이동 속도에 반영되지 않음');
});

summary();
