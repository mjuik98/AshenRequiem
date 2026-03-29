export function createPauseOverlayConfig({
  world,
  data,
  session,
  isBlocked,
  transitionPlayMode,
  hidePause,
  consumePausePress = () => {},
  onOptionsChange,
}) {
  return {
    player: world.entities.player,
    data,
    world,
    session,
    onResume: () => {
      if (!world || isBlocked()) return;
      consumePausePress();
      transitionPlayMode(world, 'playing');
      hidePause();
    },
    onForfeit: () => {
      if (!world || isBlocked()) return;
      world.run.runOutcome = { type: 'defeat' };
      hidePause();
      transitionPlayMode(world, 'dead');
    },
    onOptionsChange,
  };
}

export function createResultSceneActions({
  isBlocked,
  setBlocked,
  restart,
  goToTitle,
  onError = null,
}) {
  const runTransition = async (action) => {
    if (isBlocked()) return false;
    setBlocked(true);
    try {
      await action?.();
      return true;
    } catch (error) {
      setBlocked(false);
      onError?.(error);
      return false;
    }
  };

  return {
    onRestart: () => {
      void runTransition(restart);
    },
    onTitle: () => {
      void runTransition(goToTitle);
    },
  };
}
