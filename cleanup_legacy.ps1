# cleanup_legacy.ps1
# Ashen Requiem — 구버전·중복 파일 정리 스크립트
#
# 실행:
#   cd C:\Users\mjuik\AshenRequiem
#   .\cleanup_legacy.ps1
#
# 삭제 대상:
#   Q-① src/systems/movement/EliteBehaviorSystem.js  — re-export stub
#       (실제 구현체: src/systems/combat/EliteBehaviorSystem.js)
#   Q-② src/utils/SpatialGrid.js                      — 구버전 미사용 중복
#       (활성 버전:   src/managers/SpatialGrid.js)

$root = $PSScriptRoot  # 스크립트가 프로젝트 루트에 있을 경우
# 프로젝트 루트를 직접 지정하려면:
# $root = "C:\Users\mjuik\AshenRequiem"

$targets = @(
  "src\systems\movement\EliteBehaviorSystem.js",
  "src\utils\SpatialGrid.js"
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

Write-Host "`n완료." -ForegroundColor Cyan
