import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { createRunner } from './helpers/testRunner.js';
import {
  readProjectSource,
  resolveProjectPath,
  stripLineComments,
} from './helpers/sourceInspection.js';

console.log('\n[AgentsRuleGuards]');

const { test, summary } = createRunner('AgentsRuleGuards');

const FRAME_PIPELINE_SYSTEMS = [
  '../src/systems/movement/PlayerMovementSystem.js',
  '../src/systems/movement/EnemyMovementSystem.js',
  '../src/systems/combat/CollisionSystem.js',
  '../src/systems/combat/DeathSystem.js',
  '../src/systems/progression/LevelSystem.js',
  '../src/systems/progression/UpgradeApplySystem.js',
];

test('frame pipeline systems do not directly mutate session state', () => {
  FRAME_PIPELINE_SYSTEMS.forEach((ref) => {
    const source = readProjectSource(ref);
    assert.equal(
      /services\.session|session\./.test(source),
      false,
      `${ref}에 session 직접 접근 흔적이 남아 있음`,
    );
  });
});

test('spawn requests are issued through factory helpers instead of inline literals', () => {
  const files = [
    '../src/systems/spawn/SpawnSystem.js',
    '../src/systems/combat/DamageSystem.js',
    '../src/behaviors/weaponBehaviors/chainLightning.js',
    '../src/behaviors/enemyBehaviors/rangedChase.js',
    '../src/behaviors/enemyBehaviors/circleDash.js',
  ];

  files.forEach((ref) => {
    const source = readProjectSource(ref);
    assert.equal(
      /spawnQueue\.push\(\s*\{\s*type\s*:/.test(source),
      false,
      `${ref}에 inline spawn literal이 남아 있음`,
    );
  });
});

test('production source files do not directly assign world.run.playMode outside PlayMode SSOT', () => {
  const rootPath = resolveProjectPath('../src');
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

  files
    .filter((filePath) => !filePath.endsWith(path.join('src', 'state', 'PlayMode.js')))
    .forEach((filePath) => {
      const relativeProjectPath = path.relative(rootPath, filePath).replaceAll(path.sep, '/');
      const source = stripLineComments(readProjectSource(`../src/${relativeProjectPath}`));
      assert.equal(
        /world\.run\.playMode\s*=(?!=)/.test(source),
        false,
        `${filePath}에 world.run.playMode 직접 대입이 남아 있음`,
      );
    });
});

test('SynergySystem does not directly import synergyData and post-event systems do not read world.queues.events', () => {
  const synergySystemSource = readProjectSource('../src/systems/progression/SynergySystem.js');
  const weaponEvolutionSystemSource = readProjectSource('../src/systems/progression/WeaponEvolutionSystem.js');
  const upgradeSystemSource = readProjectSource('../src/systems/progression/UpgradeSystem.js');
  const postEventFiles = [
    '../src/systems/spawn/EffectTickSystem.js',
    '../src/systems/spawn/FlushSystem.js',
    '../src/systems/camera/CameraSystem.js',
    '../src/systems/render/CullingSystem.js',
    '../src/systems/render/RenderSystem.js',
  ];

  assert.equal(/import\s+\{\s*synergyData\s*\}/.test(synergySystemSource), false, 'SynergySystem에 synergyData 직접 import가 남아 있음');
  assert.equal(/import\s+\{\s*getWeaponDataById\s*\}/.test(weaponEvolutionSystemSource), false, 'WeaponEvolutionSystem에 weaponData 직접 import fallback이 남아 있음');
  assert.equal(/import\s+\{\s*upgradeData\s*\}/.test(upgradeSystemSource), false, 'UpgradeSystem에 upgradeData 직접 import fallback이 남아 있음');
  assert.equal(/import\s+\{\s*getWeaponDataById\s*\}/.test(upgradeSystemSource), false, 'UpgradeSystem에 weaponData 직접 import fallback이 남아 있음');
  assert.equal(/import\s+\{\s*getAccessoryById\s*\}/.test(upgradeSystemSource), false, 'UpgradeSystem에 accessoryData 직접 import fallback이 남아 있음');
  assert.equal(/import\s+\{[^}]*weaponProgressionData[^}]*\}/.test(upgradeSystemSource), false, 'UpgradeSystem에 weaponProgressionData 직접 import fallback이 남아 있음');
  assert.equal(/import\s+\{[^}]*getNextWeaponProgression[^}]*\}/.test(upgradeSystemSource), false, 'UpgradeSystem에 getNextWeaponProgression 직접 import fallback이 남아 있음');

  postEventFiles.forEach((ref) => {
    const source = readProjectSource(ref);
    assert.equal(/world\.queues\.events|events\./.test(source), false, `${ref}가 post-event 구간에서 world.queues.events를 읽고 있음`);
  });
});

