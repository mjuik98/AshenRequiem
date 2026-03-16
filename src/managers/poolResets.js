/**
 * poolResets.js — ObjectPool 리셋 함수 모음
 *
 * REF(refactor): resetProjectile / resetEffect 위치 통일.
 *   이전: resetProjectile 은 createProjectile.js 와 poolResets.js 두 곳에 중복 정의.
 *         resetEffect   는 createEffect.js   와 poolResets.js 두 곳에 중복 정의.
 *   이후: 각 entity 파일(createProjectile.js, createEffect.js) 이 정식 위치.
 *         poolResets.js 는 re-export 허브 역할만 수행 → 기존 import 경로 유지 가능.
 *
 * 변경 영향 없음 — PlayScene 의 import 경로가 poolResets.js 를 가리키더라도
 * 동일한 함수 참조를 받으므로 동작에 차이가 없다.
 */
export { resetProjectile } from '../entities/createProjectile.js';
export { resetEffect }     from '../entities/createEffect.js';
