import { processPlayResult } from '../../domain/meta/progression/playResultDomain.js';

export function capturePlayResultRuntimeState(session) {
  return {
    startCurrency: session?.meta?.currency ?? 0,
    prevBestTime: session?.best?.survivalTime ?? 0,
    prevBestLevel: session?.best?.level ?? 1,
    prevBestKills: session?.best?.kills ?? 0,
  };
}

export function processPlayResultForSession(
  world,
  session,
  runtimeState = {},
  {
    processPlayResultImpl = processPlayResult,
  } = {},
) {
  return processPlayResultImpl(world, session, runtimeState);
}

export function createPlayResultApplicationService(
  session,
  {
    captureRuntimeStateImpl = capturePlayResultRuntimeState,
    processPlayResultImpl = processPlayResultForSession,
  } = {},
) {
  const runtimeState = captureRuntimeStateImpl(session);
  return {
    process(world) {
      return processPlayResultImpl(world, session, runtimeState);
    },
  };
}
