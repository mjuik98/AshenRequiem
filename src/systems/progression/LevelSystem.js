/**
 * src/systems/progression/LevelSystem.js — 레벨업 판정
 *
 * CHANGE(R-19 완전 준수): 레벨업 선택지 생성을 LevelSystem으로 이동
 */

import { getXpForLevel }                        from '../../data/constants.js';
import { transitionPlayMode, PlayMode }          from '../../state/PlayMode.js';
import { UpgradeSystem }                         from './UpgradeSystem.js';

export const LevelSystem = {
  update({ world, data }) {
    const player = world.player;
    if (!player?.isAlive) return;
    if (world.playMode !== PlayMode.PLAYING) return;

    const xpNeeded = getXpForLevel(player.level);
    if (player.xp < xpNeeded) return;

    player.xp -= xpNeeded;
    player.level++;

    // CHANGE(R-19): 선택지를 여기서 생성해 world에 저장
    try {
      world.pendingLevelUpChoices = UpgradeSystem.generateChoices(player);
    } catch (e) {
      console.warn('[LevelSystem] UpgradeSystem.generateChoices 실패:', e.message);
      world.pendingLevelUpChoices = [];
    }

    transitionPlayMode(world, PlayMode.LEVELUP);

    if (world.events?.levelUpRequested) {
      world.events.levelUpRequested.push({ player });
    }
  },
};
