import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRunner } from './helpers/testRunner.js';

console.log('\n[HudViewContracts]');

const { test, summary } = createRunner('HudViewContracts');
const hudSource = readFileSync(new URL('../src/ui/hud/HudView.js', import.meta.url), 'utf8');

test('HUD는 시간/킬과 함께 이번 런 골드 영역을 노출한다', () => {
  assert.equal(hudSource.includes('hud-gold'), true, 'HUD 골드 슬롯 클래스가 없음');
  assert.equal(hudSource.includes('runCurrencyEarned'), true, 'HUD가 world.runCurrencyEarned를 사용하지 않음');
});

test('HUD는 현재 저주 수치를 별도 영역으로 노출한다', () => {
  assert.equal(hudSource.includes('hud-curse'), true, 'HUD 저주 슬롯 클래스가 없음');
  assert.equal(hudSource.includes('player.curse'), true, 'HUD가 player.curse를 사용하지 않음');
});

summary();
