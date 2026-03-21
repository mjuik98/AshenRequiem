/**
 * src/state/sessionFacade.js
 *
 * 씬/UI 계층에서 사용하는 세션 쓰기 진입점.
 * 전투 시스템과 분리된 저장 책임을 얇게 캡슐화한다.
 */

import {
  purchasePermanentUpgrade,
  saveSession,
} from './createSessionState.js';
import { ensureCodexMeta } from './sessionMeta.js';
import { mergeSessionOptions } from './sessionOptions.js';

export function persistSession(session) {
  saveSession(session);
  return session;
}

export function updateSessionOptionsAndSave(session, nextOptions) {
  session.options = mergeSessionOptions(session?.options, nextOptions);
  persistSession(session);
  return session.options;
}

export function setSelectedStartWeaponAndSave(session, weaponId) {
  const meta = ensureCodexMeta(session);
  meta.selectedStartWeaponId = weaponId;
  persistSession(session);
  return meta.selectedStartWeaponId;
}

export function purchasePermanentUpgradeAndSave(session, upgradeId, cost) {
  const success = purchasePermanentUpgrade(session, upgradeId, cost);
  if (success) {
    persistSession(session);
  }
  return success;
}
