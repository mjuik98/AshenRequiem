import assert from 'node:assert/strict';
import { test, summary } from './helpers/testRunner.js';

let actionButtonTheme;

try {
  actionButtonTheme = await import('../src/ui/shared/actionButtonTheme.js');
} catch (error) {
  console.warn('[테스트] actionButtonTheme import 실패 — 스킵:', error.message);
  process.exit(1);
}

console.log('\n[ActionButtonTheme]');

test('공통 action button theme는 modal tone alias를 실제 버튼 tone으로 노출한다', () => {
  const { ACTION_BUTTON_THEME, ACTION_BUTTON_SHARED_CSS, renderActionButton } = actionButtonTheme;

  assert.equal(typeof ACTION_BUTTON_THEME.loadout, 'object', 'loadout tone alias가 없음');
  assert.equal(typeof ACTION_BUTTON_THEME.pause, 'object', 'pause tone alias가 없음');
  assert.equal(typeof ACTION_BUTTON_THEME.reward, 'object', 'reward tone alias가 없음');
  assert.equal(typeof ACTION_BUTTON_THEME['result-victory'], 'object', 'result-victory tone alias가 없음');
  assert.equal(typeof ACTION_BUTTON_THEME['result-defeat'], 'object', 'result-defeat tone alias가 없음');
  assert.match(ACTION_BUTTON_SHARED_CSS, /\.ui-action-btn--loadout\b/);
  assert.match(ACTION_BUTTON_SHARED_CSS, /\.ui-action-btn--pause\b/);
  assert.match(ACTION_BUTTON_SHARED_CSS, /\.ui-action-btn--reward\b/);
  assert.match(ACTION_BUTTON_SHARED_CSS, /\.ui-action-btn--result-victory\b/);
  assert.match(ACTION_BUTTON_SHARED_CSS, /\.ui-action-btn--result-defeat\b/);
  assert.equal(
    renderActionButton({ label: '시작', tone: 'pause' }).includes('ui-action-btn--pause'),
    true,
    'pause tone alias가 실제 버튼 class에 반영되지 않음',
  );
});

summary();
