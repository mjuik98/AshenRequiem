import { createSynergyState } from '../../state/createSynergyState.js';
import { applySynergies } from '../../progression/synergyRuntime.js';

export function createSynergySystem() {
  return {
    update({ world, data }) {
      if (!world?.player || !data?.synergyData) return;

      world.synergyState ??= createSynergyState();
      applySynergies({
        player: world.player,
        synergyData: data.synergyData,
        synergyState: world.synergyState,
      });
    },

    applyAll({ player, synergyData, synergyState }) {
      return applySynergies({ player, synergyData, synergyState });
    },
  };
}

export const SynergySystem = Object.freeze({
  applyAll: applySynergies,
});
