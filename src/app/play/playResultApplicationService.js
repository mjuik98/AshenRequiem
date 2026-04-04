import { processPlayResult } from './playResultSessionService.js';

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
    gameData = null,
  } = {},
) {
  return processPlayResultImpl(world, session, runtimeState, { gameData });
}

export function createPlayResultApplicationService(
  session,
  {
    gameData = null,
    captureRuntimeStateImpl = capturePlayResultRuntimeState,
    processPlayResultImpl = processPlayResultForSession,
  } = {},
) {
  const runtimeState = captureRuntimeStateImpl(session);
  return {
    process(world) {
      return processPlayResultImpl(world, session, runtimeState, { gameData });
    },
  };
}
