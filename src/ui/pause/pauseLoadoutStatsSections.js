import { buildAccessoryCurrentDesc } from '../../data/accessoryDataHelpers.js';
import {
  escapeHtml,
  formatSeconds,
  getBehaviorLabel,
  getItemDefinition,
  getKindLabel,
  getRelatedItems,
  getSlotIcon,
  getStatusLabel,
  hasSynergyActive,
  isEvolutionReady,
} from './pauseLoadoutModel.js';

function hasLevelProgress(selectedItem) {
  return selectedItem?.level != null && selectedItem?.maxLevel != null;
}

function resolveWeaponRangeValue(weapon) {
  if (!weapon) return 0;

  switch (weapon.behaviorId) {
    case 'orbit':
      return weapon.orbitRadius ?? weapon.range ?? 0;
    case 'laserBeam':
      return weapon.beamLength ?? weapon.range ?? 0;
    case 'boomerang':
      return weapon.maxRange ?? weapon.range ?? 0;
    default:
      return weapon.range ?? weapon.maxRange ?? 0;
  }
}

function resolveWeaponAreaValue(weapon) {
  if (!weapon) return 0;

  switch (weapon.behaviorId) {
    case 'chainLightning':
      return weapon.chainRange ?? weapon.radius ?? 0;
    default:
      return weapon.radius ?? 0;
  }
}

function resolveWeaponProjectileStat(weapon, player) {
  if (!weapon) return { label: '투사체 수', value: 0 };

  const bonus = Math.floor(player?.bonusProjectileCount ?? 0);

  if (Number.isFinite(weapon.orbitCount)) {
    return { label: '회전체 수', value: weapon.orbitCount + bonus };
  }

  if (Number.isFinite(weapon.chainCount)) {
    return { label: '연쇄 수', value: weapon.chainCount + bonus };
  }

  if (Number.isFinite(weapon.beamSegments)) {
    return { label: '세그먼트 수', value: weapon.beamSegments };
  }

  if (Number.isFinite(weapon.projectileCount)) {
    return { label: '투사체 수', value: weapon.projectileCount + bonus };
  }

  return { label: '투사체 수', value: 0 };
}

function resolveWeaponProjectileSpeed(weapon) {
  if (!weapon) return 0;
  return weapon.projectileSpeed ?? 0;
}

function renderWeaponStatRow(label, value, fillWidth, color) {
  return `
    <div class="pv-stat-bar-row">
      <span class="pv-stat-bar-key">${escapeHtml(label)}</span>
      <div class="pv-stat-bar-track"><div class="pv-stat-bar-fill" style="width:${fillWidth}%;background:${color}"></div></div>
      <span class="pv-stat-bar-val">${escapeHtml(String(value))}</span>
    </div>
  `;
}

function buildDetailTags(selectedItem, player, data, indexes) {
  const tags = [];
  if (selectedItem?.kind === 'weapon' && selectedItem?.source?.behaviorId) {
    tags.push({ label: getBehaviorLabel(selectedItem.source.behaviorId), tone: 'type' });
  }
  if (selectedItem?.kind === 'accessory') {
    tags.push({ label: '장신구', tone: 'type' });
  }
  if (selectedItem?.rarity === 'rare' || selectedItem?.source?.rarity === 'rare') {
    tags.push({ label: '희귀', tone: 'rare' });
  }
  if (hasSynergyActive(selectedItem, player, indexes)) {
    tags.push({ label: '시너지 활성', tone: 'synergy' });
  }
  if (isEvolutionReady(selectedItem, player, data)) {
    tags.push({ label: '진화 준비', tone: 'evolution' });
  }
  if (selectedItem?.kind === 'empty') {
    tags.push({ label: '빈 슬롯', tone: 'muted' });
  }
  return tags;
}

function renderDetailTags(selectedItem, player, data, indexes) {
  const tags = buildDetailTags(selectedItem, player, data, indexes);
  if (tags.length === 0) return '';

  return `
    <div class="pv-loadout-detail-tags">
      ${tags.map(({ label, tone }) => `<span class="pv-loadout-detail-tag is-${tone}">${escapeHtml(label)}</span>`).join('')}
    </div>
  `;
}

export function renderPauseStatusBlock(selectedItem) {
  if (!hasLevelProgress(selectedItem)) return '';

  const levelBlockHtml = hasLevelProgress(selectedItem)
    ? `
        <div class="pv-loadout-lv-block">
          <div class="pv-loadout-lv-row">
            <span>Lv.${selectedItem.level} / ${selectedItem.maxLevel}</span>
            <span class="pv-loadout-lv-pct">${Math.round((selectedItem.level / selectedItem.maxLevel) * 100)}%</span>
          </div>
          <div class="pv-loadout-lv-dots">
            ${Array.from({ length: selectedItem.maxLevel }, (_, index) => `<div class="pv-loadout-lv-dot${index < selectedItem.level ? ' filled' : ''}"></div>`).join('')}
          </div>
        </div>
      `
    : '';

  return `
    <div class="pv-loadout-power variant-status">
      <h4 class="pv-loadout-section-title">레벨 진행</h4>
      ${levelBlockHtml}
    </div>
  `;
}

