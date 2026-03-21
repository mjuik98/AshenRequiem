import assert from 'node:assert/strict';
import { test, summary } from './helpers/testRunner.js';

let SUBSCREEN_BACK_LABEL;
let SUBSCREEN_SHARED_CSS;
let SUBSCREEN_THEME;
let renderSubscreenHeader;
let renderSubscreenFooter;

try {
  ({
    SUBSCREEN_BACK_LABEL,
    SUBSCREEN_SHARED_CSS,
    SUBSCREEN_THEME,
    renderSubscreenHeader,
    renderSubscreenFooter,
  } = await import('../src/ui/shared/subscreenTheme.js'));
} catch (e) {
  console.warn('[테스트] subscreenTheme import 실패 — 스킵:', e.message);
  process.exit(1);
}

console.log('\n[SubscreenTheme]');

test('공통 서브스크린 토큰은 복귀 라벨과 공유 CSS를 제공한다', () => {
  assert.equal(SUBSCREEN_BACK_LABEL, '← 메인 화면으로');
  assert.equal(typeof SUBSCREEN_THEME.background, 'string');
  assert.match(SUBSCREEN_SHARED_CSS, /\.ss-root\s*\{/);
  assert.match(SUBSCREEN_SHARED_CSS, /\.ss-panel\s*\{/);
  assert.match(SUBSCREEN_SHARED_CSS, /\.ss-back-btn\s*\{/);
});

test('공통 서브스크린 helper는 헤더와 푸터 마크업을 생성한다', () => {
  assert.equal(typeof renderSubscreenHeader, 'function');
  assert.equal(typeof renderSubscreenFooter, 'function');

  const header = renderSubscreenHeader({
    rune: '⚙',
    title: 'Settings',
    subtitle: '옵션 조정',
    right: '<span>meta</span>',
  });
  const footer = renderSubscreenFooter();

  assert.match(header, /ss-header/);
  assert.match(header, /ss-rune/);
  assert.match(header, /Settings/);
  assert.match(footer, /ss-back-btn/);
  assert.match(footer, /메인 화면으로/);
});

summary();
