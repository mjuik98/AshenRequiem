import { buildAccessoryLevelDesc } from '../../data/accessoryDataHelpers.js';
import {
  escapeHtml,
  formatCompactNumber,
  formatSeconds,
  getItemDefinition,
  getKindLabel,
  getRelatedItems,
  getSlotIcon,
  getStatusLabel,
} from './pauseLoadoutModel.js';

function buildStatusRows(selectedItem, relationCount) {
  if (selectedItem?.kind === 'weapon') {
    return [
      ['현재 위력', selectedItem.source?.damage ?? '—'],
      ['현재 쿨다운', formatCompactNumber(selectedItem.source?.cooldown)],
      ['연결 수', relationCount],
    ];
  }

  if (selectedItem?.kind === 'accessory') {
    return [
      ['희귀도', selectedItem.source?.rarity ?? 'common'],
      ['연결 수', relationCount],
    ];
  }

  return [
    ['상태', getKindLabel(selectedItem?.kind)],
  ];
}

export function renderPauseStatusBlock(selectedItem, relationCount) {
  const rows = buildStatusRows(selectedItem, relationCount);
  const levelBlockHtml = selectedItem?.level != null && selectedItem?.maxLevel != null
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
      <h4 class="pv-loadout-section-title">현재 상태</h4>
      <div class="pv-loadout-progress-block">
        <div class="pv-loadout-power-lines">
          ${rows.map(([label, value]) => `
            <div class="pv-loadout-power-row">
              <span class="pv-loadout-row-label">${escapeHtml(String(label))}</span>
              <span class="pv-loadout-row-value">${escapeHtml(String(value))}</span>
            </div>
          `).join('')}
        </div>
        ${levelBlockHtml}
      </div>
    </div>
  `;
}

export function renderPauseWeaponStatsSection(weapon) {
  const damage = weapon.damage ?? 0;
  const cooldown = weapon.cooldown ?? 1;
  const range = weapon.range ?? 0;
  const cooldownFill = Math.max(0, Math.min(100, Math.round((1 - (cooldown / 4)) * 100)));

  return `
    <div class="pv-loadout-stats-section">
      <h4 class="pv-loadout-section-title">스탯</h4>
      <div class="pv-stat-bar-row">
        <span class="pv-stat-bar-key">데미지</span>
        <div class="pv-stat-bar-track"><div class="pv-stat-bar-fill" style="width:${Math.min(100, damage * 7)}%;background:#e06060"></div></div>
        <span class="pv-stat-bar-val">${damage}</span>
      </div>
      <div class="pv-stat-bar-row">
        <span class="pv-stat-bar-key">쿨다운</span>
        <div class="pv-stat-bar-track"><div class="pv-stat-bar-fill" style="width:${cooldownFill}%;background:#7ecde8"></div></div>
        <span class="pv-stat-bar-val">${formatSeconds(cooldown)}</span>
      </div>
      ${range > 0 ? `
        <div class="pv-stat-bar-row">
          <span class="pv-stat-bar-key">사거리</span>
          <div class="pv-stat-bar-track"><div class="pv-stat-bar-fill" style="width:${Math.min(100, Math.round(range / 5))}%;background:#6dba72"></div></div>
          <span class="pv-stat-bar-val">${Math.round(range)}</span>
        </div>
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
  const lines = definition ? buildAccessoryLevelDesc(definition) : [];
  if (lines.length === 0) return '';

  return `
    <div class="pv-loadout-stats-section">
      <h4 class="pv-loadout-section-title">레벨별 효과</h4>
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
          </div>
        </div>
      </div>
    `,
  };
}