export function renderPauseWeaponStatsSection(weapon, player) {
  const damage = weapon.damage ?? 0;
  const cooldown = weapon.cooldown ?? 1;
  const range = resolveWeaponRangeValue(weapon);
  const area = resolveWeaponAreaValue(weapon);
  const projectileStat = resolveWeaponProjectileStat(weapon, player);
  const projectileSpeed = resolveWeaponProjectileSpeed(weapon);
  const cooldownFill = Math.max(0, Math.min(100, Math.round((1 - (cooldown / 4)) * 100)));

  return `
    <div class="pv-loadout-stats-section">
      <h4 class="pv-loadout-section-title">스탯</h4>
      ${renderWeaponStatRow('데미지', damage, Math.min(100, damage * 7), '#e06060')}
      ${renderWeaponStatRow('쿨다운', formatSeconds(cooldown), cooldownFill, '#7ecde8')}
      ${range > 0 ? `
        ${renderWeaponStatRow('사거리', Math.round(range), Math.min(100, Math.round(range / 5)), '#6dba72')}
      ` : ''}
      ${area > 0 ? `
        ${renderWeaponStatRow('범위', Math.round(area), Math.min(100, Math.round(area / 2)), '#c08cff')}
      ` : ''}
      ${projectileStat.value > 0 ? `
        ${renderWeaponStatRow(projectileStat.label, projectileStat.value, Math.min(100, projectileStat.value * 20), '#d4af6a')}
      ` : ''}
      ${projectileSpeed > 0 ? `
        ${renderWeaponStatRow('발사체 속도', Math.round(projectileSpeed), Math.min(100, Math.round(projectileSpeed / 6)), '#7ecde8')}
      ` : ''}
      ${weapon.statusEffectId ? `
        <div class="pv-stat-bar-row">
          <span class="pv-stat-bar-key">상태이상</span>
          <span class="pv-stat-bar-status">${escapeHtml(getStatusLabel(weapon.statusEffectId))} ${Math.round((weapon.statusEffectChance ?? 0) * 100)}%</span>
        </div>
      ` : ''}
    </div>
  `;
}

export function renderPauseAccessoryStatsSection(selectedItem, indexes) {
  const definition = indexes?.accessoryById?.get(selectedItem.source.id);
  const currentLevel = selectedItem?.source?.level ?? selectedItem?.level ?? 1;
  const lines = definition ? buildAccessoryCurrentDesc(definition, currentLevel) : [];
  if (lines.length === 0) return '';

  return `
    <div class="pv-loadout-stats-section">
      <h4 class="pv-loadout-section-title">효과</h4>
      ${lines.map((line) => `<div class="pv-loadout-level-line">${escapeHtml(line)}</div>`).join('')}
    </div>
  `;
}

export function renderPauseLoadoutDetailHeader(selectedItem, player, data, indexes) {
  const kindLabel = getKindLabel(selectedItem?.kind);
  const title = selectedItem?.name ?? kindLabel;
  const definition = getItemDefinition(selectedItem, indexes);
  const summary = selectedItem?.kind === 'weapon' || selectedItem?.kind === 'accessory'
    ? (definition?.description ?? selectedItem?.description ?? '장비 역할 정보를 준비 중입니다.')
    : selectedItem?.kind === 'empty'
      ? '새로운 장비를 획득하면 이 슬롯에 배치됩니다.'
      : '추가 슬롯은 상점에서 해금합니다.';
  const relationCount = getRelatedItems(selectedItem, player, data, indexes).length;
  const detailKindClass = selectedItem?.kind === 'weapon'
    ? 'detail-kind-weapon'
    : selectedItem?.kind === 'accessory'
      ? 'detail-kind-accessory'
      : selectedItem?.kind === 'empty'
        ? 'detail-kind-empty'
        : 'detail-kind-locked';
  const detailIcon = getSlotIcon(selectedItem, indexes);

  return {
    relationCount,
    headerHtml: `
      <div class="pv-loadout-detail-header ${detailKindClass}">
        <div class="pv-loadout-detail-hero">
          <div class="pv-loadout-detail-icon">${detailIcon}</div>
          <div class="pv-loadout-detail-copy">
            <div class="pv-loadout-detail-kind">${escapeHtml(kindLabel)}</div>
            <h3 class="pv-loadout-detail-name">${escapeHtml(title)}</h3>
            <div class="pv-loadout-detail-summary">${escapeHtml(summary || '선택된 항목 정보')}</div>
            ${renderDetailTags(selectedItem, player, data, indexes)}
          </div>
        </div>
      </div>
    `,
  };
}
