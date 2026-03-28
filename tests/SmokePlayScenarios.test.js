import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRunner } from './helpers/testRunner.js';
import { runPauseOverlayScenario } from '../scripts/browser-smoke/smokePlayScenarios.mjs';

console.log('\n[SmokePlayScenarios]');

const { test, summary } = createRunner('SmokePlayScenarios');

test('pause overlay smoke는 첫 Escape가 누락되면 한 번 더 시도해 복귀를 확인한다', async () => {
  const artifactDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ashen-smoke-pause-'));
  const snapshotPath = path.join(artifactDir, 'pause-snapshot.txt');
  fs.writeFileSync(snapshotPath, '마법탄 [ref=e113]\n', 'utf8');

  let escapePressCount = 0;
  const transport = {
    async open() {},
    async clickByText() {
      return true;
    },
    async pollEval(expression) {
      if (expression.includes('[data-action="start"]')) return true;
      if (expression.includes('.sl-root')) return true;
      if (expression.includes('getSnapshot')) {
        if (escapePressCount >= 2) {
          return { scene: 'PlayScene', ui: { pauseVisible: false } };
        }
        return { scene: 'PlayScene', ui: { pauseVisible: true } };
      }
      return true;
    },
    async evalJson(expression) {
      if (expression.includes('openPauseOverlay')) return true;
      if (expression.includes('advanceTime')) return true;
      if (expression.includes('.pv-slot-name')) return '마법탄';
      if (expression.includes('.pv-tooltip') && expression.includes('innerText')) return '마법탄\nLv.1';
      if (expression.includes('document.activeElement')) return true;
      return true;
    },
    async snapshotPath() {
      return snapshotPath;
    },
    async hover() {},
    async takeScreenshot(outputPath) {
      fs.writeFileSync(outputPath, '', 'utf8');
    },
    async press(key) {
      if (key === 'Escape') {
        escapePressCount += 1;
      }
    },
  };

  const result = await runPauseOverlayScenario('http://127.0.0.1:4173', artifactDir, transport);

  assert.equal(escapePressCount, 2, '첫 Escape가 먹히지 않으면 한 번 더 시도해야 함');
  assert.equal(result.assertions.escapeResumes, true, '재시도 후 pause overlay가 닫혀야 함');
});

await summary();
