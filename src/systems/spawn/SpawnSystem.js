import { randomPick, randomRange } from '../../utils/random.js';
import { GameConfig } from '../../core/GameConfig.js';

/**
 * SpawnSystem — 시간 기반 적 스폰
 *
 * 입력: elapsedTime, waveData, player 위치, camera 범위
 * 쓰기: 직접 배열 삽입 금지
 * 출력: spawnQueue에 적 생성 요청
 */
export const SpawnSystem = {
  /** 내부 누적 타이머 */
  _spawnAccumulator: 0,

  reset() {
    this._spawnAccumulator = 0;
  },

  update({ elapsedTime, waveData, player, spawnQueue, deltaTime }) {
    if (!player || !player.isAlive) return;

    // 현재 시간에 해당하는 웨이브 찾기
    let activeWave = null;
    for (const wave of waveData) {
      if (elapsedTime >= wave.from && elapsedTime < wave.to) {
        activeWave = wave;
        break;
      }
    }

    if (!activeWave) return;

    // 누적 시간으로 스폰 개수 결정
    this._spawnAccumulator += activeWave.spawnPerSecond * deltaTime;

    while (this._spawnAccumulator >= 1) {
      this._spawnAccumulator -= 1;

      const enemyId = randomPick(activeWave.enemyIds);
      const pos = this._randomOffscreenPosition(player);

      spawnQueue.push({
        type: 'enemy',
        config: {
          enemyId,
          x: pos.x,
          y: pos.y,
        },
      });
    }
  },

  /** 화면 밖 랜덤 위치 생성 */
  _randomOffscreenPosition(player) {
    const margin = 80;
    const halfW = GameConfig.canvasWidth / 2 + margin;
    const halfH = GameConfig.canvasHeight / 2 + margin;

    // 4방향 중 랜덤
    const side = Math.floor(Math.random() * 4);
    let x, y;

    switch (side) {
      case 0: // 상
        x = player.x + randomRange(-halfW, halfW);
        y = player.y - halfH;
        break;
      case 1: // 하
        x = player.x + randomRange(-halfW, halfW);
        y = player.y + halfH;
        break;
      case 2: // 좌
        x = player.x - halfW;
        y = player.y + randomRange(-halfH, halfH);
        break;
      case 3: // 우
        x = player.x + halfW;
        y = player.y + randomRange(-halfH, halfH);
        break;
    }

    return { x, y };
  },
};
