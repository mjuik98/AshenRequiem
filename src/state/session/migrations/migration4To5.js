export const migration4To5 = {
  from: 4,
  migrate(sessionState) {
    return {
      ...sessionState,
      _version: 5,
      meta: {
        ...sessionState.meta,
        unlockedWeapons: Array.isArray(sessionState.meta?.unlockedWeapons) ? sessionState.meta.unlockedWeapons : ['magic_bolt'],
        unlockedAccessories: Array.isArray(sessionState.meta?.unlockedAccessories) ? sessionState.meta.unlockedAccessories : [],
        completedUnlocks: Array.isArray(sessionState.meta?.completedUnlocks) ? sessionState.meta.completedUnlocks : [],
        selectedStartWeaponId: typeof sessionState.meta?.selectedStartWeaponId === 'string'
          ? sessionState.meta.selectedStartWeaponId
          : 'magic_bolt',
      },
    };
  },
};
