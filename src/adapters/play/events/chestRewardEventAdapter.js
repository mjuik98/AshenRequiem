import { nextFloat } from '../../../utils/random.js';

export function registerChestRewardHandler(registry) {
  if (!registry) return;

  registry.register('chestCollected', (_event, world) => {
    const roll = nextFloat(world?.runtime?.rng ?? world?.rng);
    let count;
    if (roll < 0.10) count = 3;
    else if (roll < 0.40) count = 2;
    else count = 1;

    world.progression.chestRewardQueue = (world.progression.chestRewardQueue ?? 0) + count;
  });
}
