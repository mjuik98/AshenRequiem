import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRunner } from './helpers/testRunner.js';

console.log('\n[ArchitectureDocsSource]');

const { test, summary } = createRunner('ArchitectureDocsSource');

const readmeSource = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
const agentsSource = readFileSync(new URL('../AGENTS.md', import.meta.url), 'utf8');
const architectureSource = readFileSync(new URL('../docs/architecture-current.md', import.meta.url), 'utf8');
const assetManagerSource = readFileSync(new URL('../src/managers/AssetManager.js', import.meta.url), 'utf8');
const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('architecture snapshot tooling exposes generated docs sections and an npm script', async () => {
  const snapshotModule = await import('../scripts/architectureSnapshot.mjs');
  assert.equal(typeof snapshotModule.getArchitectureSnapshot, 'function', 'architecture snapshot loader가 없음');
  assert.equal(typeof snapshotModule.renderArchitectureSnapshotSections, 'function', 'architecture snapshot section renderer가 없음');
  assert.equal(typeof packageJson.scripts['architecture:snapshot'], 'string', 'package.json에 architecture:snapshot 스크립트가 없음');
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
  assert.equal(readmeSource.includes('npm run verify:ci'), true, 'README가 CI verify 명령을 안내하지 않음');
});

test('AGENTS documents the split between normative rules and current-state facts', () => {
  assert.equal(agentsSource.includes('`AGENTS.md`는 **규범 문서**다.'), true, 'AGENTS가 규범 문서 역할을 명시하지 않음');
  assert.equal(agentsSource.includes('`docs/architecture-current.md`'), true, 'AGENTS가 현재 상태 문서를 가리키지 않음');
});

test('legacy MVP-only comments are removed from active runtime modules', () => {
  assert.equal(assetManagerSource.includes('MVP 전략'), false, 'AssetManager에 초기 MVP 주석이 남아 있음');
  assert.equal(assetManagerSource.includes('MVP에서는 SoundSystem'), false, 'AssetManager에 낡은 MVP 사운드 설명이 남아 있음');
});

summary();
