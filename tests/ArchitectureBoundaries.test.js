import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { createRunner } from './helpers/testRunner.js';
import { projectPathExists, resolveProjectPath } from './helpers/sourceInspection.js';

console.log('\n[ArchitectureBoundaries]');

const { test, summary } = createRunner('ArchitectureBoundaries');

function collectFiles(rootPath) {
  const files = [];
  function walk(dirPath) {
    for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
      const entryPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        walk(entryPath);
      } else if (entry.name.endsWith('.js')) {
        files.push(entryPath);
      }
    }
  }
  walk(rootPath);
  return files;
}

test('domain 계층은 ui, renderer, browser adapter에 직접 의존하지 않는다', () => {
  const rootPath = resolveProjectPath('../src/domain');
  const files = collectFiles(rootPath);

  files.forEach((filePath) => {
    const source = readFileSync(filePath, 'utf8');
    assert.equal(/from\s+['"][.\/]+(?:\.\.\/)*(?:ui|renderer)\//.test(source), false, `${filePath}가 domain에서 presentation 계층을 직접 import함`);
    assert.equal(/from\s+['"][.\/]+(?:\.\.\/)*adapters\/browser\//.test(source), false, `${filePath}가 domain에서 browser adapter를 직접 import함`);
  });
});

test('play event adapter facade는 adapter 전용 handler 모듈을 조합한다', () => {
  const source = readFileSync(resolveProjectPath('../src/adapters/play/playEventAdapters.js'), 'utf8');
  assert.equal(/from '\.\.\/\.\.\/systems\/event\//.test(source), false, 'playEventAdapters가 systems/event 구현을 직접 import하면 안 됨');
  assert.equal(/from '\.\/events\//.test(source), true, 'playEventAdapters가 adapters/play/events 하위 모듈을 사용해야 함');
});

test('src 내부 모듈은 compatibility shim 경로 대신 실 소유 모듈을 직접 import한다', () => {
  const rootPath = resolveProjectPath('../src');
  const files = collectFiles(rootPath);

  files.forEach((filePath) => {
    const source = readFileSync(filePath, 'utf8');
    assert.equal(/from\s+['"][.\/]+(?:\.\.\/)*state\/createWorld\.js['"]/.test(source), false, `${filePath}가 createWorld shim에 직접 의존하면 안 됨`);
    assert.equal(/from\s+['"][.\/]+(?:\.\.\/)*state\/startLoadoutRuntime\.js['"]/.test(source), false, `${filePath}가 startLoadoutRuntime shim에 직접 의존하면 안 됨`);
    assert.equal(/from\s+['"][.\/]+(?:\.\.\/)*state\/session\/sessionStorageDriver\.js['"]/.test(source), false, `${filePath}가 state sessionStorageDriver shim에 직접 의존하면 안 됨`);
    assert.equal(/from\s+['"][.\/]+(?:\.\.\/)*state\/session\/sessionRecoveryPolicy\.js['"]/.test(source), false, `${filePath}가 state sessionRecoveryPolicy shim에 직접 의존하면 안 됨`);
    assert.equal(/from\s+['"][.\/]+(?:\.\.\/)*state\/session\/sessionRepository\.js['"]/.test(source), false, `${filePath}가 state sessionRepository shim에 직접 의존하면 안 됨`);
    assert.equal(/from\s+['"][.\/]+(?:\.\.\/)*state\/session\/sessionStorage\.js['"]/.test(source), false, `${filePath}가 state sessionStorage shim에 직접 의존하면 안 됨`);
    assert.equal(/from\s+['"][.\/]+(?:\.\.\/)*core\/gameRuntime\.js['"]/.test(source), false, `${filePath}가 core gameRuntime shim에 직접 의존하면 안 됨`);
    assert.equal(/from\s+['"][.\/]+(?:\.\.\/)*core\/gameInputRuntime\.js['"]/.test(source), false, `${filePath}가 core gameInputRuntime shim에 직접 의존하면 안 됨`);
    assert.equal(/from\s+['"][.\/]+(?:\.\.\/)*core\/gameCanvasRuntime\.js['"]/.test(source), false, `${filePath}가 core gameCanvasRuntime shim에 직접 의존하면 안 됨`);
    assert.equal(/from\s+['"][.\/]+(?:\.\.\/)*core\/runtimeHost\.js['"]/.test(source), false, `${filePath}가 core runtimeHost shim에 직접 의존하면 안 됨`);
    assert.equal(/from\s+['"][.\/]+(?:\.\.\/)*core\/runtimeFeatureFlags\.js['"]/.test(source), false, `${filePath}가 core runtimeFeatureFlags shim에 직접 의존하면 안 됨`);
  });
});

test('core 계층은 scene/ui/browser adapter 구현에 직접 결합하지 않는다', () => {
  const rootPath = resolveProjectPath('../src/core');
  const files = collectFiles(rootPath);

  files.forEach((filePath) => {
    const source = readFileSync(filePath, 'utf8');
    const normalizedPath = filePath.replaceAll('\\', '/');
    const isCompatibilityWrapper =
      normalizedPath.endsWith('/src/core/Game.js')
      || normalizedPath.endsWith('/src/core/runtimeHooks.js')
      || normalizedPath.endsWith('/src/core/gameRuntime.js')
      || normalizedPath.endsWith('/src/core/gameInputRuntime.js')
      || normalizedPath.endsWith('/src/core/gameCanvasRuntime.js')
      || normalizedPath.endsWith('/src/core/runtimeHost.js')
      || normalizedPath.endsWith('/src/core/runtimeFeatureFlags.js');

    if (isCompatibilityWrapper) return;

    assert.equal(/from\s+['"][.\/]+(?:\.\.\/)*(?:scenes|ui)\//.test(source), false, `${filePath}가 core에서 scene/ui 계층을 직접 import함`);
    assert.equal(/from\s+['"][.\/]+(?:\.\.\/)*adapters\/browser\//.test(source), false, `${filePath}가 core에서 browser adapter를 직접 import함`);
  });
});

test('runtime-agnostic helper는 browser adapter import를 직접 소유하지 않는다', () => {
  const pipelineProfilerSource = readFileSync(resolveProjectPath('../src/systems/debug/PipelineProfiler.js'), 'utf8');
  const runtimeLoggerSource = readFileSync(resolveProjectPath('../src/utils/runtimeLogger.js'), 'utf8');

  assert.equal(
    /from\s+['"][.\/]+(?:\.\.\/)*adapters\/browser\//.test(pipelineProfilerSource),
    false,
    'PipelineProfiler가 browser adapter를 직접 import하면 안 됨',
  );
  assert.equal(
    /from\s+['"][.\/]+(?:\.\.\/)*adapters\/browser\//.test(runtimeLoggerSource),
    false,
    'runtimeLogger가 browser adapter를 직접 import하면 안 됨',
  );
});

test('scene 계층은 다른 scene 구현을 정적 import하지 않는다', () => {
  const rootPath = resolveProjectPath('../src/scenes');
  const files = collectFiles(rootPath);

  files.forEach((filePath) => {
    const source = readFileSync(filePath, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const normalizedPath = filePath.replaceAll('\\', '/');
    if (normalizedPath.endsWith('/src/scenes/sceneLoaders.js')) return;

    assert.equal(
      /import\s+.+from\s+['"][.\/]+(?:TitleScene|PlayScene|MetaShopScene|SettingsScene|CodexScene)\.js['"]/.test(source),
      false,
      `${filePath}가 다른 scene 구현을 정적 import함`,
    );
  });
});

test('src 내부 모듈은 sceneLoaders facade 대신 scene factory 또는 overlay loader를 사용한다', () => {
  const rootPath = resolveProjectPath('../src');
  const files = collectFiles(rootPath);

  files.forEach((filePath) => {
    const normalizedPath = filePath.replaceAll('\\', '/');
    const source = readFileSync(filePath, 'utf8');
    const isAllowedFacade =
      normalizedPath.endsWith('/src/scenes/sceneLoaders.js')
      || normalizedPath.endsWith('/src/scenes/overlayViewLoaders.js');

    if (isAllowedFacade) return;

    assert.equal(
      /from\s+['"][.\/]+(?:\.\.\/)*scenes\/sceneLoaders\.js['"]/.test(source),
      false,
      `${filePath}가 sceneLoaders facade에 직접 의존하면 안 됨`,
    );
  });
});

test('zero-caller compatibility shim files are removed from the repo', () => {
  [
    '../src/scenes/play/playerSpawnRuntime.js',
    '../src/scenes/play/playSceneFlow.js',
    '../src/progression/levelUpFlowRuntime.js',
    '../src/systems/sound/soundEventHandler.js',
    '../src/systems/event/bossAnnouncementHandler.js',
    '../src/systems/event/bossPhaseHandler.js',
    '../src/systems/event/chestRewardHandler.js',
    '../src/systems/event/codexHandler.js',
    '../src/systems/event/currencyHandler.js',
    '../src/systems/event/weaponEvolutionHandler.js',
  ].forEach((ref) => {
    assert.equal(projectPathExists(ref), false, `${ref} dead shim이 아직 남아 있음`);
  });
});

summary();
