import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { createRunner } from './helpers/testRunner.js';
import { resolveProjectPath } from './helpers/sourceInspection.js';

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
    assert.equal(/from\s+['"][.\/]+(?:\.\.\/)*systems\/event\/(?:currencyHandler|codexHandler|bossPhaseHandler|bossAnnouncementHandler|chestRewardHandler|weaponEvolutionHandler)\.js['"]/.test(source), false, `${filePath}가 event handler shim에 직접 의존하면 안 됨`);
    assert.equal(/from\s+['"][.\/]+(?:\.\.\/)*systems\/sound\/soundEventHandler\.js['"]/.test(source), false, `${filePath}가 sound event shim에 직접 의존하면 안 됨`);
  });
});

summary();
