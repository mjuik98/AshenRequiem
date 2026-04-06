import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import {
  projectPathExists,
  readProjectSource,
} from './helpers/sourceInspection.js';

console.log('\n[RepoMaintenance]');

const { test, summary } = createRunner('RepoMaintenance');

const gitignoreSource = readProjectSource('../.gitignore');
const viteConfigSource = readProjectSource('../vite.config.js');
const readmeSource = readProjectSource('../README.md');

test('repo는 핵심 아키텍처 문서만 visible로 두고 superpowers 작업 문서는 격리한다', () => {
  assert.equal(
    gitignoreSource.includes('!docs/architecture-current.md'),
    true,
    '.gitignore가 architecture-current 문서를 예외 처리하지 않음',
  );
  assert.equal(
    gitignoreSource.includes('!docs/compatibility-wrappers.md'),
    true,
    '.gitignore가 compatibility wrapper 문서를 예외 처리하지 않음',
  );
  assert.equal(
    gitignoreSource.includes('!docs/maintenance-scripts.md'),
    true,
    '.gitignore가 maintenance script 문서를 예외 처리하지 않음',
  );
  assert.equal(
    gitignoreSource.includes('docs/superpowers/'),
    true,
    '.gitignore가 superpowers 작업 문서를 격리하지 않음',
  );
});

test('vite build는 compressed size 계산을 끄고 반복 verify 시간을 줄인다', () => {
  assert.match(
    viteConfigSource,
    /reportCompressedSize:\s*false/,
    'vite build가 compressed size 계산을 비활성화하지 않음',
  );
});

test('progression legacy wrapper는 제거된다', () => {
  assert.equal(projectPathExists('../src/systems/progression/upgradeChoicePool.js'), false, 'legacy progression wrapper가 남아 있음');
  assert.equal(projectPathExists('../src/systems/progression/upgradeFallbackChoices.js'), false, 'legacy fallback wrapper가 남아 있음');
  assert.equal(projectPathExists('../src/scenes/play/playSceneRuntime.js'), false, 'legacy playSceneRuntime wrapper가 남아 있음');
  assert.equal(projectPathExists('../src/scenes/play/playSceneOverlays.js'), false, 'legacy playSceneOverlays wrapper가 남아 있음');
  assert.equal(projectPathExists('../src/scenes/title/titleLoadout.js'), false, 'legacy titleLoadout wrapper가 남아 있음');
  assert.equal(projectPathExists('../src/state/startLoadoutRuntime.js'), false, 'legacy startLoadoutRuntime wrapper가 남아 있음');
});

test('README는 유지보수 관점의 폴더 구조와 환경 변수 계약을 문서화한다', () => {
  assert.equal(readmeSource.includes('## 폴더 구조'), true, 'README에 폴더 구조 섹션이 없음');
  assert.equal(readmeSource.includes('## 환경 변수 및 디버그 플래그'), true, 'README에 환경 변수 섹션이 없음');
  assert.equal(readmeSource.includes('TEST_JOBS'), true, 'README가 test runner 환경 변수를 설명하지 않음');
  assert.equal(readmeSource.includes('ASHEN_SMOKE_DEBUG'), true, 'README가 smoke debug 환경 변수를 설명하지 않음');
  assert.equal(readmeSource.includes('?profilePipeline'), true, 'README가 pipeline profile query flag를 설명하지 않음');
  assert.equal(readmeSource.includes('?forceTouchHud'), true, 'README가 touch HUD query flag를 설명하지 않음');
  assert.equal(readmeSource.includes('__ASHEN_RUNTIME_DEBUG__'), true, 'README가 runtime debug scope flag를 설명하지 않음');
  assert.equal(readmeSource.includes('__ASHEN_DEBUG_RUNTIME__'), true, 'README가 runtime hook global flag를 설명하지 않음');
});

test('repo는 local scratch 로그와 superpowers 작업 문서를 tracked 상태로 남기지 않는다', () => {
  assert.equal(projectPathExists('../progress.md'), false, 'legacy progress log가 아직 남아 있음');
  assert.equal(projectPathExists('../status.txt'), false, 'legacy status log가 아직 남아 있음');
  assert.equal(
    projectPathExists('../docs/superpowers/plans/2026-03-28-game-studio-operability-push.md'),
    false,
    'tracked superpowers plan scratch 문서가 아직 남아 있음',
  );
  assert.equal(
    projectPathExists('../docs/superpowers/specs/2026-03-31-ashen-gothic-seamless-background-design.md'),
    false,
    'tracked superpowers spec scratch 문서가 아직 남아 있음',
  );
});

summary();
