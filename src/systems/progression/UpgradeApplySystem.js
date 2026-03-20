/**
 * src/systems/progression/UpgradeApplySystem.js — 업그레이드 적용 시스템 (신규)
 * 파이프라인 priority 101.
 *
 * REFACTOR: PlayScene → UpgradeSystem 직접 호출 제거
 *
 *   Before (책임 위반):
 *     PlayScene._showLevelUpUI() → onSelect callback → UpgradeSystem.applyUpgrade()
 *     씬이 시스템을 직접 호출하는 구조 (AGENTS.md §2 위반)
 *
 *   After (이벤트 기반):
 *     PlayScene._showLevelUpUI() → onSelect callback → world.pendingUpgrade = upgrade
 *     UpgradeApplySystem (priority 101) → world.pendingUpgrade 소비 → UpgradeSystem.applyUpgrade()
 *
 *   이로써:
 *     - 씬은 "어떤 업그레이드를 선택했는가"만 world에 기록
 *     - 실제 적용 로직은 파이프라인 시스템이 담당
 *     - data.synergyData DI 흐름이 시스템 레이어에서 완결됨
 *
 * 실행 순서:
 *   priority 100: LevelSystem (레벨업 이벤트 발행)
 *   priority 101: UpgradeApplySystem (pendingUpgrade 소비)
 *   priority 105: EventRegistry.asSystem (이벤트 핸들러 실행 후 클리어)
 */

import { UpgradeSystem } from './UpgradeSystem.js';

export const UpgradeApplySystem = {
  /**
   * world.pendingUpgrade가 있으면 소비하여 업그레이드를 적용한다.
   *
   * @param {{ world: object, data: object }} ctx
   */
  update({ world, data }) {
    if (!world.pendingUpgrade || !world.player) return;

    // DI된 synergyData를 명시적으로 전달
    UpgradeSystem.applyUpgrade(
      world.player,
      world.pendingUpgrade,
      data?.synergyData,
    );

    // 소비 완료 — 다음 프레임에서 재처리되지 않도록 null로 초기화
    world.pendingUpgrade = null;
  },
};
