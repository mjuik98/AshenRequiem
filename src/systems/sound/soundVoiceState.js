export function registerSoundVoice(activeVoices, activeVoicesByType, voiceId, typeName) {
  activeVoices.add(voiceId);
  activeVoicesByType.set(typeName, (activeVoicesByType.get(typeName) ?? 0) + 1);
}

export function unregisterSoundVoice(activeVoices, activeVoicesByType, voiceId, typeName) {
  activeVoices.delete(voiceId);
  const current = activeVoicesByType.get(typeName) ?? 0;
  const next = Math.max(0, current - 1);
  if (next === 0) {
    activeVoicesByType.delete(typeName);
  } else {
    activeVoicesByType.set(typeName, next);
  }
}
