import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { renderPauseStats } from '../src/ui/pause/pauseStatsContent.js';
import {
  PAUSE_AUDIO_DEFAULTS,
  buildNextPauseOptions,
  renderPauseSoundControls,
} from '../src/ui/pause/pauseAudioControls.js';
import {
  PAUSE_TOOLTIP_SELECTORS,
  buildPauseTooltipBindingEntries,
  computePauseTooltipPosition,
} from '../src/ui/pause/pauseTooltipController.js';
import {
  PAUSE_VIEW_CSS,
  PAUSE_VIEW_STYLE_ID,
} from '../src/ui/pause/pauseStyles.js';

const { test, summary } = createRunner('PauseViewHelpers');

console.log('\n[PauseViewHelpers]');

test('pause stats renderer는 전투 스탯과 활성 시너지 요약을 만든다', () => {
  const html = renderPauseStats({
    player: {
      moveSpeed: 240,
      magnetRadius: 80,
      lifesteal: 0.1,
      critChance: 0.15,
      critMultiplier: 2.5,
      xpMult: 1.2,
      globalDamageMult: 1.3,
      currencyMult: 1.5,
      projectileSizeMult: 1.4,
      projectileLifetimeMult: 1.1,
      cooldownMult: 0.8,
      bonusProjectileCount: 2,
    },
    activeSynergies: [
      {
        id: 'storm_chain',
        name: '폭풍 연쇄',
        description: '연쇄 피해가 확장됩니다.',
        bonus: { speedMult: 1.25 },
      },
    ],
    session: {
      meta: { currency: 1234 },
    },
  });

  assert.equal(html.includes('전투 스탯'), true);
  assert.equal(html.includes('투사체 크기/범위'), true);
  assert.equal(html.includes('추가 투사체'), true);
  assert.equal(html.includes('활성 시너지'), true);
  assert.equal(html.includes('폭풍 연쇄'), true);
  assert.equal(html.includes('속도 ×1.25'), true);
  assert.equal(html.includes('1,234'), true);
});

test('pause audio helpers는 컨트롤 마크업과 옵션 변경을 순수 함수로 제공한다', () => {
  const html = renderPauseSoundControls(PAUSE_AUDIO_DEFAULTS);
  assert.equal(html.includes('마스터 볼륨'), true);
  assert.equal(html.includes('배경음악 (BGM)'), true);
  assert.equal(html.includes('효과음 (SFX)'), true);
  assert.equal(html.includes('data-sound-key="masterVolume"'), true);
  assert.equal(html.includes('data-toggle-key="musicEnabled"'), true);

  const toggled = buildNextPauseOptions(PAUSE_AUDIO_DEFAULTS, {
    type: 'toggle',
    key: 'musicEnabled',
  });
  assert.equal(toggled.musicEnabled, !PAUSE_AUDIO_DEFAULTS.musicEnabled);

  const adjusted = buildNextPauseOptions(PAUSE_AUDIO_DEFAULTS, {
    type: 'slider',
    key: 'masterVolume',
    value: 77,
  });
  assert.equal(adjusted.masterVolume, 77);
});

test('pause tooltip helpers는 슬롯 셀렉터와 viewport clamp 좌표를 제공한다', () => {
  const entries = buildPauseTooltipBindingEntries({
    player: {
      weapons: [{ id: 'magic_bolt', name: 'Magic Bolt', level: 1 }],
      accessories: [{ id: 'iron_heart', name: 'Iron Heart', level: 1 }],
    },
    data: { weaponEvolutionData: [] },
    indexes: {
      weaponById: new Map(),
      accessoryById: new Map(),
    },
  });

  assert.deepEqual(
    entries.map((entry) => entry.selector),
    [PAUSE_TOOLTIP_SELECTORS.weapon, PAUSE_TOOLTIP_SELECTORS.accessory],
  );

  const position = computePauseTooltipPosition({
    event: {
      clientX: 490,
      clientY: 290,
      target: {
        getBoundingClientRect: () => ({ right: 490, top: 250, height: 24 }),
      },
    },
    tooltipWidth: 120,
    tooltipHeight: 80,
    viewportWidth: 500,
    viewportHeight: 300,
  });

  assert.deepEqual(position, { x: 356, y: 212 });
});

test('pause view styles는 별도 모듈에서 관리되고 레거시 tooltip row 스타일을 제거한다', () => {
  assert.equal(PAUSE_VIEW_STYLE_ID, 'pauseview-v3-styles');
  assert.equal(PAUSE_VIEW_CSS.includes('.pv-loadout-panel'), true);
  assert.equal(PAUSE_VIEW_CSS.includes('.pv-slot-card.selected'), true);
  assert.equal(PAUSE_VIEW_CSS.includes('@media (max-width: 780px)'), true);
  assert.equal(PAUSE_VIEW_CSS.includes('.pvt-row'), false);
  assert.equal(PAUSE_VIEW_CSS.includes('.pvt-synergy'), false);
  assert.equal(PAUSE_VIEW_CSS.includes('.pvt-evo'), false);
});

summary();
