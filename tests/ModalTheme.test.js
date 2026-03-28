import assert from 'node:assert/strict';
import { test, summary } from './helpers/testRunner.js';

let MODAL_THEME;
let MODAL_SHARED_CSS;

try {
  ({
    MODAL_THEME,
    MODAL_SHARED_CSS,
  } = await import('../src/ui/shared/modalTheme.js'));
} catch (error) {
  console.warn('[테스트] modalTheme import 실패 — 스킵:', error.message);
  process.exit(1);
}

console.log('\n[ModalTheme]');

test('공통 modal theme는 overlay/panel/title/action shell 토큰을 제공한다', () => {
  assert.equal(typeof MODAL_THEME.backdrop, 'string');
  assert.equal(typeof MODAL_THEME.panelBackground, 'string');
  assert.equal(typeof MODAL_THEME.text, 'string');
  assert.match(MODAL_SHARED_CSS, /\.ui-modal-backdrop\s*\{/);
  assert.match(MODAL_SHARED_CSS, /\.ui-modal-shell\s*\{/);
  assert.match(MODAL_SHARED_CSS, /\.ui-modal-panel\s*\{/);
  assert.match(MODAL_SHARED_CSS, /\.ui-modal-eyebrow\s*\{/);
  assert.match(MODAL_SHARED_CSS, /\.ui-modal-title\s*\{/);
  assert.match(MODAL_SHARED_CSS, /\.ui-modal-copy\s*\{/);
  assert.match(MODAL_SHARED_CSS, /\.ui-modal-action-bar\s*\{/);
  assert.match(MODAL_SHARED_CSS, /\.ui-modal-tone--loadout\b/);
  assert.match(MODAL_SHARED_CSS, /\.ui-modal-tone--pause\b/);
  assert.match(MODAL_SHARED_CSS, /\.ui-modal-tone--reward\b/);
  assert.match(MODAL_SHARED_CSS, /\.ui-modal-tone--result-defeat\b/);
});

summary();
