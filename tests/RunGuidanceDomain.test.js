import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { makeSessionState } from './fixtures/index.js';

console.log('\n[RunGuidanceDomain]');

const { test, summary } = createRunner('RunGuidanceDomain');

let guidanceApi = null;

try {
  guidanceApi = await import('../src/domain/play/encounter/runGuidanceDomain.js');
} catch (error) {
  guidanceApi = { error };
}

function getApi() {
  assert.ok(!guidanceApi.error, guidanceApi.error?.message ?? 'runGuidanceDomain.js가 아직 없음');
  return guidanceApi;
}

test('run guidance domain은 가장 가까운 미완료 unlock을 primary objective로 고른다', () => {
  const { buildRunGuidanceSnapshot } = getApi();
  const session = makeSessionState({
    meta: {
      enemyKills: { zombie: 420 },
      completedUnlocks: ['unlock_lightning_ring'],
    },
  });

  const guidance = buildRunGuidanceSnapshot({
    session,
    gameData: {
      unlockData: [
        {
          id: 'unlock_boomerang',
          targetType: 'weapon',
          targetId: 'boomerang',
          conditionType: 'total_kills_gte',
          conditionValue: 500,
          title: '곡예의 각성',
          rewardText: '부메랑 해금',
        },
        {
          id: 'unlock_lightning_ring',
          targetType: 'weapon',
          targetId: 'lightning_ring',
          conditionType: 'boss_kills_gte',
          conditionValue: 1,
          title: '폭풍의 징조',
          rewardText: '번개의 고리 해금',
        },
      ],
    },
  });

  assert.equal(guidance.primaryObjective.id, 'unlock_boomerang', '가장 가까운 미완료 unlock이 선택되지 않음');
  assert.equal(guidance.primaryObjective.progressText, '420 / 500', 'progress text가 계산되지 않음');
  assert.equal(guidance.primaryObjective.rewardText, '부메랑 해금', 'reward text가 보존되지 않음');
});

test('run guidance domain은 unlock 후보가 없으면 기본 survival objective를 반환한다', () => {
  const { buildRunGuidanceSnapshot } = getApi();

  const guidance = buildRunGuidanceSnapshot({
    session: makeSessionState({ meta: { completedUnlocks: ['unlock_everything'] } }),
    gameData: { unlockData: [] },
  });

  assert.equal(guidance.primaryObjective.id, 'survive_longer', 'fallback objective id가 잘못됨');
  assert.match(guidance.primaryObjective.title, /생존/, 'fallback objective title이 생존 목표가 아님');
});

test('run guidance domain은 현재 스테이지 고유 규칙을 stage directive로 노출한다', () => {
  const { buildRunGuidanceSnapshot } = getApi();

  const guidance = buildRunGuidanceSnapshot({
    session: makeSessionState({
      meta: {
        selectedStageId: 'ash_plains',
      },
    }),
    gameData: {
      unlockData: [],
      stageData: [
        {
          id: 'ash_plains',
          name: 'Ash Plains',
          stageDirective: {
            title: '수호 등불',
            detail: '짧은 무적 ward가 전장에 생성됩니다.',
          },
          modifierDrafts: [
            {
              id: 'ash_kindled_front',
              title: 'Kindled Front',
              ruleText: 'ward pickup이 꺼진 직후 근거리 압박이 잠깐 강해집니다.',
              counterplay: '등불이 켜진 순간 짧게 안쪽으로 진입하세요.',
            },
          ],
        },
      ],
    },
  });

  assert.equal(guidance.stageDirective?.title, '수호 등불', 'stage directive title이 노출되지 않음');
  assert.match(guidance.stageDirective?.detail ?? '', /ward|무적/, 'stage directive detail이 누락됨');
  assert.equal(guidance.stageModifier?.title, 'Kindled Front', 'stage modifier title이 guidance에 노출되지 않음');
  assert.match(guidance.stageModifier?.counterplay ?? '', /ward|등불/i, 'stage modifier counterplay가 guidance에 노출되지 않음');
});

test('run guidance domain은 시작 무기와 진화 레시피를 바탕으로 추천 빌드 경로를 제공한다', () => {
  const { buildRunGuidanceSnapshot } = getApi();

  const guidance = buildRunGuidanceSnapshot({
    session: makeSessionState({
      meta: {
        selectedStageId: 'ash_plains',
        selectedStartWeaponId: 'magic_bolt',
      },
    }),
    gameData: {
      unlockData: [],
      weaponEvolutionData: [
        {
          id: 'evolution_arcane_nova',
          resultWeaponId: 'arcane_nova',
          requires: { weaponId: 'magic_bolt', accessoryIds: ['tome_of_power'] },
        },
      ],
      weaponData: [
        { id: 'magic_bolt', name: 'Magic Bolt' },
        { id: 'arcane_nova', name: 'Arcane Nova' },
      ],
      accessoryData: [
        { id: 'tome_of_power', name: 'Tome of Power' },
      ],
      stageData: [
        {
          id: 'ash_plains',
          name: 'Ash Plains',
          stageDirective: {
            title: '수호 등불',
            detail: '짧은 무적 ward가 전장에 생성됩니다.',
          },
        },
      ],
    },
  });

  assert.equal(guidance.recommendedBuild?.baseWeaponId, 'magic_bolt', '추천 빌드가 시작 무기를 기반으로 계산되지 않음');
  assert.equal(guidance.recommendedBuild?.targetEvolutionId, 'arcane_nova', '추천 빌드가 진화 결과를 노출하지 않음');
  assert.deepEqual(guidance.recommendedBuild?.targetAccessoryIds, ['tome_of_power'], '추천 빌드가 핵심 장신구 경로를 노출하지 않음');
  assert.match(guidance.recommendedBuild?.detail ?? '', /Ash Plains|수호 등불|Arcane Nova/i, '추천 빌드 설명이 stage/build context를 포함하지 않음');
  assert.equal(Array.isArray(guidance.recommendedBuild?.rationale), true, '추천 빌드 rationale 배열이 없음');
  assert.equal(guidance.recommendedBuild?.rationale?.length > 0, true, '추천 빌드 rationale이 비어 있음');
});

summary();
