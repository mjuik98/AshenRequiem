/** bossData.js — 보스 스폰 타이밍 */
export const bossData = [
  {
    at: 300,
    enemyId: 'boss_lich',
    phases: [
      {
        hpThreshold: 0.65,
        behaviorId: 'keepDistance',
        announceText: '리치가 죽음의 고리를 펼칩니다.',
        phaseActions: [{ type: 'stage_echo' }],
      },
      {
        hpThreshold: 0.3,
        behaviorId: 'circle_dash',
        announceText: '리치가 영혼 폭주를 시작합니다.',
        phaseActions: [{ type: 'stage_echo' }],
      },
    ],
  },
  {
    at: 600,
    enemyId: 'boss_warden',
    phases: [
      {
        hpThreshold: 0.7,
        behaviorId: 'dash',
        announceText: '감시자가 돌진 태세를 취합니다.',
        phaseAction: { type: 'reposition', distance: 180, angleOffset: 0, burstColor: '#ffd180', effectVisualId: 'burst' },
        phaseActions: [
          { type: 'reposition', distance: 180, angleOffset: 0, burstColor: '#ffd180', effectVisualId: 'burst' },
          { type: 'stage_echo' },
        ],
      },
      {
        hpThreshold: 0.35,
        behaviorId: 'charge',
        announceText: '감시자가 격노하며 전장을 정비합니다.',
        phaseAction: { type: 'heal_pulse', healRatio: 0.15, color: '#b8ffd5', radius: 34, effectVisualId: 'burst' },
        phaseActions: [
          { type: 'heal_pulse', healRatio: 0.15, color: '#b8ffd5', radius: 34, effectVisualId: 'burst' },
          { type: 'stage_echo' },
        ],
      },
    ],
  },
  {
    at: 900,
    enemyId: 'boss_broodmother',
    phases: [
      {
        hpThreshold: 0.7,
        behaviorId: 'swarm',
        announceText: '브루드마더가 새끼들을 불러냅니다.',
        phaseAction: { type: 'summon', enemyId: 'mini_slime', count: 4, ringRadius: 84 },
        phaseActions: [
          { type: 'summon', enemyId: 'mini_slime', count: 4, ringRadius: 84 },
          { type: 'stage_echo' },
        ],
      },
      {
        hpThreshold: 0.3,
        behaviorId: 'circle',
        announceText: '브루드마더가 포위망을 좁힙니다.',
        phaseActions: [{ type: 'stage_echo' }],
      },
    ],
  },
  {
    at: 1200,
    enemyId: 'boss_titan',
    phases: [
      {
        hpThreshold: 0.65,
        behaviorId: 'charge',
        announceText: '타이탄이 지축을 울리며 전진합니다.',
        phaseActions: [{ type: 'stage_echo' }],
      },
      {
        hpThreshold: 0.25,
        behaviorId: 'dash',
        announceText: '타이탄이 광폭 돌진을 시작합니다.',
        phaseAction: { type: 'burst', count: 6, color: '#ff8a65', radius: 26, duration: 0.8, effectVisualId: 'burst' },
        phaseActions: [
          { type: 'burst', count: 6, color: '#ff8a65', radius: 26, duration: 0.8, effectVisualId: 'burst' },
          { type: 'stage_echo' },
        ],
      },
    ],
  },
  {
    at: 1500,
    enemyId: 'boss_seraph',
    phases: [
      {
        hpThreshold: 0.7,
        behaviorId: 'keepDistance',
        announceText: '세라프가 광휘 탄막을 펼칩니다.',
        phaseAction: {
          type: 'projectile_arc',
          count: 5,
          spreadAngle: 0.9,
          speedMult: 1.1,
          damageMult: 1.1,
          color: '#fff4a3',
          projectileVisualId: 'holy_bolt_upgrade',
          impactEffectType: 'holy_bolt_upgrade_impact',
          impactEffectVisualId: 'holy_bolt_upgrade_impact',
        },
        phaseActions: [
          {
            type: 'projectile_arc',
            count: 5,
            spreadAngle: 0.9,
            speedMult: 1.1,
            damageMult: 1.1,
            color: '#fff4a3',
            projectileVisualId: 'holy_bolt_upgrade',
            impactEffectType: 'holy_bolt_upgrade_impact',
            impactEffectVisualId: 'holy_bolt_upgrade_impact',
          },
          { type: 'stage_echo' },
        ],
      },
      {
        hpThreshold: 0.3,
        behaviorId: 'circle_dash',
        announceText: '세라프가 천공 강하를 시작합니다.',
        phaseAction: { type: 'reposition', distance: 140, angleOffset: 0, burstColor: '#fff1a4', effectVisualId: 'burst' },
        phaseActions: [
          { type: 'reposition', distance: 140, angleOffset: 0, burstColor: '#fff1a4', effectVisualId: 'burst' },
          { type: 'stage_echo' },
        ],
      },
    ],
  },
  {
    at: 1800,
    enemyId: 'boss_abyss_eye',
    phases: [
      {
        hpThreshold: 0.7,
        behaviorId: 'circle',
        announceText: '심연의 눈이 전장을 왜곡합니다.',
        phaseAction: {
          type: 'projectile_nova',
          count: 6,
          speedMult: 1.05,
          damageMult: 1.05,
          color: '#8ddfff',
          projectileVisualId: 'ice_bolt_upgrade',
          impactEffectType: 'ice_bolt_upgrade_impact',
          impactEffectVisualId: 'ice_bolt_upgrade_impact',
        },
        phaseActions: [
          {
            type: 'projectile_nova',
            count: 6,
            speedMult: 1.05,
            damageMult: 1.05,
            color: '#8ddfff',
            projectileVisualId: 'ice_bolt_upgrade',
            impactEffectType: 'ice_bolt_upgrade_impact',
            impactEffectVisualId: 'ice_bolt_upgrade_impact',
          },
          { type: 'stage_echo' },
        ],
      },
      {
        hpThreshold: 0.25,
        behaviorId: 'swarm',
        announceText: '심연의 눈이 공포의 파편을 흩뿌립니다.',
        phaseAction: {
          type: 'projectile_barrage',
          count: 10,
          speedMult: 1.15,
          damageMult: 1.15,
          color: '#7ce7ff',
          maxRange: 620,
          projectileVisualId: 'ice_bolt_upgrade',
          impactEffectType: 'ice_bolt_upgrade_impact',
          impactEffectVisualId: 'ice_bolt_upgrade_impact',
        },
        phaseActions: [
          {
            type: 'projectile_barrage',
            count: 10,
            speedMult: 1.15,
            damageMult: 1.15,
            color: '#7ce7ff',
            maxRange: 620,
            projectileVisualId: 'ice_bolt_upgrade',
            impactEffectType: 'ice_bolt_upgrade_impact',
            impactEffectVisualId: 'ice_bolt_upgrade_impact',
          },
          { type: 'stage_echo' },
        ],
      },
    ],
  },
];
