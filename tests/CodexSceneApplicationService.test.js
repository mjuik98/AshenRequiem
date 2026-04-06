import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { makeSessionState } from './fixtures/index.js';

console.log('\n[CodexSceneApplicationService]');

const { test, summary } = createRunner('CodexSceneApplicationService');

test('codex scene application service는 CodexView가 소비할 payload를 조립한다', async () => {
  const {
    createCodexSceneApplicationService,
  } = await import('../src/app/meta/codexSceneApplicationService.js');

  const session = makeSessionState({
    meta: {
      enemyKills: undefined,
      enemiesEncountered: undefined,
      weaponsUsedAll: undefined,
    },
  });
  const gameData = {
    enemyData: [{ id: 'zombie' }],
    weaponData: [{ id: 'magic_bolt' }],
  };
  const service = createCodexSceneApplicationService({ session, gameData });

  const payload = service.getViewPayload();
  assert.equal(payload.session, session, 'scene service가 현재 세션 객체를 그대로 전달하지 않음');
  assert.equal(payload.gameData, gameData, 'scene service가 current gameData를 payload에 붙이지 않음');
  assert.deepEqual(session.meta.enemyKills, {}, 'scene service가 codex meta 기본값을 보정하지 않음');
  assert.deepEqual(session.meta.enemiesEncountered, [], 'scene service가 codex encounter 메타를 보정하지 않음');
  assert.deepEqual(session.meta.weaponsUsedAll, [], 'scene service가 codex weapon 메타를 보정하지 않음');
});

summary();
