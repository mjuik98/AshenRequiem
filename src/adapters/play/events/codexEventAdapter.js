import { ensureCodexMeta } from '../../../state/session/sessionMetaState.js';

export function registerCodexHandlers(session, registry) {
  if (!session || !registry) return;

  registry.register('deaths', (event) => {
    const entity = event.entity;
    if (!entity) return;

    if (entity.type === 'enemy') {
      ensureCodexMeta(session);

      const id = entity.enemyDataId ?? entity.id;
      session.meta.enemyKills[id] = (session.meta.enemyKills[id] ?? 0) + 1;

      if (!session.meta.enemiesEncountered.includes(id)) {
        session.meta.enemiesEncountered.push(id);
      }

      if (entity.isBoss && !session.meta.killedBosses.includes(id)) {
        session.meta.killedBosses.push(id);
      }
    }
  });

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

  registry.register('accessoryAcquired', (event) => {
    if (!event.accessoryId) return;
    recordAccessoryAcquired(session, event.accessoryId);
  });
}

function recordWeaponAcquired(session, weaponId) {
  if (!session || !weaponId) return;
  ensureCodexMeta(session);
  if (!session.meta.weaponsUsedAll.includes(weaponId)) {
    session.meta.weaponsUsedAll.push(weaponId);
  }
}

function recordAccessoryAcquired(session, accessoryId) {
  if (!session || !accessoryId) return;
  ensureCodexMeta(session);
  if (!session.meta.accessoriesOwnedAll.includes(accessoryId)) {
    session.meta.accessoriesOwnedAll.push(accessoryId);
  }
}
