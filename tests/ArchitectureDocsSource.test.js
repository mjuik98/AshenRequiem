import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import {
  projectPathExists,
  readProjectJson,
  readOptionalProjectSource,
  readProjectSource,
} from './helpers/sourceInspection.js';

console.log('\n[ArchitectureDocsSource]');

const { test, summary } = createRunner('ArchitectureDocsSource');

const readmeSource = readProjectSource('../README.md');
const agentsSource = readProjectSource('../AGENTS.md');
const architectureSource = readProjectSource('../docs/architecture-current.md');
const moduleMapSource = readOptionalProjectSource('../docs/module-map.md');
const maintenanceScriptsSource = readOptionalProjectSource('../docs/maintenance-scripts.md');
const checkArchitectureDocsSource = readProjectSource('../scripts/checkArchitectureDocs.mjs');
const packageJson = readProjectJson('../package.json');

function normalizeLineEndings(source) {
  return source.replace(/\r\n/g, '\n');
}

test('architecture snapshot tooling exposes generated docs sections and an npm script', async () => {
  const snapshotModule = await import('../scripts/architectureSnapshot.mjs');
  const wrapperModule = await import('../scripts/compatibilityWrappers.mjs');
  assert.equal(typeof snapshotModule.getArchitectureSnapshot, 'function', 'architecture snapshot loader가 없음');
  assert.equal(typeof snapshotModule.renderArchitectureSnapshotSections, 'function', 'architecture snapshot section renderer가 없음');
  assert.equal(typeof wrapperModule.collectWrapperUsageSnapshot, 'function', 'wrapper usage snapshot helper가 없음');
  assert.equal(typeof wrapperModule.renderWrapperInventorySections, 'function', 'wrapper inventory section renderer가 없음');
  assert.equal(typeof packageJson.scripts['architecture:snapshot'], 'string', 'package.json에 architecture:snapshot 스크립트가 없음');
  assert.equal(typeof packageJson.scripts['compatibility:wrappers'], 'string', 'package.json에 compatibility:wrappers 스크립트가 없음');
  assert.equal(typeof packageJson.scripts['check:cycles'], 'string', 'package.json에 check:cycles 스크립트가 없음');
  assert.equal(typeof packageJson.scripts['check:architecture-docs'], 'string', 'package.json에 check:architecture-docs 스크립트가 없음');
});

test('current architecture doc includes the generated scene, pipeline, and verify sections', async () => {
  const snapshotModule = await import('../scripts/architectureSnapshot.mjs');
  const snapshot = await snapshotModule.getArchitectureSnapshot();
  const sections = snapshotModule.renderArchitectureSnapshotSections(snapshot);
  const normalizedArchitectureSource = normalizeLineEndings(architectureSource);

  assert.equal(normalizedArchitectureSource.includes(normalizeLineEndings(sections.sceneSection)), true, 'architecture-current 문서의 scene section이 생성 스냅샷과 다름');
  assert.equal(normalizedArchitectureSource.includes(normalizeLineEndings(sections.pipelineSection)), true, 'architecture-current 문서의 pipeline section이 생성 스냅샷과 다름');
  assert.equal(normalizedArchitectureSource.includes(normalizeLineEndings(sections.verifySection)), true, 'architecture-current 문서의 verify section이 생성 스냅샷과 다름');
});

