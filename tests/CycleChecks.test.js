import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRunner } from './helpers/testRunner.js';

console.log('\n[CycleChecks]');

const { test, summary } = createRunner('CycleChecks');

test('cycle check helper는 self-cycle과 allowlist를 제외한 import cycle을 수집한다', async () => {
  const { collectImportCycles } = await import('../scripts/checkCycles.mjs');
  const root = mkdtempSync(path.join(os.tmpdir(), 'ashen-cycle-'));
  const srcDir = path.join(root, 'src');
  mkdirSync(path.join(srcDir, 'scene'), { recursive: true });
  mkdirSync(path.join(srcDir, 'types'), { recursive: true });

  try {
    writeFileSync(path.join(srcDir, 'scene', 'A.js'), "import './B.js';\nexport const A = 'a';\n");
    writeFileSync(path.join(srcDir, 'scene', 'B.js'), "import './A.js';\nexport const B = 'b';\n");
    writeFileSync(path.join(srcDir, 'types', 'worldTypes.js'), "import './pipelineTypes.js';\nexport {};\n");
    writeFileSync(path.join(srcDir, 'types', 'pipelineTypes.js'), "import './worldTypes.js';\nexport {};\n");
    writeFileSync(path.join(srcDir, 'scene', 'Self.js'), "import './Self.js';\nexport const Self = true;\n");

    const cycles = collectImportCycles(root, {
      allowedCycles: [
        ['src/types/pipelineTypes.js', 'src/types/worldTypes.js'],
      ],
    });

    assert.equal(
      cycles.some((cycle) => cycle.join(' -> ').includes('src/scene/A.js') && cycle.join(' -> ').includes('src/scene/B.js')),
      true,
      '일반 import cycle을 감지하지 못함',
    );
    assert.equal(
      cycles.some((cycle) => cycle.some((entry) => entry.includes('worldTypes.js'))),
      false,
      'allowlist cycle은 제외해야 함',
    );
    assert.equal(
      cycles.some((cycle) => cycle.some((entry) => entry.includes('Self.js'))),
      false,
      'self-cycle은 architecture 위반으로 취급하지 않아야 함',
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

summary();
