import { SYSTEM_REGISTRY } from '../systems/index.js';
import { createCollisionSystem } from '../systems/combat/CollisionSystem.js';
import { createEnemyMovementSystem } from '../systems/movement/EnemyMovementSystem.js';
import { createSpawnSystem } from '../systems/spawn/SpawnSystem.js';
import { createCullingSystem } from '../systems/render/CullingSystem.js';
import { createSynergySystem } from '../systems/progression/SynergySystem.js';

export const PIPELINE_FACTORY_SYSTEMS = Object.freeze([
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

export const PIPELINE_INSTANCE_SYSTEMS = Object.freeze([
  {
    name: 'EventRegistry.asSystem()',
    priority: 105,
    source: 'PipelineBuilder registry instance',
  },
]);

export function getPlayPipelineSnapshot() {
  return [
    ...SYSTEM_REGISTRY.map(({ name, priority }) => ({
      name,
      priority,
      source: 'SYSTEM_REGISTRY',
    })),
    ...PIPELINE_FACTORY_SYSTEMS.map(({ name, priority, source }) => ({
      name,
      priority,
      source,
    })),
    ...PIPELINE_INSTANCE_SYSTEMS.map(({ name, priority, source }) => ({
      name,
      priority,
      source,
    })),
  ].sort((a, b) => a.priority - b.priority);
}