test('module map documents stable owners and deprecated ambiguity zones', () => {
  assert.equal(moduleMapSource.includes('Module Map'), true, 'module map 문서 헤더가 없음');
  assert.equal(moduleMapSource.includes('play'), true, 'module map이 play owner를 설명하지 않음');
  assert.equal(moduleMapSource.includes('meta'), true, 'module map이 meta owner를 설명하지 않음');
  assert.equal(moduleMapSource.includes('catalog'), true, 'module map이 catalog owner를 설명하지 않음');
  assert.equal(moduleMapSource.includes('platform'), true, 'module map이 platform owner를 설명하지 않음');
  assert.equal(moduleMapSource.includes('shared'), true, 'module map이 shared owner를 설명하지 않음');
  assert.equal(moduleMapSource.includes('compat'), true, 'module map이 compat owner를 설명하지 않음');
  assert.equal(moduleMapSource.includes('src/progression'), true, 'module map이 deprecated progression ambiguity zone을 기록하지 않음');
  assert.equal(moduleMapSource.includes('sessionSnapshot'), true, 'module map이 settings session snapshot owner를 설명하지 않음');
  assert.equal(moduleMapSource.includes('metaShopPurchaseDomain'), true, 'module map이 meta shop purchase owner를 설명하지 않음');
  assert.equal(moduleMapSource.includes('compatibility wrapper'), true, 'module map이 compatibility wrapper 정책을 기록하지 않음');
  assert.equal(architectureSource.includes('docs/module-map.md'), true, 'architecture-current가 module map을 참조하지 않음');
  assert.equal(architectureSource.includes('sessionSnapshotQueryService.js'), true, 'architecture-current가 settings session snapshot owner를 기록하지 않음');
  assert.equal(architectureSource.includes('metaShopPurchaseDomain.js'), true, 'architecture-current가 meta shop purchase owner를 기록하지 않음');
  assert.equal(checkArchitectureDocsSource.includes('module-map.md'), true, 'architecture-doc drift checker가 module map을 검사하지 않음');
  assert.equal(checkArchitectureDocsSource.includes('sessionSnapshot'), true, 'architecture-doc drift checker가 settings session snapshot owner guidance를 검사하지 않음');
  assert.equal(checkArchitectureDocsSource.includes('metaShopPurchaseDomain'), true, 'architecture-doc drift checker가 meta shop purchase owner guidance를 검사하지 않음');
});

test('README links the snapshot workflow and keeps verify command terminology aligned', () => {
  assert.equal(readmeSource.includes('architecture-current.md'), true, 'README가 현재 구조 문서를 가리키지 않음');
  assert.equal(readmeSource.includes('npm run architecture:snapshot'), true, 'README가 architecture snapshot 갱신 명령을 안내하지 않음');
  assert.equal(readmeSource.includes('npm run compatibility:wrappers'), true, 'README가 wrapper snapshot 갱신 명령을 안내하지 않음');
  assert.equal(readmeSource.includes('maintenance-scripts.md'), true, 'README가 maintenance scripts 문서를 가리키지 않음');
  assert.equal(readmeSource.includes('npm run verify:smoke'), true, 'README가 로컬 smoke verify 명령을 안내하지 않음');
  assert.equal(readmeSource.includes('npm run verify:ci'), true, 'README가 CI verify 명령을 안내하지 않음');
  assert.equal(readmeSource.includes('npm run lint'), true, 'README가 lint baseline을 안내하지 않음');
  assert.equal(readmeSource.includes('npm run check:cycles'), true, 'README가 import cycle 검사를 안내하지 않음');
  assert.equal(readmeSource.includes('npm run check:architecture-docs'), true, 'README가 architecture doc drift 검사를 안내하지 않음');
});

test('maintenance script inventory documents internal helpers and manual-only tools separately', () => {
  assert.equal(maintenanceScriptsSource.includes('Maintenance Scripts'), true, 'maintenance script inventory 문서 헤더가 없음');
  assert.equal(maintenanceScriptsSource.includes('scripts/architectureSnapshot.mjs'), true, 'architectureSnapshot tool 역할이 문서화되지 않음');
  assert.equal(maintenanceScriptsSource.includes('scripts/compatibilityWrappers.mjs'), true, 'compatibilityWrappers tool 역할이 문서화되지 않음');
  assert.equal(maintenanceScriptsSource.includes('scripts/importGraph.mjs'), true, 'importGraph helper 역할이 문서화되지 않음');
  assert.equal(maintenanceScriptsSource.includes('scripts/checkCycles.mjs'), true, 'checkCycles helper 역할이 문서화되지 않음');
  assert.equal(maintenanceScriptsSource.includes('scripts/addTsCheck.js'), true, 'addTsCheck tool 역할이 문서화되지 않음');
  assert.equal(/manual-only|수동 유지보수/i.test(maintenanceScriptsSource), true, 'manual-only maintenance tool 구분이 문서화되지 않음');
  assert.equal(/check:boundaries/.test(maintenanceScriptsSource), true, 'maintenance scripts 문서가 실제 baseline 연결을 설명하지 않음');
  assert.equal(/check:cycles/.test(maintenanceScriptsSource), true, 'maintenance scripts 문서가 cycle baseline 연결을 설명하지 않음');
});

