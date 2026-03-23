import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createRunner } from './helpers/testRunner.js';

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
    const source = readFileSync(new URL(ref, import.meta.url), 'utf8');
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
    const source = readFileSync(new URL(ref, import.meta.url), 'utf8');
    assert.equal(
      /spawnQueue\.push\(\s*\{\s*type\s*:/.test(source),
      false,
      `${ref}에 inline spawn literal이 남아 있음`,
    );
  });
});

test('production source files do not directly assign world.playMode outside PlayMode SSOT', () => {
  const rootPath = fileURLToPath(new URL('../src', import.meta.url));
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
      const source = readFileSync(filePath, 'utf8')
        .split('\n')
        .filter((line) => !line.trimStart().startsWith('//') && !line.trimStart().startsWith('*'))
        .join('\n');
      assert.equal(
        /world\.playMode\s*=(?!=)/.test(source),
        false,
        `${filePath}에 world.playMode 직접 대입이 남아 있음`,
      );
    });
});

test('SynergySystem does not directly import synergyData and post-event systems do not read world.events', () => {
  const synergySystemSource = readFileSync(new URL('../src/systems/progression/SynergySystem.js', import.meta.url), 'utf8');
  const weaponEvolutionSystemSource = readFileSync(new URL('../src/systems/progression/WeaponEvolutionSystem.js', import.meta.url), 'utf8');
  const upgradeSystemSource = readFileSync(new URL('../src/systems/progression/UpgradeSystem.js', import.meta.url), 'utf8');
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
    const source = readFileSync(new URL(ref, import.meta.url), 'utf8');
    assert.equal(/world\.events|events\./.test(source), false, `${ref}가 post-event 구간에서 world.events를 읽고 있음`);
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
    const source = readFileSync(new URL(ref, import.meta.url), 'utf8');
    assert.equal(
      /\b(enemy|player|projectile|pickup|effect)\._[A-Za-z]/.test(source),
      false,
      `${ref}에 underscore-prefixed entity state가 남아 있음`,
    );
  });

  gameplayRandomFiles.forEach((ref) => {
    const source = readFileSync(new URL(ref, import.meta.url), 'utf8');
    assert.equal(
      /Math\.random\(/.test(source),
      false,
      `${ref}가 gameplay RNG를 Math.random에 직접 의존하고 있음`,
    );
  });
});

summary();
