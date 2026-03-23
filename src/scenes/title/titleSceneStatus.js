export function createTitleStatusController(
  liveEl,
  flashEl,
  { setTimeoutFn = globalThis.setTimeout } = {},
) {
  function pulseFlash() {
    if (!flashEl) return;
    flashEl.style.background = 'rgba(255, 242, 216, 0.12)';
    setTimeoutFn(() => {
      if (flashEl) {
        flashEl.style.background = 'rgba(255, 242, 216, 0)';
      }
    }, 260);
  }

  function setMessage(text) {
    if (liveEl) {
      liveEl.textContent = text;
    }
  }

  return {
    pulseFlash,
    setMessage,
  };
}

export function attemptWindowClose(
  {
    windowRef = window,
    setMessage = () => {},
    onError = () => {},
  } = {},
) {
  setMessage('게임을 종료하는 중…');

  const showBlockedMessage = () => {
    setMessage('브라우저가 종료를 차단했습니다. 탭 또는 창을 직접 닫아주세요.');
  };

  try {
    windowRef.close();
  } catch (error) {
    onError(error);
    showBlockedMessage();
    return;
  }

  windowRef.setTimeout(() => {
    if (!windowRef.closed) {
      showBlockedMessage();
    }
  }, 180);
}
