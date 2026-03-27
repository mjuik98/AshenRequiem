import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_EXTENSIONS = new Set(['.js', '.mjs']);

export const WRAPPER_INVENTORY = [
  {
    path: 'src/core/Game.js',
    role: '`GameApp` + `BrowserGameShell` facade',
    disposition: '`keep-public-wrapper`',
    notes: 'main 엔트리는 직접 사용하지 않음. `createGame()` thin helper export 제공',
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
    path: 'src/state/createWorld.js',
    role: '`createPlayWorld` re-export',
    disposition: '`keep-public-wrapper`',
    notes: '내부 import 금지, domain 경로가 SSOT',
  },
  {
    path: 'src/state/startLoadoutRuntime.js',
    role: 'start loadout domain re-export',
    disposition: '`keep-public-wrapper`',
    notes: 'title/start loadout 공개 경로 호환',
  },
  {
    path: 'src/scenes/play/playerSpawnRuntime.js',
    role: 'player spawn app service re-export',
    disposition: '`remove-when-callers-migrate`',
    notes: 'repo 내부 caller 0. 외부 공개 호출자 확인 후 삭제 후보',
  },
  {
    path: 'src/scenes/play/playSceneFlow.js',
    role: 'play scene flow service re-export',
    disposition: '`remove-when-callers-migrate`',
    notes: 'repo 내부 caller 0. 외부 공개 호출자 확인 후 삭제 후보',
  },
  {
    path: 'src/progression/levelUpFlowRuntime.js',
    role: 'level-up flow service re-export',
    disposition: '`remove-when-callers-migrate`',
    notes: 'repo 내부 caller 0. 외부 공개 호출자 확인 후 삭제 후보',
  },
  {
    path: 'src/systems/sound/soundEventHandler.js',
    role: 'sound event adapter re-export',
    disposition: '`remove-when-callers-migrate`',
    notes: 'repo 내부 caller 0. adapter 공개 경로 삭제 후보',
  },
  {
    path: 'src/systems/event/bossAnnouncementHandler.js',
    role: 'event adapter re-export',
    disposition: '`remove-when-callers-migrate`',
    notes: 'repo 내부 caller 0. adapter 공개 경로 삭제 후보',
  },
  {
    path: 'src/systems/event/bossPhaseHandler.js',
    role: 'event adapter re-export',
    disposition: '`remove-when-callers-migrate`',
    notes: 'repo 내부 caller 0. adapter 공개 경로 삭제 후보',
  },
  {
    path: 'src/systems/event/chestRewardHandler.js',
    role: 'event adapter re-export',
    disposition: '`remove-when-callers-migrate`',
    notes: 'repo 내부 caller 0. adapter 공개 경로 삭제 후보',
  },
  {
    path: 'src/systems/event/codexHandler.js',
    role: 'event adapter re-export',
    disposition: '`remove-when-callers-migrate`',
    notes: 'repo 내부 caller 0. adapter 공개 경로 삭제 후보',
  },
  {
    path: 'src/systems/event/currencyHandler.js',
    role: 'event adapter re-export',
    disposition: '`remove-when-callers-migrate`',
    notes: 'repo 내부 caller 0. adapter 공개 경로 삭제 후보',
  },
  {
    path: 'src/systems/event/weaponEvolutionHandler.js',
    role: 'event adapter re-export',
    disposition: '`remove-when-callers-migrate`',
    notes: 'repo 내부 caller 0. adapter 공개 경로 삭제 후보',
  },
];

function walkFiles(dirPath, bucket = []) {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const nextPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walkFiles(nextPath, bucket);
      continue;
    }
    if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      bucket.push(nextPath);
    }
  }
  return bucket;
}

function toPosixPath(filePath) {
  return filePath.split(path.sep).join('/');
}

function toProjectRelative(filePath) {
  return toPosixPath(path.relative(ROOT_DIR, filePath));
}

function extractImports(source) {
  const fromMatches = [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((match) => match[1]);
  const dynamicMatches = [...source.matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/g)].map((match) => match[1]);
  return [...fromMatches, ...dynamicMatches];
}

function resolveImportTarget(sourceFile, specifier) {
  if (!specifier.startsWith('.')) return specifier;

  const resolved = path.resolve(path.dirname(sourceFile), specifier);
  const candidates = [
    resolved,
    `${resolved}.js`,
    `${resolved}.mjs`,
    path.join(resolved, 'index.js'),
    path.join(resolved, 'index.mjs'),
  ];

  const hit = candidates.find((candidate) => fs.existsSync(candidate));
  return hit ? toProjectRelative(hit) : toPosixPath(path.relative(ROOT_DIR, resolved));
}

function collectRepoImports(rootDir = ROOT_DIR) {
  return ['src', 'tests', 'scripts'].flatMap((segment) => {
    const baseDir = path.join(rootDir, segment);
    if (!fs.existsSync(baseDir)) return [];

    return walkFiles(baseDir).flatMap((filePath) => {
      const source = fs.readFileSync(filePath, 'utf8');
      const sourceFile = toProjectRelative(filePath);
      return extractImports(source).map((specifier) => ({
        sourceFile,
        targetFile: resolveImportTarget(filePath, specifier),
      }));
    });
  });
}

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
