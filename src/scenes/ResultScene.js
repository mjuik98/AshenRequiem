/**
 * ResultScene — 결과 화면 (현재는 PlayScene 내에서 처리)
 *
 * 독립 씬으로 사용하고 싶으면 이 파일을 확장할 수 있다.
 * MVP에서는 PlayScene이 결과 UI를 직접 관리한다.
 */
export class ResultScene {
  constructor(game) {
    this.game = game;
  }

  enter() {
    // 필요 시 구현
  }

  update(dt) {
    // 결과 화면에서는 업데이트 불필요
  }

  render() {
    // 배경만
    this.game.renderer.clear();
    this.game.renderer.drawBackground({ x: 0, y: 0 });
  }

  exit() {
    // 정리
  }
}
