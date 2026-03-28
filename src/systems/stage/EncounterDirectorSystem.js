import { resolveEncounterState } from '../../domain/play/encounter/encounterDirectorDomain.js';

export const EncounterDirectorSystem = {
  update({ world, data }) {
    const run = world?.run;
    if (!run) return;

    run.encounterState = resolveEncounterState({
      elapsedTime: run.elapsedTime ?? 0,
      stage: run.stage ?? null,
      bossData: data?.bossData ?? [],
    });
  },
};
