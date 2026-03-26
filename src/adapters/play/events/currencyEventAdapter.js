import { earnCurrency } from '../../../state/createSessionState.js';

export function registerCurrencyHandler(session, registry) {
  if (!registry) return;

  registry.register('currencyEarned', (event, world) => {
    if (session) {
      earnCurrency(session, event.amount ?? 0);
    }
    if (world) {
      world.run.runCurrencyEarned = (world.run.runCurrencyEarned ?? 0) + (event.amount ?? 0);
    }
  });
}
