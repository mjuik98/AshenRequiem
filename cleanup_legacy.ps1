# cleanup_legacy.ps1
# Ashen Requiem — 구버전·중복·데드코드 파일 정리 스크립트 (업데이트)
#
# 실행:
#   cd C:\Users\mjuik\AshenRequiem
#   .\cleanup_legacy.ps1
#
# ────────────────────────────────────────────────────────────────
# 삭제 대상
# ────────────────────────────────────────────────────────────────
#
# [Q-①] src/systems/movement/EliteBehaviorSystem.js
#        re-export stub — 실제 구현체: src/systems/combat/EliteBehaviorSystem.js
#        PlayContext.buildPipeline()은 combat/ 버전을 import함.
#        movement/ 버전이 남아 있으면 IDE에서 두 파일이 검색되어 혼란을 줌.
#
# [Q-②] src/utils/SpatialGrid.js
#        구버전 미사용 중복 — 활성 버전: src/managers/SpatialGrid.js
#        EnemyMovementSystem, CollisionSystem 모두 managers/ 버전 import.
#        utils/ 버전은 어디서도 참조되지 않음.
#
# [Legacy] src/systems/event/EventBusHandler.js
#        EventRegistry 도입 이전의 단일 파일 이벤트 버스.
#        현재 PlayContext / Pipeline 어디에도 등록되지 않음.
#        EventRegistry.js 가 완전히 대체함.

$root = $PSScriptRoot
# 프로젝트 루트를 직접 지정하려면:
# $root = "C:\Users\mjuik\AshenRequiem"

$targets = @(
  "src\systems\movement\EliteBehaviorSystem.js",   # Q-①
  "src\utils\SpatialGrid.js",                       # Q-②
  "src\systems\event\EventBusHandler.js"            # Legacy — EventRegistry로 대체됨
)

Write-Host "`n=== Ashen Requiem 레거시 파일 정리 ===" -ForegroundColor Cyan

foreach ($rel in $targets) {
  $path = Join-Path $root $rel
  if (Test-Path $path) {
    Remove-Item $path -Force
    Write-Host "  [삭제] $rel" -ForegroundColor Green
  } else {
    Write-Host "  [없음] $rel (이미 삭제됨)" -ForegroundColor Yellow
  }
}

Write-Host "`n완료. npm run validate 로 데이터 무결성을 확인하세요." -ForegroundColor Cyan
