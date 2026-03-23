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
  const source = readFileSync(new URL('../src/systems/spawn/SpawnSystem.js', import.meta.url), 'utf8');
  assert.equal(
    /spawnQueue\.push\(\s*\{\s*type\s*:/.test(source),
    false,
    'SpawnSystem에 inline spawn literal이 남아 있음',
  );
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
  const postEventFiles = [
    '../src/systems/spawn/EffectTickSystem.js',
    '../src/systems/spawn/FlushSystem.js',
    '../src/systems/camera/CameraSystem.js',
    '../src/systems/render/CullingSystem.js',
    '../src/systems/render/RenderSystem.js',
  ];

  assert.equal(/import\s+\{\s*synergyData\s*\}/.test(synergySystemSource), false, 'SynergySystem에 synergyData 직접 import가 남아 있음');

  postEventFiles.forEach((ref) => {
    const source = readFileSync(new URL(ref, import.meta.url), 'utf8');
    assert.equal(/world\.events|events\./.test(source), false, `${ref}가 post-event 구간에서 world.events를 읽고 있음`);
  });
});

summary();
