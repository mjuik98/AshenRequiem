#!/usr/bin/env node
/**
 * scripts/cleanup_legacy.js — 레거시 파일 정리 (크로스플랫폼)
 *
 * ── 추가된 삭제 대상 ──────────────────────────────────────────────────────
 *
 * [NEW-①] src/renderer/drawBehaviorRegistry.js
 *   이유: src/renderer/draw/drawBehaviorRegistry.js 의 완전한 복사본.
 *         두 파일이 공존하면 IDE가 잘못된 경로를 자동완성으로 제안하거나
 *         한쪽만 수정되는 불일치 버그가 발생한다.
 *         실제 사용 버전: src/renderer/draw/drawBehaviorRegistry.js
 *
 * [NEW-②] src/renderer/drawProjectile.js
 *   이유: src/renderer/draw/drawProjectile.js 의 완전한 복사본. 동일 문제.
 *         실제 사용 버전: src/renderer/draw/drawProjectile.js
 *
 * [NEW-③] src/state/createUiState.js
 *   이유: PlayScene은 PlayModeStateMachine으로 모드 전환을 처리하며
 *         각 View가 자체적으로 show/hide를 관리한다.
 *         createUiState()는 생성만 되고 실제 읽히거나 변경되지 않는 사문화 코드.
 *
 * [NEW-④] src/systems/spawn/BossPhaseSystem.js
 *   이유: src/systems/combat/BossPhaseSystem.js 로 이동됨.
 *         spawn/ 폴더는 적 생성(SpawnSystem, FlushSystem)만 담당해야 한다.
 *         BossPhaseSystem은 전투 페이즈 전환 로직으로 combat/ 가 올바른 위치.
 *
 * [기존 대상 — 유지]
 * [Q-①] src/systems/movement/EliteBehaviorSystem.js — re-export stub
 * [Q-②] src/utils/SpatialGrid.js — 미사용 구버전 중복
 * [Legacy] src/systems/event/EventBusHandler.js — EventRegistry로 대체됨
 */

import { existsSync, rmSync } from 'node:fs';
import { resolve, join }      from 'node:path';
import { fileURLToPath }      from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT      = resolve(__dirname, '..');
const DRY_RUN   = process.argv.includes('--dry-run');

const TARGETS = [
  // ── 기존 대상 ─────────────────────────────────────────────────────────
  {
    path:   'src/systems/movement/EliteBehaviorSystem.js',
    reason: 'Q-① re-export stub — combat/ 버전이 실제 구현체',
  },
  {
    path:   'src/utils/SpatialGrid.js',
    reason: 'Q-② 미사용 구버전 중복 — managers/SpatialGrid.js가 활성 버전',
  },
  {
    path:   'src/systems/event/EventBusHandler.js',
    reason: 'Legacy — EventRegistry.js로 완전 대체됨',
  },

  // ── 신규 추가 ──────────────────────────────────────────────────────────
  {
    path:   'src/renderer/drawBehaviorRegistry.js',
    reason: 'NEW-① 루트 복사본 — draw/ 하위 버전이 실제 사용 버전',
  },
  {
    path:   'src/renderer/drawProjectile.js',
    reason: 'NEW-② 루트 복사본 — draw/ 하위 버전이 실제 사용 버전',
  },
  {
    path:   'src/state/createUiState.js',
    reason: 'NEW-③ 사문화 코드 — 생성 후 읽히거나 변경되지 않음. PlayModeStateMachine + View.show/hide로 대체됨',
  },
  {
    path:   'src/systems/spawn/BossPhaseSystem.js',
    reason: 'NEW-④ 잘못된 폴더 — combat/BossPhaseSystem.js로 이동됨. spawn/은 적 생성만 담당',
  },
];

console.log('\n=== Ashen Requiem 레거시 파일 정리 ===');
if (DRY_RUN) console.log('(dry-run 모드: 실제 삭제 없음)\n');

let deleted = 0;
let skipped = 0;

for (const { path, reason } of TARGETS) {
  const full = join(ROOT, path);

  if (!existsSync(full)) {
    console.log(`  [없음] ${path}`);
    skipped++;
    continue;
  }

  if (DRY_RUN) {
    console.log(`  [삭제 예정] ${path}`);
    console.log(`    이유: ${reason}`);
    deleted++;
  } else {
    try {
      rmSync(full);
      console.log(`  [삭제] ${path}`);
      console.log(`    이유: ${reason}`);
      deleted++;
    } catch (e) {
      console.error(`  [오류] ${path}: ${e.message}`);
    }
  }
}

console.log(`\n완료: ${deleted}개 ${DRY_RUN ? '예정' : '삭제'}, ${skipped}개 없음`);
console.log('다음: npm run validate 로 데이터 무결성 확인\n');
