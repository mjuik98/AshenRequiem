export function createPauseOverlayConfig({
  world,
  data,
  session,
  isBlocked,
  transitionPlayMode,
  hidePause,
  onOptionsChange,
}) {
  return {
    player: world.player,
    data,
    world,
    session,
    onResume: () => {
      if (!world || isBlocked()) return;
      transitionPlayMode(world, 'playing');
      hidePause();
    },
    onForfeit: () => {
      if (!world || isBlocked()) return;
      world.runOutcome = { type: 'defeat' };
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
}) {
  return {
    onRestart: () => {
      if (isBlocked()) return;
      setBlocked(true);
      restart();
    },
    onTitle: () => {
      if (isBlocked()) return;
      setBlocked(true);
      goToTitle();
    },
  };
}
