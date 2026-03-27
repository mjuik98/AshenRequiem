import { registerBossAnnouncementHandler } from './events/bossAnnouncementEventAdapter.js';
import { registerBossPhaseHandler } from './events/bossPhaseEventAdapter.js';
import { registerChestRewardHandler } from './events/chestRewardEventAdapter.js';
import { registerCodexHandlers } from './events/codexEventAdapter.js';
import { registerCurrencyHandler } from './events/currencyEventAdapter.js';
import { registerStageEventHandler } from './events/stageEventAdapter.js';
import { registerWeaponEvolutionHandler } from './events/weaponEvolutionEventAdapter.js';
import { registerSoundEventHandlers } from './events/soundEventAdapter.js';

export const PLAY_WORLD_EVENT_ADAPTERS = Object.freeze([
  {
    id: 'chest-reward',
    register: ({ registry }) => registerChestRewardHandler(registry),
  },
  {
    id: 'boss-phase',
    register: ({ services, registry }) => registerBossPhaseHandler(services, registry),
  },
  {
    id: 'stage-event',
    register: ({ services, registry }) => registerStageEventHandler(services, registry),
  },
]);

export const PLAY_SOUND_EVENT_ADAPTERS = Object.freeze([
  {
    id: 'sound-events',
    register: ({ services, registry }) => registerSoundEventHandlers(services.soundSystem, registry),
  },
]);

export const PLAY_SESSION_EVENT_ADAPTERS = Object.freeze([
  {
    id: 'currency',
    register: ({ session, registry }) => registerCurrencyHandler(session, registry),
  },
  {
    id: 'codex',
    register: ({ session, registry }) => registerCodexHandlers(session, registry),
  },
]);

export const PLAY_PRESENTATION_EVENT_ADAPTERS = Object.freeze([
  {
    id: 'boss-announcement',
    register: ({ services, registry }) => registerBossAnnouncementHandler(services, registry),
  },
  {
    id: 'weapon-evolution',
    register: ({ services, registry }) => registerWeaponEvolutionHandler(services, registry),
  },
]);

export const PLAY_DEFAULT_EVENT_ADAPTERS = Object.freeze([
  ...PLAY_WORLD_EVENT_ADAPTERS,
  ...PLAY_SOUND_EVENT_ADAPTERS,
  ...PLAY_SESSION_EVENT_ADAPTERS,
  ...PLAY_PRESENTATION_EVENT_ADAPTERS,
]);
