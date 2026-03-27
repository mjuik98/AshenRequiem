export const riskRelicData = [
  {
    id: 'blood_price',
    name: 'Blood Price',
    icon: '🩸',
    description: '강한 화력을 주지만 체력 여유를 크게 줄입니다.',
    effects: [
      { stat: 'damageMult', value: 1.16 },
      { stat: 'maxHp', value: -24 },
    ],
  },
  {
    id: 'glass_censer',
    name: 'Glass Censer',
    icon: '🕯',
    description: '탄막을 늘려주지만 위치 조정이 더 까다로워집니다.',
    effects: [
      { stat: 'bonusProjectileCount', value: 1 },
      { stat: 'moveSpeed', value: -18 },
    ],
  },
  {
    id: 'greed_gryphon',
    name: 'Greed Gryphon',
    icon: '🜚',
    description: '재화 수급이 크게 오르지만 저주가 함께 상승합니다.',
    effects: [
      { stat: 'currencyMult', value: 0.25 },
      { stat: 'curse', value: 0.2 },
    ],
  },
];

export function normalizeRiskRelicId(riskRelicId = null) {
  if (riskRelicId == null) return null;
  if (typeof riskRelicId !== 'string' || riskRelicId.length === 0) return null;
  return riskRelicData.some((entry) => entry.id === riskRelicId) ? riskRelicId : null;
}

export function getRiskRelicById(riskRelicId = null) {
  const normalizedId = normalizeRiskRelicId(riskRelicId);
  if (!normalizedId) return null;
  return riskRelicData.find((entry) => entry.id === normalizedId) ?? null;
}

export function getRiskRelicChoices() {
  return riskRelicData.map((entry) => ({ ...entry }));
}