test('compatibility wrapper inventory documents remaining public shims and their disposition', async () => {
  const wrapperSource = readProjectSource('../docs/compatibility-wrappers.md');
  const wrapperModule = await import('../scripts/compatibilityWrappers.mjs');
  const snapshot = wrapperModule.collectWrapperUsageSnapshot();
  const zeroCallerWrappers = snapshot.filter((entry) => entry.internalCallers === 0).map((entry) => entry.path);

  assert.equal(wrapperSource.includes('Wrapper Inventory'), true, 'wrapper inventory 문서 헤더가 없음');
  assert.equal(wrapperSource.includes('src/core/Game.js'), true, 'Game facade 판정이 문서화되지 않음');
  assert.equal(wrapperSource.includes('src/scenes/play/PlayResultHandler.js'), true, 'PlayResultHandler 판정이 문서화되지 않음');
  assert.equal(wrapperSource.includes('src/state/session/sessionRepository.js'), true, 'sessionRepository facade 판정이 문서화되지 않음');
  assert.equal(wrapperSource.includes('src/state/session/sessionStorage.js'), true, 'sessionStorage facade 판정이 문서화되지 않음');
  assert.equal(wrapperSource.includes('src/state/sessionMeta.js'), true, 'sessionMeta facade 판정이 문서화되지 않음');
  assert.equal(wrapperSource.includes('keep-public-wrapper'), true, 'wrapper disposition taxonomy가 문서화되지 않음');
  assert.equal(wrapperSource.includes('zero-caller'), true, 'dead wrapper 정리 원칙이 문서화되지 않음');
  assert.equal(wrapperSource.includes('## Generated Wrapper Usage Snapshot'), true, 'wrapper inventory에 generated usage snapshot section이 없음');
  assert.equal(wrapperSource.includes('internalCallers'), true, 'wrapper inventory가 repo 내부 caller 수를 기록하지 않음');
  assert.equal(
    zeroCallerWrappers.length,
    0,
    'repo 내부 caller가 0인 wrapper는 inventory에 남기지 않아야 함',
  );
  assert.equal(
    wrapperModule.WRAPPER_INVENTORY.every((entry) => entry.disposition === '`keep-public-wrapper`'),
    true,
    '남아 있는 wrapper inventory는 keep-public-wrapper만 포함해야 함',
  );
  assert.equal(wrapperSource.includes('src/scenes/play/playerSpawnRuntime.js'), false, '삭제된 dead wrapper가 inventory 문서에 남아 있음');
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
  assert.equal(projectPathExists('../src/scenes/ResultScene.js'), false, '죽은 ResultScene placeholder가 아직 남아 있음');
  assert.equal(projectPathExists('../src/managers/poolResets.js'), false, '호출자 없는 poolResets re-export가 아직 남아 있음');
  assert.equal(projectPathExists('../src/renderer/IRenderer.js'), false, '미사용 IRenderer 추상화 파일이 아직 남아 있음');
  assert.equal(projectPathExists('../src/systems/progression/unlockEvaluator.js'), false, '호출자 없는 unlockEvaluator wrapper가 아직 남아 있음');
  assert.equal(projectPathExists('../src/utils/spawnUtils.js'), false, '호출자 없는 spawnUtils helper가 아직 남아 있음');
  assert.equal(projectPathExists('../src/utils/clamp.js'), false, '호출자 없는 clamp helper가 아직 남아 있음');
});

summary();
