import { buildAccessoryCurrentDesc } from '../../data/accessoryDataHelpers.js';
import {
  escapeHtml,
  formatSeconds,
  getBehaviorLabel,
  getItemDefinition,
  getKindLabel,
  matchesSlotCategory,
  getRelatedItems,
  getSlotIcon,
  getStatusLabel,
  hasSynergyActive,
  isEvolutionReady,
  toArray,
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

function findWeaponEvolutionRecipe(selectedItem, data) {
  if (selectedItem?.kind !== 'weapon') return null;
  return toArray(data?.weaponEvolutionData)
    .find((candidate) => candidate?.requires?.weaponId === selectedItem.id) ?? null;
}

function findAccessoryEvolutionRecipes(selectedItem, data) {
  if (selectedItem?.kind !== 'accessory') return [];
  return toArray(data?.weaponEvolutionData)
    .filter((candidate) => toArray(candidate?.requires?.accessoryIds).includes(selectedItem.id));
}

function resolveEvolutionResultLabel(recipe, indexes) {
  if (!recipe) return null;
  return indexes?.weaponById?.get(recipe?.resultWeaponId)?.name
    ?? recipe?.resultWeaponId
    ?? null;
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

export function renderPauseGuidanceBlock(selectedItem, player, data, indexes) {
  let body = '연결 장비와 레벨 진행을 확인해 다음 파워 스파이크를 준비하세요.';

  if (selectedItem?.kind === 'empty') {
    body = matchesSlotCategory(selectedItem, 'weapon')
      ? '다음 레벨업에서 새 무기를 채우면 시너지와 진화 경로가 크게 늘어납니다.'
      : '다음 레벨업에서 장신구를 확보하면 기존 무기의 시너지와 진화를 바로 열 수 있습니다.';
  } else if (selectedItem?.kind === 'weapon') {
    const recipe = findWeaponEvolutionRecipe(selectedItem, data);
    const resultLabel = resolveEvolutionResultLabel(recipe, indexes);
    if (isEvolutionReady(selectedItem, player, data)) {
      body = `${resultLabel ?? '진화 결과'} 준비 완료. 상자 획득 타이밍에 맞춰 즉시 파워 스파이크를 노리세요.`;
    } else if (hasSynergyActive(selectedItem, player, indexes)) {
      const synergy = (indexes?.synergiesByWeaponId?.get(selectedItem.id) ?? [])
        .find((entry) => (player?.activeSynergies ?? []).includes(entry?.id));
      body = `${synergy?.name ?? '활성 시너지'}가 켜져 있습니다. 연결 장비를 유지하면서 레벨을 밀어 다음 진화를 준비하세요.`;
    } else {
      const relatedItems = getRelatedItems(selectedItem, player, data, indexes);
      const equippedRelatedCount = relatedItems.filter((item) => item.equipped).length;
      if (relatedItems.length > 0) {
        body = `연결 아이템 ${equippedRelatedCount}/${relatedItems.length}개 확보. 남은 조합을 맞추면 화력 상승 폭이 커집니다.`;
      }
    }
  } else if (selectedItem?.kind === 'accessory') {
    const matchedRecipes = findAccessoryEvolutionRecipes(selectedItem, data);
    if (hasSynergyActive(selectedItem, player, indexes)) {
      const synergy = (indexes?.synergiesByAccessoryId?.get(selectedItem.id) ?? [])
        .find((entry) => (player?.activeSynergies ?? []).includes(entry?.id));
      body = `${synergy?.name ?? '활성 시너지'} 유지 중. 연결 무기를 강화해 보조 효과를 전투력으로 바꾸세요.`;
    } else if (matchedRecipes.length > 0) {
      const weaponName = indexes?.weaponById?.get(matchedRecipes[0]?.requires?.weaponId)?.name
        ?? matchedRecipes[0]?.requires?.weaponId
        ?? '연결 무기';
      body = `${weaponName}과 함께 진화 경로를 가집니다. 연결 무기를 먼저 확보하거나 유지하는 것이 효율적입니다.`;
    } else if (selectedItem?.rarity === 'rare' || selectedItem?.source?.rarity === 'rare') {
      body = '희귀 장신구입니다. 무기와 연결되면 즉시 체감되는 보정으로 이어질 가능성이 큽니다.';
    }
  }

  return `
    <section class="pv-loadout-guidance variant-guidance">
      <h4 class="pv-loadout-section-title">다음 파워 스파이크</h4>
      <div class="pv-loadout-guidance-copy">${escapeHtml(body)}</div>
    </section>
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
