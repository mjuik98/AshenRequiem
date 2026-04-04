import { PLAY_DEFAULT_EVENT_ADAPTERS } from '../../adapters/play/playEventAdapters.js';
import { registerEventHandlers } from '../../systems/event/eventHandlerRegistry.js';

export const PLAY_DEFAULT_EVENT_HANDLER_REGISTRATIONS = PLAY_DEFAULT_EVENT_ADAPTERS;

export function registerPlayEventHandlers(
  services,
  registry,
  session,
  {
    registrations = PLAY_DEFAULT_EVENT_HANDLER_REGISTRATIONS,
    registerEventHandlersImpl = registerEventHandlers,
  } = {},
) {
  registerEventHandlersImpl(registrations, services, registry, session);
}
