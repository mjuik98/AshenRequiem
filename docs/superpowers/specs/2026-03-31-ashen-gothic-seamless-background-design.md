# Ashen Gothic Seamless Background Design

Date: 2026-03-31

## Goal

이 설계는 `Ashen Requiem`의 전투 화면에 어울리는 기본 스테이지 배경 톤을 정의하고, 무한 맵 이동에 맞는 `seamless background asset strategy`를 고정하는 것을 목표로 한다.

핵심 요구는 아래 두 가지다.

- 프로젝트의 기존 세계관 톤과 어긋나지 않을 것
- 플레이어가 끝없이 이동해도 배경이 끊기지 않을 것

## Chosen Approach

추천안은 `Ashen Gothic Wasteland`를 기본 바닥 언어로 삼고, 배경을 `반복 가능한 바닥 타일`과 `분위기용 overlay`로 분리하는 방식이다.

- 바닥은 차가운 잿빛 석재와 재 먼지, 얕은 균열을 중심으로 한다.
- 색 포인트는 아주 약한 붉은 잔광만 제한적으로 사용한다.
- 큰 오브젝트는 타일 이미지에 굽지 않고 별도 prop/deco layer로 분리한다.
- 무한 맵은 large canvas background가 아니라 seamless tile 반복 렌더링으로 해결한다.

이 접근은 현재 코드베이스의 고딕 말세 판타지 톤, 그리고 `Ash Plains`, `Moon Crypt`, `Ember Hollow`, `Frost Harbor`처럼 stage별 accent가 달라지는 구조와도 잘 맞는다.

## Design Sections

### 1. Visual Tone

기본 톤은 `차가운 잿빛 기반 + 약한 붉은 잔광`이다.

- 주 색상: charcoal, ash gray, dead stone, muted brown
- 보조 색상: 매우 절제된 ember red
- 재질 키워드: weathered stone, powdery ash, shallow cracks, worn engraved lines
- 금지 요소: 밝은 용암 톤, 넓은 혈흔 면적, 강한 하이라이트, 과한 채도

배경은 “달빛 아래 재가 내려앉은 황폐한 성역 외곽”으로 읽혀야 한다. 공포물이라기보다 `몰락한 성역 전장`에 가깝고, 화면의 첫 인상은 분위기보다 전투 가독성이 우선이다.

### 2. Infinite Background Strategy

무한 맵 배경은 `한 장의 대형 배경` 대신 반복 타일로 구성한다.

- 기본 자산: `1024x1024 seamless base tile` 1장
- 보조 자산: `1024x1024 seamless overlay tile` 1장
- 선택 확장: 반복 티 감소용 base variation A/B

렌더링 개념은 카메라 월드 좌표를 타일 크기로 나눈 오프셋을 기준으로 화면보다 넓은 영역에 같은 타일을 격자 반복하는 방식이다.

반복성을 줄이기 위한 규칙은 아래와 같다.

- 좌/우, 상/하 경계가 모두 자연스럽게 이어져야 한다.
- 큰 상징 문양이나 눈에 띄는 손상 패턴을 중앙에 고정하지 않는다.
- overlay는 base와 다른 offset 또는 다른 speed로 겹칠 수 있어야 한다.
- 게임플레이 오브젝트로 오인될 수 있는 형태는 타일에 넣지 않는다.

### 3. Layer Responsibilities

배경은 세 레이어로 나눈다.

- `base floor`: 잿빛 석재, 마모된 줄눈, 얕은 균열
- `mid detail`: 바랜 성역 문양, 재 먼지, 닳은 engraved marks
- `ambient overlay`: 약한 안개 흐름, 제한된 ember glow, 미세한 ash drift

반대로 아래 요소는 반복 타일에 넣지 않는다.

- 묘비, 파손 기둥, 랜턴, 해골 더미
- 강한 실루엣을 가진 폐허 구조물
- 적/아이템으로 오인될 수 있는 고대비 물체

이런 요소는 추후 별도 prop/deco layer나 stage gimmick 연출로 분리한다.

### 4. Readability Rules

배경은 전투 정보보다 앞서 보이면 안 된다.

- 전체의 80%는 회색/흑색 계열로 유지한다.
- 붉은 강조색은 5% 이하로 제한한다.
- 플레이어/적/투사체보다 밝거나 채도 높은 지점은 만들지 않는다.
- 타일 위 노이즈 밀도는 높이되, shape contrast는 낮게 유지한다.

배경이 예쁘더라도 전투 중 이동 경로와 위협 판독을 흐리면 실패로 본다.

### 5. Reuse Across Stages

이 기본 바닥 언어는 후속 stage 확장에도 재사용 가능해야 한다.

- `Ash Plains`: 기본 base + 희미한 ward/ash accent
- `Moon Crypt`: 같은 base 위에 더 차가운 spectral overlay
- `Ember Hollow`: 같은 base 위에 붉은 ash/ember accent 강화
- `Frost Harbor`: 같은 base 위에 청회색 냉기성 표면감 추가

즉, 스테이지 차별화는 바닥 구조를 갈아엎는 대신 `accent layer`와 `prop language`를 바꾸는 방향을 우선한다.

## Asset Spec

### Base Tile

- size: `1024x1024`
- camera: top-down readable game texture
- structure: seamless square
- content: cracked dark stone ground, ash dust, worn sanctuary paving, faint engraved marks
- exclusions: no perspective, no focal object, no character, no grave, no pillar

### Overlay Tile

- size: `1024x1024`
- structure: seamless square with transparency-capable source
- content: subtle ash drift, faint fog veils, tiny ember warmth in sparse pockets
- exclusions: no hard shapes, no bright flames, no UI-like circular glyphs

## Seed Prompt

```text
Use case: stylized-concept
Asset type: seamless game background tile
Primary request: create a seamless top-down ground tile for a vampire-survivors-like action game, featuring an ashen gothic wasteland floor
Scene/backdrop: ruined sanctuary outskirts, worn stone pavement covered in ash
Subject: cracked dark stone ground with faded ritual markings and scattered ash dust
Style/medium: stylized dark-fantasy game texture, top-down, readable in gameplay
Composition/framing: perfectly tileable seamless square texture, no central focal object, even visual distribution
Lighting/mood: cold moonlit ash-gray atmosphere with very faint ember-red glow in a few small areas
Color palette: charcoal, ash gray, dead stone, muted brown, extremely restrained ember red
Materials/textures: weathered stone, powdery ash, shallow cracks, worn engraved lines
Constraints: seamless on all four edges, no large objects, no graves, no pillars, no characters, no strong highlights, no UI-like symbols
Avoid: obvious repeating motifs, bright lava, saturated red pools, high-contrast blood splatter, perspective view
```

## Acceptance Criteria

- 생성된 base tile이 네 방향 모두에서 자연스럽게 반복된다.
- 화면을 채워 반복했을 때 강한 반복 패턴이 즉시 드러나지 않는다.
- 프로젝트의 기존 `ashen / moon / ember` 톤과 충돌하지 않는다.
- 전투 가독성을 해치지 않는 명도와 채도 분포를 유지한다.
- 후속 stage가 overlay와 prop만 바꿔도 같은 기반 위에서 확장 가능하다.
