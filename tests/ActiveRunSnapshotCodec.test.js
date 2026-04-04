import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { makePlayer, makeWorld } from './fixtures/index.js';
import { readProjectSource } from './helpers/sourceInspection.js';

console.log('\n[ActiveRunSnapshotCodec]');

const { test, summary } = createRunner('ActiveRunSnapshotCodec');

let codecApi = null;

try {
  codecApi = await import('../src/app/play/activeRunSnapshotCodec.js');
} catch (error) {
  codecApi = { error };
}

function getCodecApi() {
  assert.ok(
    !codecApi?.error,
    codecApi?.error?.message ?? 'src/app/play/activeRunSnapshotCodec.js가 아직 없음',
  );
  return codecApi;
}

test('active run snapshot codec는 encode/decode/apply entrypoint를 노출한다', () => {
  const api = getCodecApi();
  assert.equal(typeof api.encodeActiveRunSnapshot, 'function');
  assert.equal(typeof api.decodeActiveRunSnapshot, 'function');
  assert.equal(typeof api.applyActiveRunSnapshot, 'function');
});

test('active run snapshot codec는 persisted snapshot을 round-trip clone한다', () => {
  const { encodeActiveRunSnapshot, decodeActiveRunSnapshot, applyActiveRunSnapshot } = getCodecApi();
  const world = makeWorld({
    run: {
      elapsedTime: 123,
      stageId: 'ember_hollow',
      stage: {
        id: 'ember_hollow',
        background: {
          palette: { base: '#121317' },
          layers: [{ id: 'ash_overlay', alpha: 0.22 }],
        },
      },
    },
    entities: {
      player: makePlayer({
        level: 5,
        weapons: [{ id: 'magic_bolt', level: 3 }],
        accessories: [{ id: 'ring_of_speed', level: 1 }],
        acquiredUpgrades: new Set(['up_magic_bolt']),
      }),
    },
  });

  const encoded = encodeActiveRunSnapshot(world);
  const decoded = decodeActiveRunSnapshot(encoded);
  const freshWorld = makeWorld({ run: {}, entities: { player: makePlayer({ weapons: [], accessories: [] }) } });

  encoded.run.stage.background.palette.base = '#000000';
  encoded.run.stage.background.layers[0].alpha = 0.9;

  assert.equal(decoded.run.stage.background.palette.base, '#121317', 'decode가 persisted snapshot deep clone을 보장하지 않음');
  assert.equal(decoded.run.stage.background.layers[0].alpha, 0.22, 'decode가 nested layer clone을 보장하지 않음');

  applyActiveRunSnapshot(freshWorld, freshWorld.entities.player, decoded);

  assert.equal(freshWorld.run.elapsedTime, 123);
  assert.equal(freshWorld.run.stageId, 'ember_hollow');
  assert.equal(freshWorld.entities.player.level, 5);
  assert.equal(freshWorld.entities.player.acquiredUpgrades.has('up_magic_bolt'), true);
});

test('active run service는 snapshot clone 규칙을 codec에 위임한다', () => {
  const source = readProjectSource('../src/app/play/activeRunApplicationService.js');

  assert.equal(source.includes("from './activeRunSnapshotCodec.js'"), true, 'active run service가 snapshot codec을 사용해야 함');
  assert.equal(source.includes('cloneRunStage('), false, 'active run service에 codec-owned clone helper가 남아 있으면 안 됨');
  assert.equal(source.includes('cloneStageBackground('), false, 'active run service에 codec-owned clone helper가 남아 있으면 안 됨');
});

summary();
