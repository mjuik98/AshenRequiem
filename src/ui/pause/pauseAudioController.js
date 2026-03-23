import { buildNextPauseOptions } from './pauseAudioControls.js';

export function bindPauseAudioControls(root, pauseOptions, onChange) {
  if (!root) return;

  root.querySelectorAll('.pv-audio-slider').forEach((input) => {
    input.addEventListener('input', (event) => {
      const key = event.currentTarget.dataset.soundKey;
      const value = Number(event.currentTarget.value);
      const nextOptions = buildNextPauseOptions(pauseOptions(), {
        type: 'slider',
        key,
        value,
      });
      const valueEl = root.querySelector(`#pv-sound-value-${key}`);
      if (valueEl) valueEl.textContent = String(value);
      onChange(nextOptions);
    });
  });

  root.querySelectorAll('.pv-sound-toggle').forEach((button) => {
    button.addEventListener('click', (event) => {
      const key = event.currentTarget.dataset.toggleKey;
      const nextOptions = buildNextPauseOptions(pauseOptions(), {
        type: 'toggle',
        key,
      });
      event.currentTarget.classList.toggle('active', nextOptions[key]);
      event.currentTarget.setAttribute('aria-pressed', String(nextOptions[key]));
      const pill = event.currentTarget.querySelector('.pv-sound-toggle-pill');
      if (pill) pill.textContent = nextOptions[key] ? 'ON' : 'OFF';
      onChange(nextOptions);
    });
  });
}
