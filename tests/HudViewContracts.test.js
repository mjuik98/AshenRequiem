import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { readProjectSource } from './helpers/sourceInspection.js';

console.log('\n[HudViewContracts]');

const { test, summary } = createRunner('HudViewContracts');
const hudSource = readProjectSource('../src/ui/hud/HudView.js');

test('HUD는 시간/킬과 함께 이번 런 골드 영역을 노출한다', () => {
  assert.equal(hudSource.includes('hud-gold'), true, 'HUD 골드 슬롯 클래스가 없음');
  assert.equal(hudSource.includes('runCurrencyEarned'), true, 'HUD가 world.runCurrencyEarned를 사용하지 않음');
});

test('HUD는 현재 저주 수치를 별도 영역으로 노출한다', () => {
  assert.equal(hudSource.includes('hud-curse'), true, 'HUD 저주 슬롯 클래스가 없음');
  assert.equal(hudSource.includes('player.curse'), true, 'HUD가 player.curse를 사용하지 않음');
});

test('HUD는 현재 위협, 다음 보스, primary objective를 노출한다', () => {
  assert.equal(hudSource.includes('hud-threat-chip'), true, 'HUD threat chip 클래스가 없음');
  assert.equal(hudSource.includes('hud-boss-chip'), true, 'HUD boss chip 클래스가 없음');
  assert.equal(hudSource.includes('hud-objective-chip'), true, 'HUD objective chip 클래스가 없음');
  assert.equal(hudSource.includes('world.run.encounterState'), true, 'HUD가 encounterState를 사용하지 않음');
  assert.equal(hudSource.includes('world.run.guidance'), true, 'HUD가 run guidance를 사용하지 않음');
});

summary();
