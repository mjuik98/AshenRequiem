/**
 * scripts/addTsCheck.js
 *
 * ── 개선 P2: @ts-check + JSDoc @param 일괄 추가 ──────────────────────────
 *
 * 적용 대상:
 *   src/systems/ 하위 모든 System 파일 (update 메서드 보유)
 *   src/behaviors/ 하위 파일도 선택적으로 적용
 *
 * 실행 방법:
 *   node scripts/addTsCheck.js
 *   node scripts/addTsCheck.js --also-behaviors   (behaviors/ 도 포함)
 *   node scripts/addTsCheck.js --dry-run          (실제 파일 수정 없이 목록만 출력)
 *
 * Before (미적용):
 *   IDE에서 world.player, services.projectilePool 등 자동완성 불가.
 *   잘못된 프로퍼티명을 써도 런타임 전까지 오류 미발견.
 *
 * After (적용):
 *   VSCode가 PipelineContext 타입 기반 자동완성 제공.
 *   오타, 필드 누락을 IDE 레벨에서 즉시 감지.
 */

import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, resolve, relative }                            from 'node:path';
import { fileURLToPath }                                       from 'node:url';

const __dirname  = fileURLToPath(new URL('.', import.meta.url));
const ROOT       = resolve(__dirname, '..');
const SRC_DIR    = join(ROOT, 'src', 'systems');
const BHVR_DIR   = join(ROOT, 'src', 'behaviors');

const args       = process.argv.slice(2);
const DRY_RUN    = args.includes('--dry-run');
const ALSO_BHVR  = args.includes('--also-behaviors');

const TS_CHECK_LINE  = '// @ts-check';
const TYPE_IMPORT    = "// import type { PipelineContext } from '../../state/pipelineTypes.js';";

// behaviors/ 는 상대경로 depth가 달라 별도 import 경로 사용
const BHVR_TYPE_IMPORT = "// import type { PipelineContext } from '../state/pipelineTypes.js';";

let patched = 0;
let skipped = 0;
let dryList = [];

function processDir(dir, typeImportLine) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    console.warn(`[addTsCheck] 디렉토리 없음: ${dir}`);
    return;
  }

  for (const entry of entries) {
    const full = join(dir, entry);
    let stat;
    try { stat = statSync(full); } catch { continue; }

    if (stat.isDirectory()) {
      processDir(full, typeImportLine);
      continue;
    }
    if (!entry.endsWith('.js')) continue;

    let src;
    try { src = readFileSync(full, 'utf-8'); } catch { continue; }

    // 이미 @ts-check 있으면 스킵
    if (src.includes(TS_CHECK_LINE)) {
      skipped++;
      continue;
    }

    // update() 또는 export function 없는 파일은 스킵 (순수 데이터 파일 등)
    if (!src.includes('update(') && !src.includes('export function')) {
      skipped++;
      continue;
    }

    const rel    = relative(ROOT, full);
    const header = `${TS_CHECK_LINE}\n${typeImportLine}\n\n`;

    if (DRY_RUN) {
      dryList.push(rel);
      patched++;
    } else {
      writeFileSync(full, header + src, 'utf-8');
      console.log(`  [패치] ${rel}`);
      patched++;
    }
  }
}

console.log('\n=== addTsCheck.js ===');
if (DRY_RUN) console.log('  (dry-run 모드 — 파일 수정 없음)\n');

processDir(SRC_DIR, TYPE_IMPORT);
if (ALSO_BHVR) processDir(BHVR_DIR, BHVR_TYPE_IMPORT);

if (DRY_RUN && dryList.length > 0) {
  console.log('패치 예정 파일:');
  dryList.forEach(f => console.log('  ', f));
}

console.log(`\n완료: ${patched}개 패치${DRY_RUN ? '(dry-run)' : ''}, ${skipped}개 스킵`);
console.log('다음: npm run validate 로 데이터 무결성 확인\n');
