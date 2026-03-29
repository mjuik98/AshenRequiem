import assert from 'node:assert/strict';
import { test, summary } from './helpers/testRunner.js';
import { installMockDom } from './helpers/mockDom.js';
import { bossData } from '../src/data/bossData.js';
import { enemyData } from '../src/data/enemyData.js';
import { waveData } from '../src/data/waveData.js';
import { unlockData } from '../src/data/unlockData.js';
import {
  buildPauseLoadoutItems,
  renderPauseLoadoutPanel,
} from '../src/ui/pause/pauseLoadoutContent.js';
import { renderPauseTabPanels } from '../src/ui/pause/pauseViewSections.js';
import {
  buildPauseAccessoryTooltipContent,
  buildPauseWeaponTooltipContent,
} from '../src/ui/pause/pauseTooltipContent.js';
import { ResultView } from '../src/ui/result/ResultView.js';
import { createResultSceneActions } from '../src/scenes/play/playSceneOverlays.js';

console.log('\n[Result/Progression Source]');

test('ESC 로드아웃 통합은 무기/장신구의 분리 렌더 경로를 제거한다', () => {
  const panelsHtml = renderPauseTabPanels({
    activeTabName: 'loadout',
    statsHtml: '',
    soundControlsHtml: '',
  });

  assert.equal(panelsHtml.includes('pv-loadout-panel'), true, '로드아웃 패널 셸이 없음');
  assert.equal(panelsHtml.includes('pv-loadout-list'), true, '로드아웃 리스트가 없음');
  assert.equal(panelsHtml.includes('pv-loadout-detail'), true, '로드아웃 상세 패널이 없음');
  assert.equal(panelsHtml.includes('pv-tab-weapons'), false, '무기 전용 패널이 아직 남아 있음');
  assert.equal(panelsHtml.includes('pv-tab-accessories'), false, '장신구 전용 패널이 아직 남아 있음');
});

test('PauseView는 로드아웃 카드 선택으로 상세 패널을 갱신한다', () => {
  const player = {
    weapons: [
      { id: 'magic_bolt', name: 'Magic Bolt', level: 2, maxLevel: 5, behaviorId: 'targetProjectile' },
      { id: 'chain_lightning', name: 'Chain Lightning', level: 1, maxLevel: 5, behaviorId: 'chainLightning' },
    ],
    accessories: [
      { id: 'iron_heart', name: 'Iron Heart', level: 1, maxLevel: 5, rarity: 'common' },
    ],
    maxWeaponSlots: 3,
    maxAccessorySlots: 3,
    activeSynergies: [],
  };
  const items = buildPauseLoadoutItems({ player });
  const html = renderPauseLoadoutPanel({
    items,
    selectedItemKey: 'weapon:1',
    player,
    data: { weaponEvolutionData: [] },
    indexes: {
      weaponById: new Map(),
      accessoryById: new Map(),
      synergiesByWeaponId: new Map(),
      synergiesByAccessoryId: new Map(),
    },
  });

  assert.equal(html.includes('data-loadout-key="weapon:1"'), true, '로드아웃 카드 selection key가 렌더되지 않음');
  assert.equal(html.includes('aria-pressed="true"'), true, '선택된 로드아웃 카드 상태가 렌더되지 않음');
  assert.equal(html.includes('Chain Lightning'), true, '선택된 로드아웃 상세 패널이 갱신되지 않음');
});

