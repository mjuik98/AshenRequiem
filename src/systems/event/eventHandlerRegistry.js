import { registerBossAnnouncementHandler } from './bossAnnouncementHandler.js';
import { registerBossPhaseHandler } from './bossPhaseHandler.js';
import { registerChestRewardHandler } from './chestRewardHandler.js';
import { registerCodexHandlers } from './codexHandler.js';
import { registerCurrencyHandler } from './currencyHandler.js';
import { registerWeaponEvolutionHandler } from './weaponEvolutionHandler.js';
import { registerSoundEventHandlers } from '../sound/soundEventHandler.js';

export const DEFAULT_EVENT_HANDLER_REGISTRATIONS = Object.freeze([
  {
    id: 'chest-reward',
    register: ({ registry }) => registerChestRewardHandler(registry),
  },
  {
    id: 'boss-phase',
    register: ({ services, registry }) => registerBossPhaseHandler(services, registry),
  },
  {
    id: 'sound-events',
    register: ({ services, registry }) => registerSoundEventHandlers(services.soundSystem, registry),
  },
  {
    id: 'currency',
    register: ({ session, registry }) => registerCurrencyHandler(session, registry),
  },
  {
    id: 'boss-announcement',
    register: ({ services, registry }) => registerBossAnnouncementHandler(services, registry),
  },
  {
    id: 'weapon-evolution',
    register: ({ services, registry }) => registerWeaponEvolutionHandler(services, registry),
  },
  {
    id: 'codex',
    register: ({ session, registry }) => registerCodexHandlers(session, registry),
  },
]);

export function registerEventHandlers(registrations, services, registry, session) {
  if (!registry) return;

  for (const entry of registrations ?? []) {
    entry?.register?.({ services, registry, session });
  }
}

export function registerDefaultEventHandlers(services, registry, session) {
  registerEventHandlers(DEFAULT_EVENT_HANDLER_REGISTRATIONS, services, registry, session);
}
