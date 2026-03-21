import assert from 'node:assert/strict';
import { test, summary } from './helpers/testRunner.js';
import { createPlayer } from '../src/entities/createPlayer.js';

console.log('\n[StartWeapon]');

test('해금된 시작 무기 선택이 있으면 해당 무기로 시작한다', () => {
  const player = createPlayer(0, 0, {
    meta: {
      permanentUpgrades: {},
      selectedStartWeaponId: 'boomerang',
      unlockedWeapons: ['magic_bolt', 'boomerang'],
    },
  });

  assert.equal(player.weapons.length, 1, '시작 무기 수는 1개여야 함');
  assert.equal(player.weapons[0]?.id, 'boomerang', '선택한 시작 무기가 적용되지 않음');
});

test('잠겨 있거나 잘못된 시작 무기 선택은 magic_bolt로 대체된다', () => {
  const player = createPlayer(0, 0, {
    meta: {
      permanentUpgrades: {},
      selectedStartWeaponId: 'boomerang',
      unlockedWeapons: ['magic_bolt'],
    },
  });

  assert.equal(player.weapons.length, 1, '시작 무기 수는 1개여야 함');
  assert.equal(player.weapons[0]?.id, 'magic_bolt', '잠긴 시작 무기가 fallback 처리되지 않음');
});

summary();
