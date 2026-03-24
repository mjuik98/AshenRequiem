/**
 * src/systems/progression/WeaponEvolutionSystem.js — 무기 진화 준비 시스템
 *
 * 파이프라인 priority 96 (SynergySystem 95 이후, LevelSystem 100 이전)
 *
 * 자동 진화는 제거되었다.
 * 이 시스템은 진화 추적 상태만 보장하고, 실제 진화 적용은
 * 레벨업 선택지의 `weapon_evolution` 카드를 통해 UpgradeApplySystem에서 처리한다.
 */
import { logRuntimeInfo } from '../../utils/runtimeLogger.js';

export const WeaponEvolutionSystem = {
  update({ world, data }) {
    if (!world?.player) return;

    const player = world.player;
    if (!player.evolvedWeapons) {
      player.evolvedWeapons = new Set();
      logRuntimeInfo('WeaponEvolutionSystem', '진화 추적 상태 초기화');
    }
  },
};