test('Pause tooltip은 보조 안내만 담당하고 핵심 설명은 상세 패널로 넘긴다', () => {
  const player = {
    weapons: [{ id: 'magic_bolt', name: 'Magic Bolt', level: 2, damage: 14, cooldown: 0.8 }],
    accessories: [{ id: 'duplicator', name: '복제기', level: 3, rarity: 'rare' }],
    bonusProjectileCount: 0,
  };
  const indexes = {
    weaponById: new Map([['magic_bolt', { id: 'magic_bolt', name: 'Magic Bolt' }]]),
    accessoryById: new Map([['duplicator', {
      id: 'duplicator',
      name: '복제기',
      effects: [{ stat: 'bonusProjectileCount', value: 1, valuePerLevel: 1 }],
      maxLevel: 5,
    }]]),
  };
  const weaponTooltip = buildPauseWeaponTooltipContent({
    weaponId: 'magic_bolt',
    player,
    data: { weaponEvolutionData: [] },
    indexes,
  });
  const accessoryTooltip = buildPauseAccessoryTooltipContent({
    accessoryId: 'duplicator',
    player,
    data: {
      weaponEvolutionData: [],
      accessoryData: [{
        id: 'duplicator',
        name: '복제기',
        effects: [{ stat: 'bonusProjectileCount', value: 1, valuePerLevel: 1 }],
        maxLevel: 5,
      }],
    },
    indexes,
  });

  assert.equal(weaponTooltip.includes('pvt-note'), true, 'pauseTooltipContent가 보조 안내 note를 제공하지 않음');
  assert.equal(accessoryTooltip.includes('pvt-note'), true, 'pauseTooltipContent가 보조 안내 note를 제공하지 않음');
  assert.equal(weaponTooltip.includes('핵심 설명은 상세 패널에서 확인하세요.'), true, '무기 tooltip 안내 문구가 없음');
  assert.equal(accessoryTooltip.includes('핵심 설명은 상세 패널에서 확인하세요.'), true, '장신구 tooltip 안내 문구가 없음');
  assert.equal(accessoryTooltip.includes('추가 투사체 +3발'), true, '장신구 tooltip이 현재 효과를 표시하지 않음');
  assert.equal(weaponTooltip.includes('pvt-synergy'), false, 'pauseTooltipContent가 여전히 시너지 상세 블록을 렌더함');
  assert.equal(weaponTooltip.includes('pvt-evo'), false, 'pauseTooltipContent가 여전히 진화 상세 블록을 렌더함');
});

test('Pause tooltip은 orbit 무기의 실제 발사 수를 orbitCount 기준으로 표시한다', () => {
  const player = {
    weapons: [{ id: 'lightning_ring', name: 'Lightning Ring', level: 2, damage: 14, cooldown: 0.8, behaviorId: 'orbit', orbitCount: 3 }],
    accessories: [],
    bonusProjectileCount: 2,
  };
  const indexes = {
    weaponById: new Map([['lightning_ring', { id: 'lightning_ring', name: 'Lightning Ring' }]]),
    accessoryById: new Map(),
  };

  const weaponTooltip = buildPauseWeaponTooltipContent({
    weaponId: 'lightning_ring',
    player,
    data: { weaponEvolutionData: [] },
    indexes,
  });

  assert.equal(weaponTooltip.includes('회전체 5'), true, 'orbit 무기의 실제 발사 수가 tooltip에 반영되지 않음');
});

test('Pause tooltip은 chainLightning 무기의 실제 연쇄 수를 bonusProjectileCount까지 반영해 표시한다', () => {
  const player = {
    weapons: [{ id: 'chain_lightning', name: 'Chain Lightning', level: 2, damage: 14, cooldown: 0.8, behaviorId: 'chainLightning', chainCount: 3 }],
    accessories: [],
    bonusProjectileCount: 2,
  };
  const indexes = {
    weaponById: new Map([['chain_lightning', { id: 'chain_lightning', name: 'Chain Lightning' }]]),
    accessoryById: new Map(),
  };

  const weaponTooltip = buildPauseWeaponTooltipContent({
    weaponId: 'chain_lightning',
    player,
    data: { weaponEvolutionData: [] },
    indexes,
  });

  assert.equal(weaponTooltip.includes('연쇄 5'), true, 'chainLightning 실제 연쇄 수가 tooltip에 반영되지 않음');
});

