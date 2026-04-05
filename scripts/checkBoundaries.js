import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { ROOT_DIR, collectSourceImports, walkFiles, toProjectRelative } from './importGraph.mjs';

export const SHIM_IMPORT_PATTERNS = [
  'src/state/createWorld.js',
  'src/state/startLoadoutRuntime.js',
  'src/state/sessionMeta.js',
  'src/state/session/sessionStorageDriver.js',
  'src/state/session/sessionRecoveryPolicy.js',
  'src/state/session/sessionRepository.js',
  'src/state/session/sessionStorage.js',
  'src/core/Game.js',
  'src/core/gameRuntime.js',
  'src/core/gameInputRuntime.js',
  'src/core/gameCanvasRuntime.js',
  'src/core/runtimeHost.js',
  'src/core/runtimeFeatureFlags.js',
  'src/core/runtimeHooks.js',
  'src/scenes/play/PlayResultHandler.js',
];

const ALLOWED_SHIM_IMPORTS = new Set([
  'src/scenes/CodexScene.js->src/core/Game.js',
]);

const DOMAIN_FORBIDDEN_SEGMENTS = [
  '/ui/',
  '/renderer/',
  '/adapters/browser/',
  '/scenes/',
];

const PLAY_RESULT_DOMAIN_PATH = 'src/domain/meta/progression/playResultDomain.js';
const RENDER_SYSTEM_PATH = 'src/systems/render/RenderSystem.js';
const SOUND_SFX_CONTROLLER_PATH = 'src/systems/sound/soundSfxController.js';
const PIPELINE_PROFILER_PATH = 'src/systems/debug/PipelineProfiler.js';
const PLAY_CONTEXT_RUNTIME_PATH = 'src/core/playContextRuntime.js';
const RUNTIME_LOGGER_PATH = 'src/utils/runtimeLogger.js';
const SETTINGS_QUERY_SERVICE_PATH = 'src/app/meta/settingsQueryService.js';
const SETTINGS_COMMAND_SERVICE_PATH = 'src/app/meta/settingsCommandService.js';
const SESSION_SNAPSHOT_PREVIEW_PATH = 'src/app/session/sessionSnapshotPreview.js';
const SESSION_SNAPSHOT_CODEC_PATH = 'src/app/session/sessionSnapshotCodec.js';
const SESSION_SNAPSHOT_MUTATION_PATH = 'src/app/session/sessionSnapshotMutationService.js';
const CORE_ALLOWED_IMPORT_SOURCES = new Set([
  'src/core/Game.js',
  'src/core/gameRuntime.js',
  'src/core/gameInputRuntime.js',
  'src/core/gameCanvasRuntime.js',
  'src/core/runtimeHost.js',
  'src/core/runtimeFeatureFlags.js',
  'src/core/runtimeHooks.js',
]);
const SCENE_LOADERS_FACADE_PATH = 'src/scenes/sceneLoaders.js';

function findShimViolations(imports) {
  return imports
    .filter(({ sourceFile, targetFile }) => (
      sourceFile.startsWith('src/')
      && SHIM_IMPORT_PATTERNS.includes(targetFile)
      && !ALLOWED_SHIM_IMPORTS.has(`${sourceFile}->${targetFile}`)
    ))
    .map(({ sourceFile, targetFile }) => ({
      rule: 'compatibility-shim',
      sourceFile,
      targetFile,
      message: `compatibility shim import is forbidden: ${sourceFile} -> ${targetFile}`,
    }));
}

function findDomainViolations(imports) {
  return imports
    .filter(({ sourceFile, targetFile }) => sourceFile.startsWith('src/domain/'))
    .filter(({ targetFile }) => DOMAIN_FORBIDDEN_SEGMENTS.some((segment) => targetFile.includes(segment)))
    .map(({ sourceFile, targetFile }) => ({
      rule: 'domain-boundary',
      sourceFile,
      targetFile,
      message: `domain module crosses forbidden boundary: ${sourceFile} -> ${targetFile}`,
    }));
}

function findSceneToSystemsViolations(imports) {
  return imports
    .filter(({ sourceFile, targetFile }) => sourceFile.startsWith('src/scenes/'))
    .filter(({ targetFile }) => targetFile.startsWith('src/systems/'))
    .map(({ sourceFile, targetFile }) => ({
      rule: 'scene-to-systems',
      sourceFile,
      targetFile,
      message: `scene module imports systems implementation directly: ${sourceFile} -> ${targetFile}`,
    }));
}

