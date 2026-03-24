export function getStatusLabel(statusEffectId) {
  const labels = {
    slow: '슬로우',
    poison: '독',
    stun: '스턴',
  };
  return labels[statusEffectId] ?? statusEffectId;
}