test('production entity/runtime state avoids underscore-prefixed private slots and direct gameplay Math.random', () => {
  const underscoreStateFiles = [
    '../src/entities/createEnemy.js',
    '../src/systems/combat/BossPhaseSystem.js',
    '../src/behaviors/enemyBehaviors/rangedChase.js',
  ];
  const gameplayRandomFiles = [
    '../src/systems/spawn/SpawnSystem.js',
    '../src/systems/combat/DamageSystem.js',
    '../src/systems/combat/StatusEffectSystem.js',
    '../src/systems/combat/DeathSystem.js',
    '../src/systems/event/chestRewardHandler.js',
    '../src/behaviors/enemyBehaviors/rangedChase.js',
  ];

  underscoreStateFiles.forEach((ref) => {
    const source = readProjectSource(ref);
    assert.equal(
      /\b(enemy|player|projectile|pickup|effect)\._[A-Za-z]/.test(source),
      false,
      `${ref}에 underscore-prefixed entity state가 남아 있음`,
    );
  });

  gameplayRandomFiles.forEach((ref) => {
    const source = readProjectSource(ref);
    assert.equal(
      /Math\.random\(/.test(source),
      false,
      `${ref}가 gameplay RNG를 Math.random에 직접 의존하고 있음`,
    );
  });
});

test('scene and progression infrastructure stay decoupled from system internals', () => {
  const playSceneSource = readProjectSource('../src/scenes/PlayScene.js');
  const levelUpControllerSource = readProjectSource('../src/scenes/play/levelUpController.js');
  const playResultHandlerSource = readProjectSource('../src/scenes/play/PlayResultHandler.js');
  const levelUpFlowRuntimeSource = readProjectSource('../src/progression/levelUpFlowRuntime.js');
  const levelUpFlowServiceSource = readProjectSource('../src/app/play/levelUpFlowService.js');
  const createPlayerSource = readProjectSource('../src/entities/createPlayer.js');
  const sessionMetaSource = readProjectSource('../src/state/sessionMeta.js');
  const pipelineBuilderSource = readProjectSource('../src/core/PipelineBuilder.js');
  const upgradeSystemSource = readProjectSource('../src/systems/progression/UpgradeSystem.js');
  const codexHandlerSource = readProjectSource('../src/systems/event/codexHandler.js');
  const titleLoadoutSource = readProjectSource('../src/scenes/title/titleLoadout.js');
  const titleLoadoutViewSource = readProjectSource('../src/ui/title/StartLoadoutView.js');
  const playerSpawnRuntimeSource = readProjectSource('../src/scenes/play/playerSpawnRuntime.js');
  const playerSpawnServiceSource = readProjectSource('../src/app/play/playerSpawnApplicationService.js');
  const startLoadoutRuntimeSource = readProjectSource('../src/state/startLoadoutRuntime.js');
  const unlockProgressRuntimeSource = readProjectSource('../src/progression/unlockProgressRuntime.js');
  const worldTickSystemSource = readProjectSource('../src/systems/core/WorldTickSystem.js');
  const sessionFacadeSource = readProjectSource('../src/state/sessionFacade.js');
  const sessionPersistenceServiceSource = readProjectSource('../src/app/session/sessionPersistenceService.js');
  const loadoutSelectionWriteServiceSource = readProjectSource('../src/app/session/loadoutSelectionWriteService.js');
  const upgradeChoicePoolSource = readProjectSource('../src/progression/upgradeChoicePool.js');
  const pendingEventPumpSystemSource = readProjectSource('../src/systems/event/PendingEventPumpSystem.js');

  [playSceneSource, levelUpControllerSource, playResultHandlerSource].forEach((source, index) => {
    const label = ['PlayScene', 'levelUpController', 'PlayResultHandler'][index];
    assert.equal(
      /from\s+['"]\.\.\/(?:\.\.\/)?systems\/(?:event|progression)\//.test(source),
      false,
      `${label}가 systems 계층의 구현 모듈에 직접 결합되어 있음`,
    );
  });

  assert.equal(
    /registerChestRewardHandler|registerBossPhaseHandler|registerSoundEventHandlers|registerCurrencyHandler|registerBossAnnouncementHandler|registerWeaponEvolutionHandler|registerCodexHandlers/.test(pipelineBuilderSource),
    false,
    'PipelineBuilder가 개별 이벤트 핸들러를 직접 등록하고 있음',
  );

  assert.equal(
    /import\s+\{[^}]*SynergySystem[^}]*\}\s+from\s+['"]\.\/SynergySystem\.js['"]/.test(upgradeSystemSource),
    false,
    'UpgradeSystem이 SynergySystem 객체 구현에 직접 의존하고 있음',
  );

  assert.equal(
    /import\s+\{[^}]*UpgradeSystem[^}]*\}\s+from\s+['"]\.\.\/systems\/progression\/UpgradeSystem\.js['"]/.test(levelUpFlowRuntimeSource),
    false,
    'levelUpFlowRuntime가 systems 레이어의 UpgradeSystem 구현에 직접 의존하고 있음',
  );

  assert.equal(
    levelUpFlowRuntimeSource.includes("from '../app/play/levelUpFlowService.js'"),
    true,
    'levelUpFlowRuntime wrapper가 app level up flow service를 재노출하지 않음',
  );

  assert.equal(
    /import\s+\{[^}]*UpgradeSystem[^}]*\}\s+from\s+['"]\.\.\/\.\.\/systems\/progression\/UpgradeSystem\.js['"]/.test(levelUpFlowServiceSource),
    false,
    'levelUpFlowService가 systems 레이어의 UpgradeSystem 구현에 직접 의존하고 있음',
  );

  assert.equal(
    /export function recordWeaponAcquired|export function recordAccessoryAcquired|export function recordEnemyEncounter/.test(codexHandlerSource),
    false,
    'codexHandler가 이벤트 핸들러 외부에 직접 세션 변경 helper를 노출하고 있음',
  );

  assert.equal(
    /import\s+\{[^}]*unlockData[^}]*\}\s+from|import\s+\{[^}]*evaluateUnlocks[^}]*\}\s+from/.test(playResultHandlerSource),
    false,
    'PlayResultHandler가 해금 데이터/평가 구현을 직접 결합하고 있음',
  );

  assert.equal(
    /import\s+\{[^}]*unlockData[^}]*\}\s+from|import\s+\{[^}]*evaluateUnlocks[^}]*\}\s+from/.test(sessionMetaSource),
    false,
    'sessionMeta가 해금 데이터/평가 구현을 직접 결합하고 있음',
  );

  assert.equal(
    /mergeUnlockedAccessoryIds|mergeUnlockedWeaponIds|getWeaponDataById|applyPermanentUpgrades/.test(createPlayerSource),
    false,
    'createPlayer가 세션/데이터 해석과 영구 업그레이드 적용까지 직접 수행하고 있음',
  );

  assert.equal(
    /flushPendingRunStartEvents/.test(playSceneSource),
    false,
    'PlayScene가 run-start 이벤트 주입을 파이프라인 밖에서 직접 처리하고 있음',
  );

  assert.equal(
    titleLoadoutSource.includes("from '../../domain/meta/loadout/startLoadoutDomain.js'"),
    true,
    'titleLoadout이 공용 start loadout runtime을 사용하지 않음',
  );

  assert.equal(
    /export function getSelectedStartWeaponId/.test(titleLoadoutSource),
    false,
    'titleLoadout에 중복 시작 무기 선택 helper가 남아 있음',
  );

  assert.equal(
    /canStart/.test(titleLoadoutSource),
    true,
    'titleLoadout이 타이틀 시작 가능 상태를 명시적으로 노출하지 않음',
  );

  assert.equal(
    playerSpawnRuntimeSource.includes("from '../../app/play/playerSpawnApplicationService.js'"),
    true,
    'playerSpawnRuntime wrapper가 app player spawn service를 재노출하지 않음',
  );

  assert.equal(
    playerSpawnServiceSource.includes("from '../../domain/meta/loadout/startLoadoutDomain.js'"),
    true,
    'playerSpawnRuntime이 공용 start loadout runtime을 사용하지 않음',
  );

  assert.equal(
    /resolveStartLoadout\(/.test(playerSpawnRuntimeSource),
    false,
    'playerSpawnRuntime이 broad start loadout DTO를 그대로 재노출하고 있음',
  );

  assert.equal(
    /resolveStartWeaponSelection/.test(titleLoadoutSource),
    true,
    'titleLoadout이 전용 start weapon selection helper를 사용하지 않음',
  );

  assert.equal(
    /import\s+\{\s*getWeaponDataById\s*\}/.test(startLoadoutRuntimeSource),
    false,
    'startLoadoutRuntime이 주입 경계를 우회해 정적 weaponData helper를 import하고 있음',
  );

  assert.equal(
    /mergeUnlockedAccessoryIds|mergeUnlockedWeaponIds/.test(startLoadoutRuntimeSource),
    false,
    'startLoadoutRuntime이 정적 unlock helper에 의존해 데이터 소스 경계를 다시 섞고 있음',
  );

  assert.equal(
    /export function resolveStartLoadout/.test(startLoadoutRuntimeSource),
    false,
    'startLoadoutRuntime이 broad start loadout DTO export를 유지하고 있음',
  );

  assert.equal(
    /mergeUnlockedAccessoryIds|mergeUnlockedWeaponIds/.test(upgradeChoicePoolSource),
    false,
    'upgradeChoicePool이 정적 unlock helper에 의존해 progression DI 경계를 다시 섞고 있음',
  );

  assert.equal(
    /export function applySessionUnlockProgress/.test(unlockProgressRuntimeSource),
    false,
    'unlockProgressRuntime에 session-level 편의 API가 남아 있어 facade 진입점이 이중화됨',
  );

  assert.equal(
    /pendingRunStartEvents|pendingEventQueue/.test(worldTickSystemSource),
    false,
    'WorldTickSystem이 run-start 이벤트 전용 책임까지 맡고 있음',
  );

  assert.equal(
    /weaponAcquired|accessoryAcquired/.test(pendingEventPumpSystemSource),
    false,
    'PendingEventPumpSystem이 core/event 인프라가 아닌 도메인 이벤트명을 직접 하드코딩하고 있음',
  );

  assert.equal(
    /_selectedWeaponId\s*=\s*'magic_bolt'|selectedWeaponId\s*=\s*'magic_bolt'/.test(titleLoadoutViewSource),
    false,
    'StartLoadoutView가 공용 loadout runtime 대신 하드코딩된 기본 시작 무기를 들고 있음',
  );

  assert.equal(
    sessionFacadeSource.includes("from './startLoadoutRuntime.js'"),
    false,
    'sessionFacade가 compatibility shim startLoadoutRuntime에 직접 의존하면 안 됨',
  );

  assert.equal(
    sessionFacadeSource.includes("from '../app/session/sessionPersistenceService.js'"),
    true,
    'sessionFacade가 session persistence app service를 재노출하지 않음',
  );

  assert.equal(
    sessionFacadeSource.includes("from '../app/session/loadoutSelectionWriteService.js'"),
    true,
    'sessionFacade가 loadout selection write app service를 재노출하지 않음',
  );

  assert.equal(
    loadoutSelectionWriteServiceSource.includes("from '../../domain/meta/loadout/startLoadoutDomain.js'"),
    true,
    'loadoutSelectionWriteService가 실제 start loadout domain 모듈을 사용하지 않음',
  );

  assert.equal(
    /saveSession|purchasePermanentUpgrade/.test(loadoutSelectionWriteServiceSource),
    false,
    'loadoutSelectionWriteService가 persistence primitive에 직접 결합하고 있음',
  );

  assert.equal(
    /from '\.\.\/\.\.\/state\/createSessionState\.js'/.test(sessionPersistenceServiceSource),
    true,
    'sessionPersistenceService가 createSessionState persistence primitive를 직접 사용하지 않음',
  );

  assert.equal(
    /export function resolveSelectedStartWeaponForSave/.test(sessionFacadeSource),
    false,
    'sessionFacade가 외부에서 쓰지 않는 시작 무기 normalize helper를 public API로 노출하고 있음',
  );

  assert.equal(
    /return meta\.selectedStartWeaponId;/.test(sessionFacadeSource),
    false,
    'sessionFacade 시작 무기 저장 API가 성공/실패 구분 없는 원시 문자열 반환을 유지하고 있음',
  );
});

summary();