test('결과 화면은 강화 상점 대신 메인 화면 버튼을 사용한다', () => {
  const { document, restore } = installMockDom();
  const transitions = [];

  try {
    const container = document.createElement('div');
    const view = new ResultView(container);
    const actions = createResultSceneActions({
      isBlocked: () => false,
      setBlocked: () => {},
      restart: () => transitions.push('restart'),
      goToTitle: () => transitions.push('title'),
    });

    view.show(
      {
        survivalTime: 90,
        level: 6,
        killCount: 18,
        outcome: 'defeat',
      },
      actions.onRestart,
      actions.onTitle,
    );

    assert.equal(view.el.innerHTML.includes('강화 상점'), false, 'ResultView에 강화 상점 버튼이 남아 있음');
    assert.equal(view.el.innerHTML.includes('메인 화면으로'), true, 'ResultView에 메인 화면 버튼이 없음');

    view.el.querySelector('.result-title-btn')?.click();
    assert.deepEqual(transitions, ['title'], '결과 액션이 메인 화면 복귀 경로를 사용하지 않음');
  } finally {
    restore();
  }
});

test('결과 화면은 신기록 배지와 사용 무기, 패배 런 해금을 함께 렌더한다', () => {
  const { document, restore } = installMockDom();

  try {
    const container = document.createElement('div');
    const view = new ResultView(container);

    view.show(
      {
        survivalTime: 130,
        level: 7,
        killCount: 44,
        outcome: 'defeat',
        bestTime: 120,
        bestLevel: 6,
        bestKills: 20,
        weapons: [
          { name: 'Magic Bolt', level: 3, isEvolved: false },
          { name: 'Holy Aura', level: 2, isEvolved: true },
        ],
        newUnlocks: ['지속의 부적 해금'],
        nextGoals: [
          { icon: '⚔', title: '백전노장', progressText: '440 / 1000', description: '총 1000마리를 처치한다' },
          { icon: '◈', title: '유리 향로', progressText: 'A2 / A3', description: 'Ascension 3 클리어' },
        ],
        dailyReward: {
          seedLabel: 'daily-2026-03-27',
          awarded: true,
          amount: 65,
          streak: 2,
          nextMilestone: { target: 3, remaining: 1 },
        },
        recommendations: [
          { title: 'Moon Crypt 회피', description: '최근 Moon Crypt 승률이 낮습니다.' },
          { title: '생존형 빌드 전환', description: '주요 패배 원인이 누적되어 방어 옵션이 유리합니다.' },
        ],
        deathRecap: {
          headline: '망령 탄막에 밀려 전열이 무너졌습니다.',
          detail: 'Moon Crypt의 교전 밀도가 후반에 급증했습니다.',
          action: '방어 장신구나 이동 여유를 먼저 확보하세요.',
        },
      },
      () => {},
      () => {},
    );

    assert.equal(view.el.innerHTML.includes('신기록'), true, '신기록 배지가 렌더되지 않음');
    assert.equal(view.el.innerHTML.includes('사용한 무기'), true, '사용 무기 섹션이 렌더되지 않음');
    assert.equal(view.el.innerHTML.includes('Holy Aura'), true, '사용 무기 이름이 렌더되지 않음');
    assert.equal(view.el.innerHTML.includes('진화'), true, '진화 배지가 렌더되지 않음');
    assert.equal(view.el.innerHTML.includes('이번 런 해금'), true, '패배 런 해금 섹션이 숨겨짐');
    assert.equal(view.el.innerHTML.includes('지속의 부적 해금'), true, '해금 rewardText가 렌더되지 않음');
    assert.equal(view.el.innerHTML.includes('다음 목표'), true, '결과 화면에 다음 목표 섹션이 없음');
    assert.equal(view.el.innerHTML.includes('백전노장'), true, '결과 화면이 다음 목표 title을 렌더하지 않음');
    assert.equal(view.el.innerHTML.includes('440 / 1000'), true, '결과 화면이 다음 목표 progress를 렌더하지 않음');
    assert.equal(view.el.innerHTML.includes('데일리 챌린지'), true, '결과 화면에 daily challenge 섹션이 없음');
    assert.equal(view.el.innerHTML.includes('daily-2026-03-27'), true, '결과 화면이 daily seed label을 렌더하지 않음');
    assert.equal(view.el.innerHTML.includes('연속 2일'), true, '결과 화면이 daily streak를 렌더하지 않음');
    assert.equal(view.el.innerHTML.includes('추천 조정'), true, '결과 화면에 추천 조정 섹션이 없음');
    assert.equal(view.el.innerHTML.includes('Moon Crypt 회피'), true, '결과 화면이 추천 조정 title을 렌더하지 않음');
    assert.equal(view.el.innerHTML.includes('전투 복기'), true, '결과 화면에 전투 복기 섹션이 없음');
    assert.equal(view.el.innerHTML.includes('망령 탄막에 밀려 전열이 무너졌습니다.'), true, '결과 화면이 death recap headline을 렌더하지 않음');
    assert.equal(view.el.innerHTML.includes('방어 장신구나 이동 여유를 먼저 확보하세요.'), true, '결과 화면이 death recap action을 렌더하지 않음');
  } finally {
    restore();
  }
});

