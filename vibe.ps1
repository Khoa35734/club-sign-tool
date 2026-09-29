$ErrorActionPreference = "Stop"

$PromptFile = ".\prompts\vibe-code.md"
$Model = "gemini-3.8-flash-high"
$Agent = "implementer"

if (-not (Test-Path $PromptFile)) {
    Write-Host "Missing prompt file: $PromptFile"
    exit 1
}

Write-Host "Starting Club Sign Tool vibe coding..."
Write-Host "Agent: $Agent"
Write-Host "Model: $Model"
Write-Host ""

agy `
    -p (Get-Content $PromptFile -Raw) `
    --agent $Agent `
    --model $Model `
    --effort high

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Antigravity exited with code $LASTEXITCODE"
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "Vibe coding run finished."
Write-Host ""
Write-Host "Review changes with:"
Write-Host "  git status"
Write-Host "  git diff"