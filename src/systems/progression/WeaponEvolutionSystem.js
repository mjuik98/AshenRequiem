/**
 * src/systems/progression/WeaponEvolutionSystem.js — 무기 진화 시스템
 *
 * 파이프라인 priority 96 (SynergySystem 95 이후, LevelSystem 100 이전)
 *
 * 진화 조건:
 *   1. 기반 무기가 maxLevel에 도달해야 함 (기본 level 5)
 *   2. 필요한 장신구를 모두 보유해야 함
 *   3. 이미 진화한 레시피는 다시 처리하지 않음 (player.evolvedWeapons Set)
 *
 * 진화 시 처리:
 *   - 기반 무기를 진화 무기로 교체 (slots 개수 불변)
 *   - world.events.weaponEvolved 이벤트 발행
 *   - 진화 레시피 ID를 player.evolvedWeapons에 기록
 */
import { getWeaponDataById } from '../../data/weaponData.js';

export const WeaponEvolutionSystem = {
  update({ world, data }) {
    if (!world?.player || !data?.weaponEvolutionData) return;

    const player = world.player;
    if (!player.evolvedWeapons) player.evolvedWeapons = new Set();

    for (const recipe of data.weaponEvolutionData) {
      // 이미 이 레시피로 진화했으면 스킵
      if (player.evolvedWeapons.has(recipe.id)) continue;

      const { weaponId, accessoryIds } = recipe.requires;

      // 기반 무기 보유 여부
      const baseWeapon = player.weapons.find(w => w.id === weaponId);
      if (!baseWeapon) continue;

      // 기반 무기가 maxLevel에 도달했는지 확인
      const baseWeaponDef = getWeaponDataById(weaponId);
      const maxLevel      = baseWeaponDef?.maxLevel ?? 5;
      if (baseWeapon.level < maxLevel) continue;

      // 필요 장신구 전부 보유 여부
      const hasAllAccessories = accessoryIds.every(accId =>
        player.accessories?.some(a => a.id === accId)
      );
      if (!hasAllAccessories) continue;

      // 진화 무기 정의 확인
      const evolvedDef = getWeaponDataById(recipe.resultWeaponId);
      if (!evolvedDef) {
        console.warn(`[WeaponEvolutionSystem] 진화 무기 미정의: ${recipe.resultWeaponId}`);
        continue;
      }

      // ── 진화 실행 ────────────────────────────────────────────────────────
      const weaponIndex = player.weapons.findIndex(w => w.id === weaponId);
      if (weaponIndex !== -1) {
        player.weapons.splice(weaponIndex, 1, {
          ...evolvedDef,
          currentCooldown: 0,
          level:           1,
        });
      }

      player.evolvedWeapons.add(recipe.id);

      // 이벤트 발행
      if (world.events?.weaponEvolved) {
        world.events.weaponEvolved.push({
          recipeId:         recipe.id,
          weaponId,
          evolvedWeaponId:  recipe.resultWeaponId,
          weaponName:       evolvedDef.name,
          announceText:     recipe.announceText ?? `${evolvedDef.name}으로 진화했다!`,
        });
      }

      console.info(`[WeaponEvolutionSystem] ${weaponId} → ${recipe.resultWeaponId} 진화 완료`);
    }
  },
};
