import { readdirSync, readFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPlayPipelineSnapshot } from '../src/core/architectureSnapshot.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '..');

export function listSceneIds(rootDir = ROOT) {
  const scenesDir = join(rootDir, 'src', 'scenes');
  return readdirSync(scenesDir)
    .filter((fileName) => /^[A-Z][A-Za-z0-9]*Scene\.js$/.test(fileName))
    .map((fileName) => basename(fileName, '.js'))
    .sort();
}

export function getVerifyBaselineSnapshot(rootDir = ROOT) {
  const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8'));
  const workflowSource = readFileSync(join(rootDir, '.github', 'workflows', 'verify.yml'), 'utf8');

  return {
    lint: packageJson.scripts.lint,
    lintArchitecture: packageJson.scripts['lint:architecture'],
    lintEslint: packageJson.scripts['lint:eslint'],
    checkArchitectureDocs: packageJson.scripts['check:architecture-docs'],
    verify: packageJson.scripts.verify,
    verifyFast: packageJson.scripts['verify:fast'],
    verifyCi: packageJson.scripts['verify:ci'],
    profileCheck: packageJson.scripts['profile:check'],
    ciUsesVerifyCi: workflowSource.includes('npm run verify:ci'),
  };
}

export async function getArchitectureSnapshot(rootDir = ROOT) {
  return {
    scenes: listSceneIds(rootDir),
    pipeline: getPlayPipelineSnapshot(),
    verify: getVerifyBaselineSnapshot(rootDir),
  };
}

export function renderArchitectureSnapshotSections(snapshot) {
  const sceneSection = [
    '## Generated Scene Snapshot',
    '',
    'Detected top-level scene modules in `src/scenes/`:',
    '',
    ...snapshot.scenes.map((sceneId) => `- \`${sceneId}\``),
  ].join('\n');

  const pipelineSection = [
    '## Generated Play Pipeline Snapshot',
    '',
    '| Priority | System | Source |',
    '|----------|--------|--------|',
    ...snapshot.pipeline.map(({ priority, name, source }) => `| ${priority} | ${name} | \`${source}\` |`),
  ].join('\n');

  const verifySection = [
    '## Generated Verification Snapshot',
    '',
    `- \`npm run lint\`: \`${snapshot.verify.lint}\``,
    `- \`npm run lint:architecture\`: \`${snapshot.verify.lintArchitecture}\``,
    `- \`npm run lint:eslint\`: \`${snapshot.verify.lintEslint}\``,
    `- \`npm run check:architecture-docs\`: \`${snapshot.verify.checkArchitectureDocs}\``,
    `- \`npm run verify\`: \`${snapshot.verify.verify}\``,
    `- \`npm run verify:fast\`: \`${snapshot.verify.verifyFast}\``,
    `- \`npm run verify:ci\`: \`${snapshot.verify.verifyCi}\``,
    `- \`npm run profile:check\`: \`${snapshot.verify.profileCheck}\``,
    `- CI workflow uses \`npm run verify:ci\`: ${snapshot.verify.ciUsesVerifyCi ? 'yes' : 'no'}`,
  ].join('\n');

  return { sceneSection, pipelineSection, verifySection };
}

export async function renderArchitectureSnapshotMarkdown(rootDir = ROOT) {
  const snapshot = await getArchitectureSnapshot(rootDir);
  const sections = renderArchitectureSnapshotSections(snapshot);
  return [sections.sceneSection, sections.pipelineSection, sections.verifySection].join('\n\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const markdown = await renderArchitectureSnapshotMarkdown(ROOT);
  process.stdout.write(`${markdown}\n`);
}
