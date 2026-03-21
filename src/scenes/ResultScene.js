export class ResultScene {
  constructor(game) {
    this.game = game;
    this.sceneId = 'ResultScene';
  }
  enter()  {}
  update() {}
  render() { this.game.renderer.clear(); this.game.renderer.drawBackground({ x: 0, y: 0 }); }
  exit()   {}
}
