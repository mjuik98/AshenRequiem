/** bossData.js — 보스 스폰 타이밍 */
export const bossData = [
  {
    at: 300,
    enemyId: 'boss_lich',
    phases: [
      { hpThreshold: 0.65, behaviorId: 'keepDistance', announceText: '리치가 죽음의 고리를 펼칩니다.' },
      { hpThreshold: 0.3, behaviorId: 'circle_dash', announceText: '리치가 영혼 폭주를 시작합니다.' },
    ],
  },
  {
    at: 600,
    enemyId: 'boss_warden',
    phases: [
      { hpThreshold: 0.7, behaviorId: 'dash', announceText: '감시자가 돌진 태세를 취합니다.' },
      { hpThreshold: 0.35, behaviorId: 'charge', announceText: '감시자가 격노하며 내달립니다.' },
    ],
  },
  {
    at: 900,
    enemyId: 'boss_broodmother',
    phases: [
      { hpThreshold: 0.7, behaviorId: 'swarm', announceText: '브루드마더가 새끼들을 불러냅니다.' },
      { hpThreshold: 0.3, behaviorId: 'circle', announceText: '브루드마더가 포위망을 좁힙니다.' },
    ],
  },
  {
    at: 1200,
    enemyId: 'boss_titan',
    phases: [
      { hpThreshold: 0.65, behaviorId: 'charge', announceText: '타이탄이 지축을 울리며 전진합니다.' },
      { hpThreshold: 0.25, behaviorId: 'dash', announceText: '타이탄이 광폭 돌진을 시작합니다.' },
    ],
  },
  {
    at: 1500,
    enemyId: 'boss_seraph',
    phases: [
      { hpThreshold: 0.7, behaviorId: 'keepDistance', announceText: '세라프가 광휘 탄막을 펼칩니다.' },
      { hpThreshold: 0.3, behaviorId: 'circle_dash', announceText: '세라프가 천공 강하를 시작합니다.' },
    ],
  },
  {
    at: 1800,
    enemyId: 'boss_abyss_eye',
    phases: [
      { hpThreshold: 0.7, behaviorId: 'circle', announceText: '심연의 눈이 전장을 왜곡합니다.' },
      { hpThreshold: 0.25, behaviorId: 'swarm', announceText: '심연의 눈이 공포의 파편을 흩뿌립니다.' },
    ],
  },
];
