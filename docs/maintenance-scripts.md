# Maintenance Scripts

이 문서는 `package.json` baseline에 직접 묶이지 않은 유지보수 스크립트와, baseline 스크립트가 내부적으로 재사용하는 helper 스크립트의 역할을 기록한다.

## Package Script Entrypoints

아래 스크립트들은 import graph 상 inbound caller가 0이어도 dead script가 아니다. `package.json` script 또는 child-process entrypoint로 실행되는 공개 실행 경로다.

| Path | Role | Entry Path |
|---|---|---|
| `scripts/runTests.js` | Node 기반 테스트 배치 실행기 | `npm test`, `npm run test:watch` |
| `scripts/validateData.js` | game data/catalog 정합성 검증 | `npm run validate`, `npm test`(`pretest`) |
| `scripts/profile.js` | 파이프라인 프로파일/예산 검증 | `npm run profile:*`, `npm run verify*` |
| `scripts/encounterReport.mjs` | encounter/stage authoring report 생성 | `npm run encounter:report` |
| `scripts/browser-smoke/runDeterministicSmoke.mjs` | deterministic smoke 본 실행기 | `scripts/browser-smoke/runSmokeAgainstPreview.mjs`가 child process로 호출 |

정책:

- zero-import만으로 package script entrypoint를 dead code로 판정하지 않는다.
- `runDeterministicSmoke.mjs`처럼 child-process로 호출되는 스크립트는 caller가 import graph에 보이지 않아도 유지 이유를 문서에 남긴다.
- 새 entrypoint를 추가하면 `package.json` 또는 호출 경로와 함께 이 문서를 갱신한다.

## Internal Helper Scripts

이 스크립트들은 사람이 직접 자주 실행하는 entrypoint라기보다, 다른 검증 스크립트가 재사용하는 내부 helper다.

| Path | Role | Used By |
|---|---|---|
| `scripts/importGraph.mjs` | repo import graph 수집/해석 helper | `scripts/checkBoundaries.js`, `scripts/compatibilityWrappers.mjs` |
| `scripts/checkCycles.mjs` | src import cycle 검사 helper/entrypoint | `npm run check:cycles`, `npm run lint` |

정책:

- `scripts/importGraph.mjs`는 low-signal dead script가 아니다.
- import boundary와 wrapper inventory baseline이 이 helper에 의존하므로 제거 대상이 아니라 내부 shared utility로 유지한다.
- `scripts/checkCycles.mjs`는 JSDoc type cycle allowlist를 제외한 실제 src import cycle을 막는 baseline entrypoint다.
- baseline 연결은 `npm run lint` → `check:cycles`, `check:boundaries`, `npm run compatibility:wrappers` 경로가 SSOT다.

## Manual-Only Maintenance Tools

이 스크립트들은 기본 verify/lint/test/build baseline에 포함되지 않는다. 필요할 때만 수동 유지보수 용도로 실행한다.

| Path | Role | Why Not In Baseline |
|---|---|---|
| `scripts/addTsCheck.js` | 시스템/behavior 파일에 `@ts-check`와 type import를 일괄 삽입하는 보조 도구 | 대량 파일 수정 도구라서 routine verify에 넣으면 안 되고, 수동 유지보수 시점에만 사용해야 한다 |

정책:

- manual-only 도구는 README에서 baseline 명령처럼 보이게 나열하지 않는다.
- 사용 가치가 남아 있으면 문서화해서 격리하고, caller가 0이거나 역할이 사라지면 제거한다.
- 새 maintenance script를 추가할 때는 baseline script인지 manual-only인지 이 문서에 먼저 판정한다.
