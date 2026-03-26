import { PLAY_DEFAULT_EVENT_ADAPTERS } from '../../adapters/play/playEventAdapters.js';

export const DEFAULT_EVENT_HANDLER_REGISTRATIONS = PLAY_DEFAULT_EVENT_ADAPTERS;

export function registerEventHandlers(registrations, services, registry, session) {
  if (!registry) return;

  for (const entry of registrations ?? []) {
    entry?.register?.({ services, registry, session });
  }
}

export function registerDefaultEventHandlers(services, registry, session) {
  registerEventHandlers(DEFAULT_EVENT_HANDLER_REGISTRATIONS, services, registry, session);
}
