import { ensureCodexMeta } from '../../state/sessionMeta.js';

/**
 * src/systems/event/codexHandler.js — 도감 데이터 추적 이벤트 핸들러
 *
 * PipelineBuilder._registerEventHandlers() 에서 등록:
 *   import { registerCodexHandlers } from '../systems/event/codexHandler.js';
 *   registerCodexHandlers(this._session, this._eventRegistry);
 *
 * 추적 항목:
 *   - deaths  이벤트 → 적 처치 수, 보스 처치 목록, 발견 목록 갱신
 *   - 런 종료 → totalRuns 증가 (DeathSystem의 player 사망 이벤트 활용)
 *
 * R-14 준수: session은 PipelineBuilder가 클로저로 전달 — 시스템이 직접 접근 금지.
 */

/**
 * 도감 추적 핸들러를 EventRegistry 인스턴스에 등록한다.
 *
 * @param {import('../../state/createSessionState.js').SessionState|null} session
 * @param {import('./EventRegistry.js').EventRegistry} registry
 */
export function registerCodexHandlers(session, registry) {
  if (!session || !registry) return;

  registry.register('deaths', (event) => {
    const entity = event.entity;
    if (!entity) return;

    if (entity.type === 'enemy') {
      ensureCodexMeta(session);

      const id = entity.enemyDataId ?? entity.id;

      // 처치 수 누적
      session.meta.enemyKills[id] =
        (session.meta.enemyKills[id] ?? 0) + 1;

      // 발견 목록에 추가 (중복 방지)
      if (!session.meta.enemiesEncountered.includes(id)) {
        session.meta.enemiesEncountered.push(id);
      }

      // 보스 처치 목록 갱신
      if (entity.isBoss && !session.meta.killedBosses.includes(id)) {
        session.meta.killedBosses.push(id);
      }
    }

    if (entity.type === 'player') {
      // 런 종료(사망) 시 totalRuns 증가
      ensureCodexMeta(session);
      session.meta.totalRuns = (session.meta.totalRuns ?? 0) + 1;
    }
  });

  // 무기 진화 이벤트 추적
  registry.register('weaponEvolved', (event) => {
    if (!event.recipeId) return;
    ensureCodexMeta(session);
    if (!session.meta.evolvedWeapons.includes(event.evolvedWeaponId)) {
      session.meta.evolvedWeapons.push(event.evolvedWeaponId);
    }
  });

  registry.register('weaponAcquired', (event) => {
      if (!event.weaponId) return;
      recordWeaponAcquired(session, event.weaponId);
  });
}

/**
 * 무기 획득 시 weaponsUsedAll 에 기록한다.
 * PlayScene 혹은 UpgradeApplySystem 에서 직접 호출해도 된다.
 *
 * 사용 예 (UpgradeApplySystem.update 등에서):
 *   import { recordWeaponAcquired } from '../systems/event/codexHandler.js';
 *   recordWeaponAcquired(session, 'magic_bolt');
 *
 * @param {object} session
 * @param {string} weaponId
 */
export function recordWeaponAcquired(session, weaponId) {
  if (!session || !weaponId) return;
  ensureCodexMeta(session);
  if (!session.meta.weaponsUsedAll.includes(weaponId)) {
    session.meta.weaponsUsedAll.push(weaponId);
  }
}

/**
 * 적과 첫 조우 시 발견 목록에 추가한다.
 * (처치 없이 발견만 해도 도감에 표시하고 싶을 때 사용)
 *
 * 사용 예 (CollisionSystem 또는 SpawnSystem에서):
 *   import { recordEnemyEncounter } from '../systems/event/codexHandler.js';
 *   recordEnemyEncounter(session, enemy.enemyDataId);
 *
 * @param {object} session
 * @param {string} enemyDataId
 */
export function recordEnemyEncounter(session, enemyDataId) {
  if (!session || !enemyDataId) return;
  ensureCodexMeta(session);
  if (!session.meta.enemiesEncountered.includes(enemyDataId)) {
    session.meta.enemiesEncountered.push(enemyDataId);
  }
}
