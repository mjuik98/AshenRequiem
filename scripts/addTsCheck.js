/**
 * P2-③ 가이드: 전체 System 파일에 @ts-check + JSDoc @param 일괄 추가
 *
 * 적용 대상:
 *   src/systems/ 하위 모든 System 파일 (update 메서드 보유)
 *
 * 적용 방법:
 *   1) 각 System 파일 최상단에 // @ts-check 추가
 *   2) update() 메서드 위에 @param {PipelineContext} ctx JSDoc 추가
 *   3) 구조분해 파라미터는 개별 @param으로 나열 가능
 *
 * 아래는 적용 전/후 예시입니다.
 */

// ============================================================
// 예시: WeaponSystem.js 적용 전
// ============================================================
/*
export const WeaponSystem = {
  update({ dt, world, data, services }) {
    // ...
  }
};
*/

// ============================================================
// 예시: WeaponSystem.js 적용 후
// ============================================================
/*
// @ts-check
// import type { PipelineContext } from '../../state/pipelineTypes.js';  (타입 전용 참조)

export const WeaponSystem = {
  /**
   * @param {import('../../state/pipelineTypes.js').PipelineContext} ctx
   *
  update({ dt, world, data, services }) {
    // VSCode가 world.player, world.enemies, services.projectilePool 등 자동완성 제공
  }
};
*/

// ============================================================
// 일괄 적용 스크립트 (Node.js)
// 프로젝트 루트에서 실행: node scripts/addTsCheck.js
// ============================================================

import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT      = resolve(__dirname, '..');
const SRC_DIR   = join(ROOT, 'src', 'systems');

const TS_CHECK_LINE = '// @ts-check';
const TYPE_IMPORT   = "// import type { PipelineContext } from '../../state/pipelineTypes.js';";

let patched = 0;
let skipped = 0;

function processDir(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      processDir(full);
      continue;
    }
    if (!entry.endsWith('.js')) continue;

    let src = readFileSync(full, 'utf-8');

    // 이미 @ts-check 있으면 스킵
    if (src.startsWith(TS_CHECK_LINE)) {
      skipped++;
      continue;
    }

    // update({ ... }) 패턴이 없는 파일은 스킵 (유틸/데이터 파일 등)
    if (!src.includes('update(')) {
      skipped++;
      continue;
    }

    // 파일 최상단에 @ts-check + 타입 import 주석 추가
    const header = `${TS_CHECK_LINE}\n${TYPE_IMPORT}\n\n`;
    writeFileSync(full, header + src, 'utf-8');
    console.log(`  [패치] ${full.replace(ROOT + '/', '')}`);
    patched++;
  }
}

processDir(SRC_DIR);
console.log(`\n완료: ${patched}개 패치, ${skipped}개 스킵`);
