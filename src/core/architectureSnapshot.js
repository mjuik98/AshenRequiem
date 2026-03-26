import { SYSTEM_REGISTRY } from '../systems/index.js';
import {
  PLAY_PIPELINE_FACTORY_SYSTEMS,
  PLAY_PIPELINE_INSTANCE_SYSTEMS,
} from './playPipelineManifest.js';

export function getPlayPipelineSnapshot() {
  return [
    ...SYSTEM_REGISTRY.map(({ name, priority }) => ({
      name,
      priority,
      source: 'SYSTEM_REGISTRY',
    })),
    ...PLAY_PIPELINE_FACTORY_SYSTEMS.map(({ name, priority, source }) => ({
      name,
      priority,
      source,
    })),
    ...PLAY_PIPELINE_INSTANCE_SYSTEMS.map(({ name, priority, source }) => ({
      name,
      priority,
      source,
    })),
  ].sort((a, b) => a.priority - b.priority);
}
