import { createCollisionSystem } from '../systems/combat/CollisionSystem.js';
import { createEnemyMovementSystem } from '../systems/movement/EnemyMovementSystem.js';
import { createSpawnSystem } from '../systems/spawn/SpawnSystem.js';
import { createCullingSystem } from '../systems/render/CullingSystem.js';
import { createSynergySystem } from '../systems/progression/SynergySystem.js';

export const PLAY_PIPELINE_FACTORY_SYSTEMS = Object.freeze([
  {
    slot: '_spawnSystem',
    name: 'SpawnSystem',
    priority: 10,
    source: 'PipelineBuilder factory',
    create: createSpawnSystem,
  },
  {
    slot: '_enemyMovementSystem',
    name: 'EnemyMovementSystem',
    priority: 30,
    source: 'PipelineBuilder factory',
    create: createEnemyMovementSystem,
  },
  {
    slot: '_collisionSystem',
    name: 'CollisionSystem',
    priority: 60,
    source: 'PipelineBuilder factory',
    create: createCollisionSystem,
  },
  {
    slot: '_synergySystem',
    name: 'SynergySystem',
    priority: 95,
    source: 'PipelineBuilder factory',
    create: createSynergySystem,
  },
  {
    slot: '_cullingSystem',
    name: 'CullingSystem',
    priority: 125,
    source: 'PipelineBuilder factory',
    create: createCullingSystem,
  },
]);

export const PLAY_PIPELINE_INSTANCE_SYSTEMS = Object.freeze([
  {
    name: 'EventRegistry.asSystem()',
    priority: 105,
    source: 'PipelineBuilder registry instance',
    create: ({ eventRegistry }) => eventRegistry.asSystem(),
  },
]);