test('결과 화면은 requestAnimationFrame 없이도 열 수 있다', () => {
  const { document, restore } = installMockDom();

  try {
    const container = document.createElement('div');
    const view = new ResultView(container);

    assert.doesNotThrow(() => {
      view.show(
        {
          survivalTime: 90,
          level: 3,
          killCount: 10,
          outcome: 'defeat',
        },
        () => {},
        () => {},
      );
    }, 'mock DOM 환경에서 requestAnimationFrame 부재로 결과 화면이 열리지 않음');
  } finally {
    restore();
  }
});

test('bossData는 5분 간격의 6종 서로 다른 보스를 사용한다', () => {
  assert.deepEqual(
    bossData.map((boss) => boss.at),
    [300, 600, 900, 1200, 1500, 1800],
    'bossData 스폰 시점이 5분 간격이 아님',
  );
  const enemyIds = bossData.map((boss) => boss.enemyId);
  assert.equal(new Set(enemyIds).size, 6, 'bossData가 6종 서로 다른 보스를 사용하지 않음');
});

test('enemyData에는 6종 보스가 정의되어 있다', () => {
  const bossIds = enemyData.filter((enemy) => enemy.isBoss).map((enemy) => enemy.id);
  assert.equal(new Set(bossIds).size, 6, 'enemyData의 보스 종류 수가 6이 아님');
});

test('waveData는 시간이 지날수록 후반 스폰 압력이 더 강해진다', () => {
  assert.ok(waveData.length >= 10, 'waveData가 충분히 세분화되지 않음');
  assert.ok(waveData.at(-1).spawnPerSecond > waveData[0].spawnPerSecond * 6, '후반 스폰 속도 상승폭이 부족함');
  assert.ok(waveData.at(-1).eliteChance > waveData[0].eliteChance, '후반 엘리트 출현률이 증가하지 않음');
});

test('후반 waveData는 초반 잡몹 zombie/bat를 후보에서 제거한다', () => {
  const lateWaves = waveData.filter((wave) => wave.from >= 600);
  assert.ok(lateWaves.length > 0, '후반 waveData 구간이 없음');
  assert.equal(
    lateWaves.some((wave) => (wave.enemyIds ?? []).includes('zombie') || (wave.enemyIds ?? []).includes('bat')),
    false,
    '후반 waveData에 초반 잡몹 zombie/bat가 남아 있음',
  );
});

test('unlockData는 추가 무기와 장신구 해금 보상을 포함한다', () => {
  assert.ok(unlockData.length >= 8, 'unlockData 확장 수가 부족함');
  const weaponRewards = unlockData.filter((item) => item.targetType === 'weapon').map((item) => item.targetId);
  const accessoryRewards = unlockData.filter((item) => item.targetType === 'accessory').map((item) => item.targetId);
  assert.ok(weaponRewards.includes('boomerang'), '기존 무기 해금이 누락됨');
  assert.ok(weaponRewards.includes('chain_lightning'), '신규 무기 해금 보상이 없음');
  assert.ok(accessoryRewards.includes('persistence_charm'), '기존 장신구 해금이 누락됨');
  assert.ok(accessoryRewards.includes('coin_pendant'), '신규 장신구 해금 보상이 없음');
});

summary();
