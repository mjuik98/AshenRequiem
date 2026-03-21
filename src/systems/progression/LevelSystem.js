/**
 * src/systems/progression/LevelSystem.js — 레벨업 판정 + 상자 보상 처리
 *
 * CHANGE: world.chestRewardQueue 처리 추가
 *   - 레벨업이 없더라도 chestRewardQueue > 0이면 보상 선택 UI를 발동한다.
 *   - world.pendingLevelUpType으로 'levelup' vs 'chest' 구분.
 */

import { getXpForLevel }                       from '../../data/constants.js';
import { transitionPlayMode, PlayMode }         from '../../state/PlayMode.js';
import { UpgradeSystem }                        from './UpgradeSystem.js';

export const LevelSystem = {
  update({ world, data }) {
    const player = world.player;
    if (!player?.isAlive) return;
    if (world.playMode !== PlayMode.PLAYING) return;

    // ── 레벨업 판정 ────────────────────────────────────────────────────
    const xpNeeded = getXpForLevel(player.level);
    if (player.xp >= xpNeeded) {
      player.xp -= xpNeeded;
      player.level++;

      world.pendingLevelUpType = 'levelup';

      try {
        world.pendingLevelUpChoices = UpgradeSystem.generateChoices(player);
      } catch (e) {
        console.warn('[LevelSystem] generateChoices 실패:', e.message);
        world.pendingLevelUpChoices = [];
      }

      transitionPlayMode(world, PlayMode.LEVELUP);

      if (world.events?.levelUpRequested) {
        world.events.levelUpRequested.push({ player });
      }
      return; // 레벨업 처리 완료 — 이번 프레임에서 상자 처리는 다음 번에
    }

    // ── 상자 보상 처리 ──────────────────────────────────────────────────
    // 레벨업이 없고 상자 보상 대기 중인 경우
    if ((world.chestRewardQueue ?? 0) > 0) {
      world.chestRewardQueue--;
      world.pendingLevelUpType = 'chest';

      try {
        world.pendingLevelUpChoices = UpgradeSystem.generateChoices(player);
      } catch (e) {
        console.warn('[LevelSystem] chest reward generateChoices 실패:', e.message);
        world.pendingLevelUpChoices = [];
      }

      transitionPlayMode(world, PlayMode.LEVELUP);
      // 상자 보상은 levelUpRequested 이벤트를 발행하지 않음 (사운드 등 불필요)
    }
  },
};
