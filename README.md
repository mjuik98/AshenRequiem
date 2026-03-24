# Ashen Requiem (Vamplike)

> HTML / JavaScript 기반의 뱀서라이크(Vampire Survivors-like) 프로젝트입니다.
> MVP를 넘어 **Phase 2 확장 구조를 실제로 운용 중인** 브라우저 액션 게임 프로젝트입니다.

## 프로젝트 비전 및 목표

브라우저 환경에서 동작하는 성능 좋고 확장성 있는 뱀서라이크 게임을 만듭니다.
기본 전투 루프를 넘어서 **메타 진행, 세션 저장/복원, 보스/페이즈, 무기 진화, 도감, 설정/사운드, 성능 기준선 검증**까지 포함한 Phase 2 기반을 확장하고 있습니다.

---

## 엔진 아키텍처 개요

본 프로젝트는 무거운 범용 엔진 대신 아래와 같은 명확한 **책임 분리 원칙**을 기반으로 자체 구축되었습니다.

- **Scene**: 게임의 흐름 제어 (메인 화면 ↔ 플레이 ↔ 결과)
- **System**: 게임 규칙 로직 전담 (이동, 스폰, 충돌, 데미지 등)
- **Entity**: 얇은 데이터/상태 객체
- **Renderer / UI**: 규칙 개입 없이 화면 출력 및 입력 전달 전담

이 아키텍처를 바탕으로 데이터 베이스(`src/data/`) 확장만으로도 새로운 몬스터와 무기, 업그레이드를 손쉽게 추가할 수 있습니다.

> 🛠 **AI 에이전트 및 개발자 가이드**: 
> 규칙과 설계 원칙은 [AGENTS.md](./AGENTS.md)를, 현재 구현 사실과 파이프라인 스냅샷은 [docs/architecture-current.md](./docs/architecture-current.md)를 기준으로 확인합니다.
> 현재 구조 스냅샷을 다시 출력하려면 `npm run architecture:snapshot`를 사용합니다.

---

## 현재 구현 상태

### Core Loop
- [x] 플레이어 및 적 추적 이동
- [x] 자동 공격 로직 및 투사체 발사
- [x] 적 처치 및 경험치 획득 루프
- [x] 레벨업 시 3개 선택지 제공
- [x] 시간 경과에 따른 적 스폰량 증가 (웨이브 시스템)

### Implemented Expansion Surface
- [x] 메타 진행 상점 (`MetaShopScene`)
- [x] 세션 저장/로드와 마이그레이션 (`localStorage`)
- [x] 보스 페이즈, 보스 알림, 보스 데이터
- [x] 시너지 및 무기 진화 시스템
- [x] 도감/런 기록 조회 (`CodexScene`)
- [x] 설정 화면, 오디오 볼륨, 렌더 품질 프리셋
- [x] 파이프라인 성능 예산 검증 (`profile:check`)
- [x] deterministic browser smoke 시나리오

### Near-Term Focus
- [ ] 메타/도감/런타임 UI 폴리싱
- [ ] 적/무기/장신구 데이터 확장
- [ ] 보스 패턴과 시너지 조합 추가
- [ ] 저장 데이터와 해금 흐름 고도화

---

## 씬 구성

- `TitleScene`: 시작 화면과 진입 허브
- `PlayScene`: 전투 런타임
- `ResultScene`: 런 종료 결과
- `MetaShopScene`: 영구 업그레이드 상점
- `CodexScene`: 적/무기/기록 도감
- `SettingsScene`: 옵션 설정

플레이 파이프라인, 이벤트 흐름, 세션 경계는 [docs/architecture-current.md](./docs/architecture-current.md)에 정리되어 있습니다.

---

## 개발 환경 및 실행 방법

### 로컬 서버 실행
프로젝트는 Vite를 번들러 및 개발 서버로 사용합니다.

```bash
npm install
npm run dev
```
(브라우저에서 `http://localhost:5173` 으로 접속)

### 테스트 및 검증
주요 시스템들의 무결성과 데이터 정합성을 검증하기 위한 자동화된 테스트가 준비되어 있습니다.

```bash
# 데이터 무결성 검증 (순환 참조, 잘못된 ID 등)
npm run validate

# scoped checkJs 기반 타입 검증
npm run typecheck

# 전체 단위 테스트 실행 (Node.js Test Runner)
npm test

# 빌드 후 실제 브라우저에서 deterministic smoke 실행
npm run test:smoke

# 로컬 빠른 기준선: typecheck + profile budget + unit test + build
npm run verify

# CI 기준선: verify + browser smoke
npm run verify:ci

# 파이프라인 성능 요약(JSON)
npm run profile:json

# 파이프라인 성능 예산 검사
npm run profile:check
```
