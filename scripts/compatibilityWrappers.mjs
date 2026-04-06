import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT_DIR, collectRepoImports } from './importGraph.mjs';

export const WRAPPER_INVENTORY = [
  {
    path: 'src/core/Game.js',
    role: '`GameApp` + `BrowserGameShell` facade',
    disposition: '`keep-public-wrapper`',
    notes: 'main 엔트리는 직접 사용하지 않음. `createGame()` thin helper export 제공',
  },
  {
    path: 'src/core/gameRuntime.js',
    role: 'browser runtime state facade',
    disposition: '`keep-public-wrapper`',
    notes: '실제 구현은 src/adapters/browser/gameRuntime.js가 소유. 테스트/기존 import 호환용 re-export만 유지',
  },
  {
    path: 'src/core/gameInputRuntime.js',
    role: 'browser input runtime facade',
    disposition: '`keep-public-wrapper`',
    notes: '실제 구현은 src/adapters/browser/gameInputRuntime.js가 소유. 테스트/기존 import 호환용 re-export만 유지',
  },
  {
    path: 'src/core/gameCanvasRuntime.js',
    role: 'browser canvas runtime facade',
    disposition: '`keep-public-wrapper`',
    notes: '실제 구현은 src/adapters/browser/gameCanvasRuntime.js가 소유. 테스트/기존 import 호환용 re-export만 유지',
  },
  {
    path: 'src/core/runtimeHost.js',
    role: 'browser host lookup facade',
    disposition: '`keep-public-wrapper`',
    notes: '실제 구현은 src/adapters/browser/runtimeHost.js가 소유. 테스트/기존 import 호환용 re-export만 유지',
  },
  {
    path: 'src/core/runtimeFeatureFlags.js',
    role: 'browser runtime flag facade',
    disposition: '`keep-public-wrapper`',
    notes: '실제 구현은 src/adapters/browser/runtimeFeatureFlags.js가 소유. 테스트/기존 import 호환용 re-export만 유지',
  },
  {
    path: 'src/core/runtimeHooks.js',
    role: 'browser runtime hook facade',
    disposition: '`keep-public-wrapper`',
    notes: '실제 구현은 src/adapters/browser/runtimeHooks.js가 소유. 테스트/기존 import 호환용 re-export만 유지',
  },
  {
    path: 'src/scenes/play/PlayResultHandler.js',
    role: '`playResultApplicationService` class facade',
    disposition: '`keep-public-wrapper`',
    notes: '테스트/기존 import 호환 경로. `createPlayResultHandler()` / `processPlayResult()` thin helper export 제공',
  },
  {
    path: 'src/state/createSessionState.js',
    role: 'session state + browser persistence compatibility barrel',
    disposition: '`keep-public-wrapper`',
    notes: '실제 구현은 src/state/session/*, src/adapters/browser/session/*가 소유. 내부 import 금지',
  },
  {
    path: 'src/state/createWorld.js',
    role: '`createPlayWorld` re-export',
    disposition: '`keep-public-wrapper`',
    notes: '내부 import 금지, domain 경로가 SSOT',
  },
  {
    path: 'src/input/KeyboardAdapter.js',
    role: 'browser keyboard adapter facade',
    disposition: '`keep-public-wrapper`',
    notes: '실제 구현은 src/platform/browser/input/KeyboardAdapter.js가 소유. 테스트/기존 import 호환용 re-export만 유지',
  },
  {
    path: 'src/input/GamepadAdapter.js',
    role: 'browser gamepad adapter facade',
    disposition: '`keep-public-wrapper`',
    notes: '실제 구현은 src/platform/browser/input/GamepadAdapter.js가 소유. 테스트/기존 import 호환용 re-export만 유지',
  },
  {
    path: 'src/input/TouchAdapter.js',
    role: 'browser touch adapter facade',
    disposition: '`keep-public-wrapper`',
    notes: '실제 구현은 src/platform/browser/input/TouchAdapter.js가 소유. 테스트/기존 import 호환용 re-export만 유지',
  },
  {
    path: 'src/input/touchHudRuntime.js',
    role: 'browser touch HUD runtime facade',
    disposition: '`keep-public-wrapper`',
    notes: '실제 구현은 src/platform/browser/input/touchHudRuntime.js가 소유. 테스트/기존 import 호환용 re-export만 유지',
  },
  {
    path: 'src/state/sessionMeta.js',
    role: 'session meta facade',
    disposition: '`keep-public-wrapper`',
    notes: '실제 구현은 src/state/session/sessionMetaState.js, sessionUnlockState.js가 소유. 테스트/기존 import 호환용 re-export만 유지',
  },
  {
    path: 'src/state/session/sessionStorageDriver.js',
    role: 'browser session storage driver facade',
    disposition: '`keep-public-wrapper`',
    notes: '실제 구현은 src/adapters/browser/session/sessionStorageDriver.js가 소유. 테스트/기존 import 호환용 re-export만 유지',
  },
  {
    path: 'src/state/session/sessionRecoveryPolicy.js',
    role: 'browser session recovery facade',
    disposition: '`keep-public-wrapper`',
    notes: '실제 구현은 src/adapters/browser/session/sessionRecoveryPolicy.js가 소유. 테스트/기존 import 호환용 re-export만 유지',
  },
  {
    path: 'src/state/session/sessionRepository.js',
    role: 'browser session repository facade',
    disposition: '`keep-public-wrapper`',
    notes: '실제 구현은 src/adapters/browser/session/sessionRepository.js가 소유. 테스트/기존 import 호환용 re-export만 유지',
  },
  {
    path: 'src/state/session/sessionStorage.js',
    role: 'browser session storage facade',
    disposition: '`keep-public-wrapper`',
    notes: '실제 구현은 src/adapters/browser/session/sessionStorage.js가 소유. 테스트/기존 import 호환용 re-export만 유지',
  },
  {
    path: 'src/data/permanentUpgradeApplicator.js',
    role: 'permanent upgrade applicator facade',
    disposition: '`keep-public-wrapper`',
    notes: '실제 구현은 src/domain/play/progression/permanentUpgradeApplicator.js가 소유. 테스트/기존 import 호환용 re-export만 유지',
  },
];

