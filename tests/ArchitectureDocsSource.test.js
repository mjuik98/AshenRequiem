import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import {
  projectPathExists,
  readProjectJson,
  readProjectSource,
} from './helpers/sourceInspection.js';

console.log('\n[ArchitectureDocsSource]');

const { test, summary } = createRunner('ArchitectureDocsSource');

const readmeSource = readProjectSource('../README.md');
const agentsSource = readProjectSource('../AGENTS.md');
const architectureSource = readProjectSource('../docs/architecture-current.md');
const packageJson = readProjectJson('../package.json');

test('architecture snapshot tooling exposes generated docs sections and an npm script', async () => {
  const snapshotModule = await import('../scripts/architectureSnapshot.mjs');
  const wrapperModule = await import('../scripts/compatibilityWrappers.mjs');
  assert.equal(typeof snapshotModule.getArchitectureSnapshot, 'function', 'architecture snapshot loader가 없음');
  assert.equal(typeof snapshotModule.renderArchitectureSnapshotSections, 'function', 'architecture snapshot section renderer가 없음');
  assert.equal(typeof wrapperModule.collectWrapperUsageSnapshot, 'function', 'wrapper usage snapshot helper가 없음');
  assert.equal(typeof wrapperModule.renderWrapperInventorySections, 'function', 'wrapper inventory section renderer가 없음');
  assert.equal(typeof packageJson.scripts['architecture:snapshot'], 'string', 'package.json에 architecture:snapshot 스크립트가 없음');
  assert.equal(typeof packageJson.scripts['compatibility:wrappers'], 'string', 'package.json에 compatibility:wrappers 스크립트가 없음');
  assert.equal(typeof packageJson.scripts['check:architecture-docs'], 'string', 'package.json에 check:architecture-docs 스크립트가 없음');
});

test('current architecture doc includes the generated scene, pipeline, and verify sections', async () => {
  const snapshotModule = await import('../scripts/architectureSnapshot.mjs');
  const snapshot = await snapshotModule.getArchitectureSnapshot();
  const sections = snapshotModule.renderArchitectureSnapshotSections(snapshot);

  assert.equal(architectureSource.includes(sections.sceneSection), true, 'architecture-current 문서의 scene section이 생성 스냅샷과 다름');
  assert.equal(architectureSource.includes(sections.pipelineSection), true, 'architecture-current 문서의 pipeline section이 생성 스냅샷과 다름');
  assert.equal(architectureSource.includes(sections.verifySection), true, 'architecture-current 문서의 verify section이 생성 스냅샷과 다름');
});

test('README links the snapshot workflow and keeps verify command terminology aligned', () => {
  assert.equal(readmeSource.includes('architecture-current.md'), true, 'README가 현재 구조 문서를 가리키지 않음');
  assert.equal(readmeSource.includes('npm run architecture:snapshot'), true, 'README가 architecture snapshot 갱신 명령을 안내하지 않음');
  assert.equal(readmeSource.includes('npm run compatibility:wrappers'), true, 'README가 wrapper snapshot 갱신 명령을 안내하지 않음');
  assert.equal(readmeSource.includes('npm run verify:ci'), true, 'README가 CI verify 명령을 안내하지 않음');
  assert.equal(readmeSource.includes('npm run lint'), true, 'README가 lint baseline을 안내하지 않음');
  assert.equal(readmeSource.includes('npm run check:architecture-docs'), true, 'README가 architecture doc drift 검사를 안내하지 않음');
});

test('compatibility wrapper inventory documents remaining public shims and their disposition', () => {
  const wrapperSource = readProjectSource('../docs/compatibility-wrappers.md');
  assert.equal(wrapperSource.includes('Wrapper Inventory'), true, 'wrapper inventory 문서 헤더가 없음');
  assert.equal(wrapperSource.includes('src/core/Game.js'), true, 'Game facade 판정이 문서화되지 않음');
  assert.equal(wrapperSource.includes('src/scenes/play/PlayResultHandler.js'), true, 'PlayResultHandler 판정이 문서화되지 않음');
  assert.equal(wrapperSource.includes('keep-public-wrapper'), true, 'wrapper disposition taxonomy가 문서화되지 않음');
  assert.equal(wrapperSource.includes('## Generated Wrapper Usage Snapshot'), true, 'wrapper inventory에 generated usage snapshot section이 없음');
  assert.equal(wrapperSource.includes('internalCallers'), true, 'wrapper inventory가 repo 내부 caller 수를 기록하지 않음');
});

test('AGENTS documents the split between normative rules and current-state facts', () => {
  assert.equal(agentsSource.includes('`AGENTS.md`는 **규범 문서**다.'), true, 'AGENTS가 규범 문서 역할을 명시하지 않음');
  assert.equal(agentsSource.includes('`docs/architecture-current.md`'), true, 'AGENTS가 현재 상태 문서를 가리키지 않음');
  assert.equal(agentsSource.includes('| 0   | WorldTickSystem'), false, 'AGENTS에 현재 파이프라인 표가 남아 있어 규범/사실 경계가 다시 섞임');
  assert.equal(agentsSource.includes('구체 priority와 현재 등록 순서는 `docs/architecture-current.md`'), true, 'AGENTS가 현재 파이프라인 순서를 architecture-current로 위임하지 않음');
  assert.equal(agentsSource.includes('`lint:eslint`'), true, 'AGENTS가 edit-time lint guard를 명시하지 않음');
  assert.equal(agentsSource.includes('`check:boundaries`'), true, 'AGENTS가 boundary SSOT guard를 명시하지 않음');
});

test('legacy MVP-only comments are removed from active runtime modules', () => {
  assert.equal(projectPathExists('../src/managers/AssetManager.js'), false, '유휴 AssetManager가 아직 남아 있음');
});

summary();
