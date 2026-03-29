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

test('HUD는 상단 가이드 칩과 설명문을 더 이상 렌더하지 않는다', () => {
  assert.equal(hudSource.includes('hud-guidance-row'), false, 'HUD guidance row가 아직 남아 있음');
  assert.equal(hudSource.includes('hud-threat-chip'), false, 'HUD threat chip 클래스가 아직 남아 있음');
  assert.equal(hudSource.includes('hud-boss-chip'), false, 'HUD boss chip 클래스가 아직 남아 있음');
  assert.equal(hudSource.includes('hud-stage-chip'), false, 'HUD stage chip 클래스가 아직 남아 있음');
  assert.equal(hudSource.includes('hud-modifier-chip'), false, 'HUD modifier chip 클래스가 아직 남아 있음');
  assert.equal(hudSource.includes('hud-objective-chip'), false, 'HUD objective chip 클래스가 아직 남아 있음');
  assert.equal(hudSource.includes('hud-guidance-note'), false, 'HUD guidance note가 아직 남아 있음');
});

summary();