function classifyCallers(callers) {
  const result = { src: [], tests: [], scripts: [] };
  for (const caller of callers) {
    if (caller.startsWith('src/')) result.src.push(caller);
    else if (caller.startsWith('tests/')) result.tests.push(caller);
    else if (caller.startsWith('scripts/')) result.scripts.push(caller);
  }
  return result;
}

export function collectWrapperUsageSnapshot(rootDir = ROOT_DIR) {
  const imports = collectRepoImports(rootDir);

  return WRAPPER_INVENTORY.map((entry) => {
    const callers = [...new Set(
      imports
        .filter(({ sourceFile, targetFile }) => sourceFile !== entry.path && targetFile === entry.path)
        .map(({ sourceFile }) => sourceFile),
    )].sort();
    const byBucket = classifyCallers(callers);

    return {
      path: entry.path,
      internalCallers: callers.length,
      srcCallers: byBucket.src.length,
      testCallers: byBucket.tests.length,
      scriptCallers: byBucket.scripts.length,
      callerRefs: callers,
    };
  });
}

export function renderWrapperInventorySections(snapshot = collectWrapperUsageSnapshot()) {
  const generatedUsageSection = [
    '## Generated Wrapper Usage Snapshot',
    '',
    '| Path | internalCallers | srcCallers | testCallers | scriptCallers |',
    '|---|---|---|---|---|',
    ...snapshot.map((entry) => `| \`${entry.path}\` | ${entry.internalCallers} | ${entry.srcCallers} | ${entry.testCallers} | ${entry.scriptCallers} |`),
  ].join('\n');

  const generatedCallerSection = [
    '## Generated Wrapper Caller Details',
    '',
    ...snapshot.map((entry) => {
      const callerLine = entry.callerRefs.length > 0
        ? entry.callerRefs.map((ref) => `\`${ref}\``).join(', ')
        : '(none)';
      return `- \`${entry.path}\`: ${callerLine}`;
    }),
  ].join('\n');

  return { generatedUsageSection, generatedCallerSection };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const sections = renderWrapperInventorySections();
  process.stdout.write(`${sections.generatedUsageSection}\n\n${sections.generatedCallerSection}\n`);
}
