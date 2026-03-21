/**
 * src/scenes/sceneNavigation.js
 *
 * 씬 단위 비동기 전환 가드.
 * - 중복 전환 방지
 * - enter()/exit() 경계에서 이전 비동기 작업 stale 판정
 */

export function createSceneNavigationGuard() {
  let cycle = 0;
  let navigating = false;

  return {
    reset() {
      cycle += 1;
      navigating = false;
      return cycle;
    },

    isNavigating() {
      return navigating;
    },

    async run(task, onError = null) {
      if (navigating) return false;

      navigating = true;
      const runCycle = cycle;
      const ctx = {
        isStale() {
          return runCycle !== cycle;
        },
      };

      try {
        await task(ctx);
        return true;
      } catch (error) {
        if (!ctx.isStale()) {
          onError?.(error);
        }
        return false;
      } finally {
        if (runCycle === cycle) {
          navigating = false;
        }
      }
    },

    async change(commit, onError = null) {
      return this.run(async ({ isStale }) => {
        if (isStale()) return;
        await commit();
      }, onError);
    },

    async load(loader, commit, onError = null) {
      return this.run(async ({ isStale }) => {
        const loaded = await loader();
        if (isStale()) return;
        await commit(loaded);
      }, onError);
    },
  };
}
