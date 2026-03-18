#!/usr/bin/env node
/**
 * scripts/cleanup_legacy.js — 레거시 파일 정리 (크로스플랫폼)
 */
import { existsSync, rmSync } from 'node:fs';
import { resolve, join }      from 'node:path';
import { fileURLToPath }      from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT      = resolve(__dirname, '..');
const DRY_RUN   = process.argv.includes('--dry-run');

const TARGETS = [
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
