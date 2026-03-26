import { createSynergyState } from '../../state/createSynergyState.js';
import { applySynergies } from '../../progression/synergyRuntime.js';

export function createSynergySystem() {
  return {
    update({ world, data }) {
      if (!world?.entities?.player || !data?.synergyData) return;

      world.progression.synergyState ??= createSynergyState();
      applySynergies({
        player: world.entities.player,
        synergyData: data.synergyData,
        synergyState: world.progression.synergyState,
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
