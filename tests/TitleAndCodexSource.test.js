import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test, summary } from './helpers/testRunner.js';
import { makeSessionState } from './fixtures/index.js';
import { TITLE_SCREEN_HTML } from '../src/scenes/title/titleScreenContent.js';
import {
  buildCodexAchievements,
  buildCodexUnlockEntries,
  isCodexWeaponUnlocked,
} from '../src/ui/codex/codexRecords.js';
import {
  SUBSCREEN_BACK_LABEL,
  SUBSCREEN_SHARED_CSS,
  renderSubscreenFooter,
} from '../src/ui/shared/subscreenTheme.js';
import { SETTINGS_VIEW_CSS } from '../src/ui/settings/settingsViewStyles.js';

const titleScenePath = new URL('../src/scenes/TitleScene.js', import.meta.url);
const codexViewPath = new URL('../src/ui/codex/CodexView.js', import.meta.url);
const startLoadoutViewPath = new URL('../src/ui/title/StartLoadoutView.js', import.meta.url);
const metaShopViewPath = new URL('../src/ui/metashop/MetaShopView.js', import.meta.url);
const settingsViewPath = new URL('../src/ui/settings/SettingsView.js', import.meta.url);

const titleSceneSource = readFileSync(titleScenePath, 'utf8');
const codexViewSource = readFileSync(codexViewPath, 'utf8');
const metaShopViewSource = readFileSync(metaShopViewPath, 'utf8');
const settingsViewSource = readFileSync(settingsViewPath, 'utf8');
const startLoadoutViewExists = existsSync(startLoadoutViewPath);
const startLoadoutViewSource = startLoadoutViewExists
  ? readFileSync(startLoadoutViewPath, 'utf8')
  : '';

console.log('\n[TitleAndCodexSource]');

test('시작 무기 선택 뷰 파일이 존재한다', () => {
  assert.equal(startLoadoutViewExists, true, 'StartLoadoutView.js 파일이 아직 없음');
});

test('TitleScene가 시작 무기 선택 뷰를 통해 게임 시작을 중계한다', () => {
  assert.equal(titleSceneSource.includes('StartLoadoutView'), true, 'TitleScene에 StartLoadoutView 연결이 없음');
  assert.equal(titleSceneSource.includes('buildTitleLoadoutConfig'), true, 'TitleScene이 시작 로드아웃 헬퍼를 사용하지 않음');
});

test('TitleScene 종료 버튼은 더 이상 비활성이 아니고 종료 처리 경로를 가진다', () => {
  assert.equal(
    TITLE_SCREEN_HTML.includes('data-action="quit" type="button" aria-disabled="true"'),
    false,
    '종료 버튼이 아직 aria-disabled 상태로 남아 있음',
  );
  assert.equal(titleSceneSource.includes('window.close()'), true, 'TitleScene에 브라우저 종료 시도가 없음');
  assert.equal(titleSceneSource.includes('브라우저가 종료를 차단했습니다.'), true, '종료 실패 안내 문구가 없음');
});

test('StartLoadoutView가 시작 무기 선택 UI 문구를 가진다', () => {
  assert.equal(startLoadoutViewSource.includes('시작 무기 선택'), true, '시작 무기 선택 헤더가 없음');
  assert.equal(startLoadoutViewSource.includes('시작하기'), true, '시작하기 버튼이 없음');
});

test('CodexView가 해금 보상 섹션을 렌더링한다', () => {
  const session = makeSessionState({
    meta: {
      completedUnlocks: ['unlock_boomerang'],
      enemyKills: { skeleton: 25 },
      weaponsUsedAll: ['magic_bolt'],
      evolvedWeapons: ['arcane_tempest'],
    },
    best: {
      survivalTime: 120,
      level: 6,
    },
  });
  const entries = buildCodexUnlockEntries(session);

  assert.equal(entries.length > 0, true, '해금 보상 엔트리가 없음');
  assert.equal(entries.some((entry) => entry.done), true, '해금 완료 상태를 계산하지 않음');
  assert.equal(entries.every((entry) => typeof entry.progressText === 'string'), true, '해금 진행 문구가 없음');
});

test('CodexView 무기 도감은 진화 무기 발견 여부를 evolvedWeapons로도 판정한다', () => {
  const session = makeSessionState({
    meta: {
      weaponsUsedAll: ['magic_bolt'],
      evolvedWeapons: ['arcane_tempest'],
    },
  });

  assert.equal(isCodexWeaponUnlocked({ id: 'magic_bolt', isEvolved: false }, session), true);
  assert.equal(isCodexWeaponUnlocked({ id: 'arcane_tempest', isEvolved: true }, session), true);
  assert.equal(isCodexWeaponUnlocked({ id: 'frozen_orb', isEvolved: true }, session), false);
});

test('타이틀 하위 화면은 공통 ss-root로 스크롤과 포인터 입력을 처리한다', () => {
  assert.equal(codexViewSource.includes('ss-root'), true, 'CodexView가 공통 ss-root를 사용하지 않음');
  assert.equal(metaShopViewSource.includes('ss-root'), true, 'MetaShopView가 공통 ss-root를 사용하지 않음');
  assert.equal(settingsViewSource.includes('ss-root'), true, 'SettingsView가 공통 ss-root를 사용하지 않음');
});