function findCoreBoundaryViolations(imports) {
  return imports
    .filter(({ sourceFile }) => sourceFile.startsWith('src/core/') && !CORE_ALLOWED_IMPORT_SOURCES.has(sourceFile))
    .filter(({ targetFile }) => (
      targetFile.startsWith('src/scenes/')
      || targetFile.startsWith('src/ui/')
      || targetFile.startsWith('src/adapters/browser/')
    ))
    .map(({ sourceFile, targetFile }) => ({
      rule: 'core-boundary',
      sourceFile,
      targetFile,
      message: `core module crosses presentation/browser boundary: ${sourceFile} -> ${targetFile}`,
    }));
}

function findSceneToSceneViolations() {
  const scenesRoot = path.join(ROOT_DIR, 'src', 'scenes');
  if (!fs.existsSync(scenesRoot)) return [];

  return walkFiles(scenesRoot).flatMap((filePath) => {
    const sourceFile = toProjectRelative(filePath, ROOT_DIR);
    if (sourceFile === 'src/scenes/sceneLoaders.js') return [];

    const source = fs.readFileSync(filePath, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const matches = [...source.matchAll(/import\s+.+from\s+['"]([^'"]+)['"]/g)];

    return matches
      .map((match) => match[1])
      .filter((specifier) => /^\.\/(?:TitleScene|PlayScene|MetaShopScene|SettingsScene|CodexScene)\.js$/.test(specifier))
      .map((specifier) => ({
        rule: 'scene-to-scene',
        sourceFile,
        targetFile: `src/scenes/${specifier.replace('./', '')}`,
        message: `scene module imports another scene implementation directly: ${sourceFile} -> src/scenes/${specifier.replace('./', '')}`,
      }));
  });
}

function findAppToScenesViolations(imports) {
  return imports
    .filter(({ sourceFile }) => sourceFile.startsWith('src/app/') && !sourceFile.startsWith('src/app/bootstrap/'))
    .filter(({ targetFile }) => targetFile.startsWith('src/scenes/'))
    .map(({ sourceFile, targetFile }) => ({
      rule: 'app-to-scenes',
      sourceFile,
      targetFile,
      message: `application module imports scene implementation directly: ${sourceFile} -> ${targetFile}`,
    }));
}

function findAppToSessionFacadeViolations(imports) {
  return imports
    .filter(({ sourceFile }) => sourceFile.startsWith('src/app/'))
    .filter(({ targetFile }) => targetFile === 'src/state/sessionFacade.js')
    .map(({ sourceFile, targetFile }) => ({
      rule: 'app-to-session-facade',
      sourceFile,
      targetFile,
      message: `application module must depend on concrete session services instead of legacy facade: ${sourceFile} -> ${targetFile}`,
    }));
}

function findPlayResultDomainViolations(imports) {
  return imports
    .filter(({ sourceFile }) => sourceFile === PLAY_RESULT_DOMAIN_PATH)
    .filter(({ targetFile }) => targetFile.startsWith('src/state/'))
    .map(({ sourceFile, targetFile }) => ({
      rule: 'play-result-domain-state',
      sourceFile,
      targetFile,
      message: `play result domain must stay pure of state/session infrastructure: ${sourceFile} -> ${targetFile}`,
    }));
}

function findRenderSystemBrowserViolations(imports) {
  return imports
    .filter(({ sourceFile }) => sourceFile === RENDER_SYSTEM_PATH)
    .filter(({ targetFile }) => targetFile.startsWith('src/adapters/browser/'))
    .map(({ sourceFile, targetFile }) => ({
      rule: 'render-system-browser',
      sourceFile,
      targetFile,
      message: `render system must consume injected runtime services instead of browser adapters: ${sourceFile} -> ${targetFile}`,
    }));
}

function findSoundSfxBrowserViolations(imports) {
  return imports
    .filter(({ sourceFile }) => sourceFile === SOUND_SFX_CONTROLLER_PATH)
    .filter(({ targetFile }) => targetFile.startsWith('src/adapters/browser/'))
    .map(({ sourceFile, targetFile }) => ({
      rule: 'sound-sfx-browser',
      sourceFile,
      targetFile,
      message: `sound sfx controller must consume injected runtime services instead of browser adapters: ${sourceFile} -> ${targetFile}`,
    }));
}

function findPipelineProfilerBrowserViolations(imports) {
  return imports
    .filter(({ sourceFile }) => sourceFile === PIPELINE_PROFILER_PATH)
    .filter(({ targetFile }) => targetFile.startsWith('src/adapters/browser/'))
    .map(({ sourceFile, targetFile }) => ({
      rule: 'pipeline-profiler-browser',
      sourceFile,
      targetFile,
      message: `pipeline profiler must consume injected runtime clocks instead of browser adapters: ${sourceFile} -> ${targetFile}`,
    }));
}

function findPlayContextRuntimeBrowserViolations(imports) {
  return imports
    .filter(({ sourceFile }) => sourceFile === PLAY_CONTEXT_RUNTIME_PATH)
    .filter(({ targetFile }) => targetFile.startsWith('src/adapters/browser/'))
    .map(({ sourceFile, targetFile }) => ({
      rule: 'play-context-runtime-browser',
      sourceFile,
      targetFile,
      message: `play context runtime must consume injected browser services instead of browser adapters: ${sourceFile} -> ${targetFile}`,
    }));
}

function findRuntimeLoggerBrowserViolations(imports) {
  return imports
    .filter(({ sourceFile }) => sourceFile === RUNTIME_LOGGER_PATH)
    .filter(({ targetFile }) => targetFile.startsWith('src/adapters/browser/'))
    .map(({ sourceFile, targetFile }) => ({
      rule: 'runtime-logger-browser',
      sourceFile,
      targetFile,
      message: `runtime logger must consume injected debug policy instead of browser adapters: ${sourceFile} -> ${targetFile}`,
    }));
}

function findSettingsFacadeBrowserViolations(imports) {
  return imports
    .filter(({ sourceFile }) => (
      sourceFile === SETTINGS_QUERY_SERVICE_PATH
      || sourceFile === SETTINGS_COMMAND_SERVICE_PATH
    ))
    .filter(({ targetFile }) => targetFile.startsWith('src/adapters/browser/'))
    .map(({ sourceFile, targetFile }) => ({
      rule: 'settings-facade-browser',
      sourceFile,
      targetFile,
      message: `settings meta facade must re-export session owner modules instead of browser adapters: ${sourceFile} -> ${targetFile}`,
    }));
}

function findSessionSnapshotHelperBrowserViolations(imports) {
  return imports
    .filter(({ sourceFile }) => (
      sourceFile === SESSION_SNAPSHOT_PREVIEW_PATH
      || sourceFile === SESSION_SNAPSHOT_CODEC_PATH
      || sourceFile === SESSION_SNAPSHOT_MUTATION_PATH
    ))
    .filter(({ targetFile }) => targetFile.startsWith('src/adapters/browser/'))
    .map(({ sourceFile, targetFile }) => ({
      rule: 'session-snapshot-helper-browser',
      sourceFile,
      targetFile,
      message: `session snapshot helper must stay browser-agnostic: ${sourceFile} -> ${targetFile}`,
    }));
}

function findInternalSceneLoaderFacadeViolations(imports) {
  return imports
    .filter(({ sourceFile, targetFile }) => (
      sourceFile.startsWith('src/')
      && sourceFile !== SCENE_LOADERS_FACADE_PATH
      && targetFile === SCENE_LOADERS_FACADE_PATH
    ))
    .map(({ sourceFile, targetFile }) => ({
      rule: 'internal-scene-loader-facade',
      sourceFile,
      targetFile,
      message: `internal module must use scene factory or overlay loaders instead of sceneLoaders facade: ${sourceFile} -> ${targetFile}`,
    }));
}

export function collectBoundaryViolations() {
  const sourceImports = collectSourceImports();
  return [
    ...findShimViolations(sourceImports),
    ...findDomainViolations(sourceImports),
    ...findCoreBoundaryViolations(sourceImports),
    ...findSceneToSystemsViolations(sourceImports),
    ...findSceneToSceneViolations(),
    ...findAppToScenesViolations(sourceImports),
    ...findAppToSessionFacadeViolations(sourceImports),
    ...findPlayResultDomainViolations(sourceImports),
    ...findRenderSystemBrowserViolations(sourceImports),
    ...findSoundSfxBrowserViolations(sourceImports),
    ...findPipelineProfilerBrowserViolations(sourceImports),
    ...findPlayContextRuntimeBrowserViolations(sourceImports),
    ...findRuntimeLoggerBrowserViolations(sourceImports),
    ...findSettingsFacadeBrowserViolations(sourceImports),
    ...findSessionSnapshotHelperBrowserViolations(sourceImports),
    ...findInternalSceneLoaderFacadeViolations(sourceImports),
  ];
}

export async function main() {
  const violations = collectBoundaryViolations();
  if (violations.length === 0) {
    console.log('[check:boundaries] ok');
    return 0;
  }

  console.error('[check:boundaries] violations detected:');
  for (const violation of violations) {
    console.error(`- ${violation.message}`);
  }
  return 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const exitCode = await main();
  process.exit(exitCode);
}
