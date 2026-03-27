import { hasRuntimeQueryFlag } from '../../adapters/browser/runtimeEnv.js';
export {
  applyRunSessionState,
  queueRunStartEvents,
} from '../../app/play/runSessionStateService.js';

export function shouldEnablePipelineProfiling(host = globalThis) {
  if (!host) return false;
  if (host.__ASHEN_PROFILE_PIPELINE__ === true) return true;
  return hasRuntimeQueryFlag('profilePipeline', host);
}
