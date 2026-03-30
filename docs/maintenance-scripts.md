# Maintenance Scripts

이 문서는 `package.json` baseline에 직접 묶이지 않은 유지보수 스크립트와, baseline 스크립트가 내부적으로 재사용하는 helper 스크립트의 역할을 기록한다.

## Internal Helper Scripts

이 스크립트들은 사람이 직접 자주 실행하는 entrypoint라기보다, 다른 검증 스크립트가 재사용하는 내부 helper다.

| Path | Role | Used By |
|---|---|---|
| `scripts/importGraph.mjs` | repo import graph 수집/해석 helper | `scripts/checkBoundaries.js`, `scripts/compatibilityWrappers.mjs` |

정책:

- `scripts/importGraph.mjs`는 low-signal dead script가 아니다.
- import boundary와 wrapper inventory baseline이 이 helper에 의존하므로 제거 대상이 아니라 내부 shared utility로 유지한다.
- baseline 연결은 `npm run lint` → `check:boundaries`, `npm run compatibility:wrappers` 경로가 SSOT다.

## Manual-Only Maintenance Tools

이 스크립트들은 기본 verify/lint/test/build baseline에 포함되지 않는다. 필요할 때만 수동 유지보수 용도로 실행한다.

| Path | Role | Why Not In Baseline |
|---|---|---|
| `scripts/addTsCheck.js` | 시스템/behavior 파일에 `@ts-check`와 type import를 일괄 삽입하는 보조 도구 | 대량 파일 수정 도구라서 routine verify에 넣으면 안 되고, 수동 유지보수 시점에만 사용해야 한다 |

정책:

- manual-only 도구는 README에서 baseline 명령처럼 보이게 나열하지 않는다.
- 사용 가치가 남아 있으면 문서화해서 격리하고, caller가 0이거나 역할이 사라지면 제거한다.
- 새 maintenance script를 추가할 때는 baseline script인지 manual-only인지 이 문서에 먼저 판정한다.
