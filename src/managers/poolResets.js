/**
 * poolResets.js — ObjectPool 리셋 함수 re-export
 *
 * REF(refactor): resetProjectile / resetEffect 이중 관리 제거.
 *   이전: 동일한 함수가 poolResets.js 와 createProjectile.js / createEffect.js 에
 *         각각 독립 구현으로 중복 존재.
 *         → 필드 추가/변경 시 두 곳을 동시에 수정해야 하는 유지보수 부채.
 *   이후: entity 모듈(createProjectile.js, createEffect.js)이 정의를 단독으로 소유.
 *         poolResets.js 는 PlayScene 의 import 경로 변경 없이 사용할 수 있도록
 *         re-export 만 담당.
 *
 * 사용 규칙:
 *   - ObjectPool 의 리셋 함수가 필요하면 이 파일에서 import 한다.
 *   - 리셋 함수 자체를 수정해야 하면 각 entity 파일(createProjectile.js, createEffect.js)을
 *     수정한다. 이 파일은 수정하지 않는다.
 */
export { resetProjectile } from '../entities/createProjectile.js';
export { resetEffect }     from '../entities/createEffect.js';
