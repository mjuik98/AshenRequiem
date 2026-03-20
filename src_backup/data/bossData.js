/** bossData.js — 보스 스폰 타이밍 */
export const bossData = [
  {
    at: 90,
    enemyId: 'boss_lich',
    phases: [
      { hpThreshold: 0.6, behaviorId: 'chase', announceText: 'Lich is getting angry!' },
      { hpThreshold: 0.3, behaviorId: 'chase', announceText: 'Lich is enraged!' },
    ]
  },
  { at: 210, enemyId: 'boss_lich' },
];
