export const archetypeData = [
  {
    id: 'vanguard',
    name: 'Vanguard',
    icon: '🛡',
    description: '안정적인 체력과 근접 압박으로 초반을 버티는 전형입니다.',
    effects: [
      { stat: 'maxHp', value: 25 },
      { stat: 'moveSpeed', value: 8 },
    ],
  },
  {
    id: 'spellweaver',
    name: 'Spellweaver',
    icon: '✶',
    description: '주문 순환을 빠르게 굴려 탄막과 광역 빌드를 끌어올립니다.',
    effects: [
      { stat: 'cooldownMult', value: -0.08 },
      { stat: 'projectileSizeMult', value: 0.1 },
    ],
  },
  {
    id: 'spellblade',
    name: 'Spellblade',
    icon: '⚔',
    description: '공격성과 기동성을 함께 가져가며 빌드 전환이 빠릅니다.',
    effects: [
      { stat: 'damageMult', value: 1.08 },
      { stat: 'moveSpeed', value: 10 },
    ],
  },
];

const DEFAULT_ARCHETYPE = Object.freeze({ ...archetypeData[0] });

export function normalizeArchetypeId(archetypeId = null) {
  if (typeof archetypeId !== 'string' || archetypeId.length === 0) {
    return DEFAULT_ARCHETYPE.id;
  }
  return archetypeData.some((entry) => entry.id === archetypeId) ? archetypeId : DEFAULT_ARCHETYPE.id;
}

export function getArchetypeById(archetypeId = null) {
  const normalizedId = normalizeArchetypeId(archetypeId);
  return archetypeData.find((entry) => entry.id === normalizedId) ?? DEFAULT_ARCHETYPE;
}

export function getArchetypeChoices() {
  return archetypeData.map((entry) => ({ ...entry }));
}
