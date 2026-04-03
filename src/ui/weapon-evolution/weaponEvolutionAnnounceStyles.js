export const WEAPON_EVOLUTION_ANNOUNCE_STYLE_ID = 'evo-announce-styles';
export const WEAPON_EVOLUTION_ANNOUNCE_CSS = `
  .evo-announce-root {
    position: absolute;
    bottom: 80px; left: 50%;
    transform: translateX(-50%);
    display: flex; align-items: center; justify-content: center;
    pointer-events: none; z-index: 32;
    min-width: 280px;
  }

  .evo-inner {
    display: flex; flex-direction: column; align-items: center; gap: 4px;
    background: linear-gradient(135deg, rgba(18, 10, 30, 0.92), rgba(40, 10, 60, 0.88));
    border: 1px solid rgba(224, 64, 251, 0.5);
    border-radius: 14px;
    padding: 14px 28px;
    box-shadow:
      0 0 24px rgba(224, 64, 251, 0.35),
      0 8px 32px rgba(0, 0, 0, 0.6);
    animation: evo-slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    text-align: center;
  }

  .evo-announce-root.evo-fade-out .evo-inner {
    animation: evo-slide-down 0.5s ease-in forwards;
  }

  @keyframes evo-slide-up {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes evo-slide-down {
    from { opacity: 1; transform: translateY(0); }
    to   { opacity: 0; transform: translateY(-10px); }
  }

  .evo-badge {
    font-size: 11px;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: #ce93d8;
    font-weight: 700;
  }

  .evo-name {
    font-size: 20px;
    font-weight: 900;
    color: #e040fb;
    letter-spacing: 0.1em;
    text-shadow: 0 0 16px rgba(224, 64, 251, 0.7);
  }

  .evo-text {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.72);
  }
`;

export function ensureWeaponEvolutionAnnounceStyles(documentRef = document) {
  if (documentRef.getElementById(WEAPON_EVOLUTION_ANNOUNCE_STYLE_ID)) return;
  const style = documentRef.createElement('style');
  style.id = WEAPON_EVOLUTION_ANNOUNCE_STYLE_ID;
  style.textContent = WEAPON_EVOLUTION_ANNOUNCE_CSS;
  documentRef.head.appendChild(style);
}
