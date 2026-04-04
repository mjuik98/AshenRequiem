export function registerEventHandlers(registrations, services, registry, session) {
  if (!registry) return;

  for (const entry of registrations ?? []) {
    entry?.register?.({ services, registry, session });
  }
}
