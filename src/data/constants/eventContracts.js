export const PLAY_EVENT_CONTRACTS = Object.freeze({
  hits: Object.freeze({
    description: 'Damage candidates produced during collision resolution.',
    required: Object.freeze(['attackerId', 'targetId', 'target', 'damage']),
  }),
  deaths: Object.freeze({
    description: 'Entities that died during the frame.',
    required: Object.freeze(['entity']),
  }),
  pickupCollected: Object.freeze({
    description: 'Pickups collected by the player.',
    required: Object.freeze(['pickup']),
  }),
  levelUpRequested: Object.freeze({
    description: 'Player requested a level-up reward flow.',
    required: Object.freeze(['player']),
  }),
  statusApplied: Object.freeze({
    description: 'Status effect notifications after gameplay application.',
    required: Object.freeze(['entity', 'effect']),
  }),
  bossPhaseChanged: Object.freeze({
    description: 'Boss phase transition data.',
    required: Object.freeze(['boss', 'phase']),
  }),
  bossSpawned: Object.freeze({
    description: 'Boss spawn announcement payload.',
    required: Object.freeze(['enemy']),
  }),
  spawnRequested: Object.freeze({
    description: 'Spawn requests emitted by gameplay systems.',
    required: Object.freeze(['type', 'config']),
  }),
  currencyEarned: Object.freeze({
    description: 'Currency earned during the run.',
    required: Object.freeze(['amount']),
  }),
  weaponEvolved: Object.freeze({
    description: 'Weapon evolution completion payload.',
    required: Object.freeze(['evolvedWeaponId', 'recipeId']),
  }),
  weaponAcquired: Object.freeze({
    description: 'Weapon acquisition payload.',
    required: Object.freeze(['weaponId']),
  }),
  accessoryAcquired: Object.freeze({
    description: 'Accessory acquisition payload.',
    required: Object.freeze(['accessoryId']),
  }),
  chestCollected: Object.freeze({
    description: 'Chest pickup reward payload.',
    required: Object.freeze(['rewardCount']),
  }),
});

export const PLAY_EVENT_TYPES = Object.freeze(Object.keys(PLAY_EVENT_CONTRACTS));

export function getPlayEventContract(eventType) {
  return PLAY_EVENT_CONTRACTS[eventType] ?? null;
}