test('타이틀 하위 화면의 닫기 버튼 문구는 메인 화면으로로 통일된다', () => {
  const footerHtml = renderSubscreenFooter();
  assert.equal(footerHtml.includes(SUBSCREEN_BACK_LABEL), true, '공통 footer 기본 복귀 문구가 잘못됨');
  assert.equal(codexViewSource.includes('renderSubscreenFooter'), true, 'Codex 닫기 문구가 공통 footer helper로 통일되지 않음');
  assert.equal(metaShopViewSource.includes('메인 화면으로'), true, 'MetaShop 닫기 문구가 통일되지 않음');
  assert.equal(codexViewSource.includes('돌아가기'), false, 'Codex에 이전 닫기 문구가 남아 있음');
  assert.equal(metaShopViewSource.includes('메인화면으로'), false, 'MetaShop에 이전 닫기 문구가 남아 있음');
  assert.equal(settingsViewSource.includes('← 뒤로'), false, 'Settings에 이전 닫기 문구가 남아 있음');
});

test('타이틀 하위 화면은 공통 서브스크린 테마를 사용한다', () => {
  assert.equal(SUBSCREEN_SHARED_CSS.includes('.ss-root'), true, '공통 서브스크린 테마 root 스타일이 없음');
  assert.equal(codexViewSource.includes('SUBSCREEN_SHARED_CSS'), true, 'CodexView가 공통 서브스크린 테마를 사용하지 않음');
  assert.equal(metaShopViewSource.includes('SUBSCREEN_SHARED_CSS'), true, 'MetaShopView가 공통 서브스크린 테마를 사용하지 않음');
  assert.equal(SETTINGS_VIEW_CSS.includes('.ss-root'), true, 'SettingsView 스타일이 공통 서브스크린 테마를 포함하지 않음');
  assert.equal(codexViewSource.includes('renderSubscreenFooter'), true, 'CodexView가 공통 복귀 footer helper를 사용하지 않음');
  assert.equal(metaShopViewSource.includes('renderSubscreenFooter'), true, 'MetaShopView가 공통 복귀 footer helper를 사용하지 않음');
  assert.equal(settingsViewSource.includes('renderSubscreenFooter'), true, 'SettingsView가 공통 복귀 footer helper를 사용하지 않음');
});

test('Codex 기록 helper는 업적 진행도와 도감 발견 비율을 계산한다', () => {
  const session = makeSessionState({
    meta: {
      enemyKills: { skeleton: 70, lich: 1 },
      killedBosses: ['boss_lich'],
      weaponsUsedAll: ['magic_bolt', 'fire_orb'],
      evolvedWeapons: ['arcane_tempest'],
      totalRuns: 4,
    },
    best: {
      survivalTime: 650,
      level: 22,
    },
  });
  const achievements = buildCodexAchievements(session, {
    enemyData: [{ id: 'skeleton' }, { id: 'lich' }],
    weaponData: [{ id: 'magic_bolt' }, { id: 'fire_orb' }, { id: 'arcane_tempest', isEvolved: true }],
  });

  assert.equal(achievements.some((entry) => entry.name === '보스 사냥꾼' && entry.done), true);
  assert.equal(achievements.some((entry) => entry.name === '생존자' && entry.done), true);
  assert.equal(achievements.some((entry) => entry.name === '전설적인 런' && entry.done), true);
});

test('Settings 헤더는 저장 안내 pill을 더 이상 렌더링하지 않는다', () => {
  assert.equal(
    settingsViewSource.includes('저장 후 메인 화면으로 복귀'),
    false,
    'Settings 헤더 우측 저장 안내 pill이 아직 남아 있음',
  );
});

test('Meta Shop 헤더는 최고 기록 pill 묶음을 더 이상 렌더링하지 않는다', () => {
  assert.equal(metaShopViewSource.includes('ms-best-row'), false, 'Meta Shop 헤더에 최고 기록 row가 아직 남아 있음');
  assert.equal(metaShopViewSource.includes('best.level'), false, 'Meta Shop 헤더가 최고 레벨을 여전히 렌더링함');
  assert.equal(metaShopViewSource.includes('best.kills'), false, 'Meta Shop 헤더가 킬 수를 여전히 렌더링함');
  assert.equal(metaShopViewSource.includes('best.survivalTime'), false, 'Meta Shop 헤더가 생존 시간을 여전히 렌더링함');
});

test('타이틀 하위 화면은 공통 서브스크린 header/footer helper를 사용한다', () => {
  assert.equal(codexViewSource.includes('renderSubscreenHeader'), true, 'CodexView가 공통 header helper를 사용하지 않음');
  assert.equal(metaShopViewSource.includes('renderSubscreenHeader'), true, 'MetaShopView가 공통 header helper를 사용하지 않음');
  assert.equal(settingsViewSource.includes('renderSubscreenHeader'), true, 'SettingsView가 공통 header helper를 사용하지 않음');
  assert.equal(codexViewSource.includes('renderSubscreenFooter'), true, 'CodexView가 공통 footer helper를 사용하지 않음');
  assert.equal(metaShopViewSource.includes('renderSubscreenFooter'), true, 'MetaShopView가 공통 footer helper를 사용하지 않음');
  assert.equal(settingsViewSource.includes('renderSubscreenFooter'), true, 'SettingsView가 공통 footer helper를 사용하지 않음');
});

summary();
