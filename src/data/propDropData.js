/**
 * propDropData.js — 파괴 가능한 장식물 드랍 테이블
 *
 * weight는 상대 가중치다. 총합이 1일 필요는 없다.
 */
export const propDropData = [
  {
    id: 'urn_basic',
    drops: [
      { pickupType: 'none', weight: 60 },
      { pickupType: 'gold', weight: 20, currencyValue: 12, color: '#ffd54f', radius: 9 },
      { pickupType: 'heal', weight: 10, healValue: 25, color: '#ef9a9a', radius: 10 },
      { pickupType: 'vacuum', weight: 5, color: '#80deea', radius: 10 },
      { pickupType: 'ward', weight: 5, duration: 2.5, color: '#ce93d8', radius: 10 },
    ],
  },
];

export function getPropDropTableById(id) {
  return propDropData.find((table) => table.id === id) ?? null;
}
