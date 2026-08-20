# Launch Cursor Agent CLI in this repo (same skill, rules, and MCP as the editor).
# Usage:
#   .\scripts\d360-agent.ps1
#   .\scripts\d360-agent.ps1 -p "How many patients have Premarin on their brand profile?"
#   .\scripts\d360-agent.ps1 -p --approve-mcps "How many doctors opened a headquarter email in the last 90 days?"

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")

function Ensure-Agent {
  $cmd = Get-Command agent -ErrorAction SilentlyContinue
  if ($cmd) { return }
  Write-Host "Cursor CLI (agent) not found. Installing..."
  irm 'https://cursor.com/install?win32=true' | iex
  $localBin = Join-Path $env:USERPROFILE ".local\bin"
  if (Test-Path $localBin) {
    $env:PATH = "$localBin;$env:PATH"
  }
  if (-not (Get-Command agent -ErrorAction SilentlyContinue)) {
    throw "agent still not on PATH. Close this window, open a new PowerShell, and retry."
  }
}

Ensure-Agent
Set-Location $RepoRoot
Write-Host "Workspace: $RepoRoot"
Write-Host "Skill: d360-segments-activations  |  MCP: data360 (from mcp.json)"

if ($args.Count -eq 0) {
  & agent --workspace "$RepoRoot"
} else {
  & agent --workspace "$RepoRoot" @args
}
