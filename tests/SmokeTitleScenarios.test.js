import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRunner } from './helpers/testRunner.js';
import {
  runTitleLoadoutAccessibilityScenario,
  runTitleMetaShopScenario,
} from '../scripts/browser-smoke/smokeTitleScenarios.mjs';

console.log('\n[SmokeTitleScenarios]');

const { test, summary } = createRunner('SmokeTitleScenarios');

test('title loadout accessibility smoke는 Start Game ref click 실패 시 DOM fallback으로 계속 진행한다', async () => {
  const artifactDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ashen-smoke-title-'));
  let startClickAttempts = 0;
  let startFallbackUsed = false;

  const transport = {
    async open() {},
    async resize() {},
    async pollEval(expression) {
      if (expression.includes('[data-action="start"]')) return true;
      if (expression.includes('.sl-root .sl-panel')) return true;
      if (expression.includes('getComputedStyle(document.querySelector(\'.sl-root\')).display === \'none\'')) return true;
      if (expression.includes('getSnapshot')) return { scene: 'PlayScene' };
      return true;
    },
    async clickByText(label) {
      if (label === 'Start Game') {
        startClickAttempts += 1;
        return startClickAttempts > 1;
      }
      return true;
    },
    async evalJson(expression) {
      if (expression.includes('document.querySelector(\'[data-action="start"]\')')) {
        startFallbackUsed = true;
        return true;
      }
      if (expression.includes('document.querySelector(\'.sl-panel\') && document.activeElement')) return true;
      if (expression.includes('document.querySelector(\'.sl-panel\') ? (document.querySelector(\'.sl-panel\').scrollTop')) return true;
      if (expression.includes('window.__ASHEN_DEBUG__?.advanceTime')) return true;
      if (expression.includes('document.querySelector(\'.sl-root [data-action="start"]\')?.getBoundingClientRect?.().bottom')) {
        return [180, 520, 640];
      }
      if (expression.includes('window.innerWidth')) {
        return [390, 640, 20, 620, 600, true, 'auto', 'sticky', true, 'advanced summary', 'none'];
      }
      return true;
    },
    async takeScreenshot(outputPath) {
      fs.writeFileSync(outputPath, '', 'utf8');
    },
    async press() {},
  };

  const result = await runTitleLoadoutAccessibilityScenario('http://127.0.0.1:4173', artifactDir, transport);

  assert.equal(startFallbackUsed, true, 'DOM fallback이 호출되지 않음');
  assert.equal(result.assertions.startRunWorks, true, 'fallback 이후에도 PlayScene 진입이 완료되어야 함');
});

test('title meta shop smoke는 Meta Shop ref click 실패 시 DOM fallback으로 계속 진행한다', async () => {
  const artifactDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ashen-smoke-shop-'));
  let shopFallbackUsed = false;

  const transport = {
    async open() {},
    async pollEval(expression) {
      if (expression.includes('[data-action="shop"]')) return true;
      if (expression.includes('getSnapshot')) return { scene: 'MetaShopScene' };
      if (expression.includes('localStorage.getItem')) {
        return { meta: { currency: 950, permanentUpgrades: { hp_up: 1 } } };
      }
      return true;
    },
    async clickByText(label) {
      if (label === 'Meta Shop') return false;
      return true;
    },
    async evalJson(expression) {
      if (expression.includes('[data-action="shop"]')) {
        shopFallbackUsed = true;
        return true;
      }
      if (expression.includes('window.__ASHEN_DEBUG__ ? ((')) return true;
      if (expression.includes("document.querySelector('.ms-buy-btn:not([disabled])')?.dataset?.id")) return 'hp_up';
      if (expression.includes("document.querySelector('.ms-buy-btn:not([disabled])') ?")) return true;
      if (expression.startsWith('[Boolean(document.querySelector(\'.ms-root\'))')) return [true, 2, '999'];
      return true;
    },
    async takeScreenshot(outputPath) {
      fs.writeFileSync(outputPath, '', 'utf8');
    },
  };

  const result = await runTitleMetaShopScenario('http://127.0.0.1:4173', artifactDir, transport);

  assert.equal(shopFallbackUsed, true, 'Meta Shop DOM fallback이 호출되지 않음');
  assert.equal(result.assertions.scene, true, 'fallback 이후에도 MetaShopScene 진입이 완료되어야 함');
});

await summary();
