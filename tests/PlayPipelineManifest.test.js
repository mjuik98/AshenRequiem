import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { readProjectSource } from './helpers/sourceInspection.js';

console.log('\n[PlayPipelineManifest]');

const { test, summary } = createRunner('PlayPipelineManifest');

let manifestApi = null;
let snapshotApi = null;

try {
  manifestApi = await import('../src/core/playPipelineManifest.js');
  snapshotApi = await import('../src/core/architectureSnapshot.js');
} catch (error) {
  manifestApi = { error };
  snapshotApi = { error };
}

function getManifestApi() {
  assert.ok(
    !manifestApi.error,
    manifestApi.error?.message ?? 'src/core/playPipelineManifest.js가 아직 없음',
  );
  return manifestApi;
}

test('play pipeline manifest는 런타임 등록 spec을 전용 모듈로 노출한다', () => {
  const api = getManifestApi();
  assert.equal(Array.isArray(api.PLAY_PIPELINE_FACTORY_SYSTEMS), true, 'PLAY_PIPELINE_FACTORY_SYSTEMS export가 필요함');
  assert.equal(Array.isArray(api.PLAY_PIPELINE_INSTANCE_SYSTEMS), true, 'PLAY_PIPELINE_INSTANCE_SYSTEMS export가 필요함');
  assert.equal(api.PLAY_PIPELINE_FACTORY_SYSTEMS.some((spec) => spec.name === 'SpawnSystem'), true, 'spawn factory spec이 빠짐');
  assert.equal(api.PLAY_PIPELINE_INSTANCE_SYSTEMS.some((spec) => spec.name === 'EventRegistry.asSystem()'), true, 'registry instance spec이 빠짐');
});

test('pipeline builder는 문서 snapshot 대신 runtime manifest를 직접 사용한다', () => {
  const pipelineBuilderSource = readProjectSource('../src/core/PipelineBuilder.js');
  const snapshotSource = readProjectSource('../src/core/architectureSnapshot.js');

  assert.equal(
    pipelineBuilderSource.includes("from './playPipelineManifest.js'"),
    true,
    'PipelineBuilder가 playPipelineManifest를 import해야 함',
  );
  assert.equal(
    pipelineBuilderSource.includes("from './architectureSnapshot.js'"),
    false,
    'PipelineBuilder가 문서 snapshot 모듈에 직접 결합되면 안 됨',
  );
  assert.equal(
    snapshotSource.includes("from './playPipelineManifest.js'"),
    true,
    'architectureSnapshot은 runtime manifest를 조합해 문서를 만들어야 함',
  );
});

summary();
