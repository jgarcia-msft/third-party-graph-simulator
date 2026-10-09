[CmdletBinding()]
param(
    [string]$NodeVersion = "24.21.0"
)

$ErrorActionPreference = "Stop"

# ------------------------------------------------------------
# Configuration
# ------------------------------------------------------------

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$DistRoot    = Join-Path $ProjectRoot "dist"
$BuildRoot   = Join-Path $DistRoot "ThirdPartyGraphSimulator"
$AppRoot     = Join-Path $BuildRoot "app"
$RuntimeRoot = Join-Path $BuildRoot "runtime"

$NodeZipName = "node-v$NodeVersion-win-x64.zip"
$NodeUrl     = "https://nodejs.org/dist/v$NodeVersion/$NodeZipName"

$TempRoot       = Join-Path $env:TEMP "ThirdPartyGraphSimulatorBuild"
$NodeZip        = Join-Path $TempRoot $NodeZipName
$NodeExtractDir = Join-Path $TempRoot "node"

# ------------------------------------------------------------
# Helper
# ------------------------------------------------------------

function Write-Step {
    param([string]$Message)

    Write-Host ""
    Write-Host "============================================================"
    Write-Host $Message
    Write-Host "============================================================"
}

# ------------------------------------------------------------
# Header
# ------------------------------------------------------------

Write-Host ""
Write-Host "============================================================"
Write-Host " Third-Party Graph Simulator - Portable Build"
Write-Host "============================================================"
Write-Host ""
Write-Host "Project:      $ProjectRoot"
Write-Host "Node version: $NodeVersion"
Write-Host ""

# ------------------------------------------------------------
# Validate project
# ------------------------------------------------------------

Write-Step "1. Validating project"

$RequiredFiles = @(
    "server.js",
    "package.json",
    "package-lock.json",
    "Start Graph Simulator.cmd"
)

foreach ($File in $RequiredFiles) {

    $Path = Join-Path $ProjectRoot $File

    if (-not (Test-Path $Path)) {
        throw "Required file was not found: $Path"
    }

    Write-Host "Found: $File"
}

# ------------------------------------------------------------
# Read application version
# ------------------------------------------------------------

$PackageJsonPath = Join-Path $ProjectRoot "package.json"
$PackageJson = Get-Content $PackageJsonPath -Raw | ConvertFrom-Json

$AppVersion = $PackageJson.version

if ([string]::IsNullOrWhiteSpace($AppVersion)) {
    $AppVersion = "0.0.0"
}

Write-Host ""
Write-Host "Application version: $AppVersion"

$OutputZipName = "ThirdPartyGraphSimulator-v$AppVersion-win-x64.zip"
$OutputZip = Join-Path $DistRoot $OutputZipName

# ------------------------------------------------------------
# Verify npm
# ------------------------------------------------------------

Write-Step "2. Checking local build environment"

$NpmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue

if (-not $NpmCommand) {
    throw "npm.cmd was not found. Node.js/npm is required on the BUILD computer."
}

$NpmPath = $NpmCommand.Source

Write-Host "npm found:"
Write-Host $NpmPath

Write-Host ""
Write-Host "npm version:"

& $NpmPath --version

if ($LASTEXITCODE -ne 0) {
    throw "npm validation failed."
}

# ------------------------------------------------------------
# Clean previous build
# ------------------------------------------------------------

Write-Step "3. Cleaning previous build"

if (Test-Path $DistRoot) {
    Remove-Item $DistRoot -Recurse -Force
}

if (Test-Path $TempRoot) {
    Remove-Item $TempRoot -Recurse -Force
}

New-Item $DistRoot -ItemType Directory -Force | Out-Null
New-Item $BuildRoot -ItemType Directory -Force | Out-Null
New-Item $AppRoot -ItemType Directory -Force | Out-Null
New-Item $RuntimeRoot -ItemType Directory -Force | Out-Null
New-Item $TempRoot -ItemType Directory -Force | Out-Null

Write-Host "Build directories created."

# ------------------------------------------------------------
# Install dependencies
# ------------------------------------------------------------

Write-Step "4. Installing application dependencies"

Push-Location $ProjectRoot

try {

    Write-Host "Working directory:"
    Write-Host (Get-Location)
    Write-Host ""

    Write-Host "Running:"
    Write-Host "`"$NpmPath`" ci"
    Write-Host ""

    & $NpmPath "ci"

    $NpmExitCode = $LASTEXITCODE

    if ($NpmExitCode -ne 0) {
        throw "npm ci failed with exit code $NpmExitCode."
    }

}
finally {
    Pop-Location
}

Write-Host ""
Write-Host "Dependencies installed successfully."

# ------------------------------------------------------------
# Copy application
# ------------------------------------------------------------

Write-Step "5. Copying application files"

$ExcludedDirectories = @(
    ".git",
    ".github",
    "dist",
    "scripts"
)

$ExcludedFiles = @(
    "Start Graph Simulator.cmd",
    ".gitignore"
)

Get-ChildItem $ProjectRoot | ForEach-Object {

    if ($_.PSIsContainer) {

        if ($ExcludedDirectories -notcontains $_.Name) {

            Write-Host "Copying directory: $($_.Name)"

            Copy-Item `
                $_.FullName `
                (Join-Path $AppRoot $_.Name) `
                -Recurse `
                -Force
        }

    }
    else {

        if ($ExcludedFiles -notcontains $_.Name) {

            Write-Host "Copying file: $($_.Name)"

            Copy-Item `
                $_.FullName `
                (Join-Path $AppRoot $_.Name) `
                -Force
        }
    }
}

# ------------------------------------------------------------
# Copy launcher
# ------------------------------------------------------------

Write-Step "6. Adding launcher"

$LauncherSource = Join-Path $ProjectRoot "Start Graph Simulator.cmd"
$LauncherTarget = Join-Path $BuildRoot "Start Graph Simulator.cmd"

Copy-Item $LauncherSource $LauncherTarget -Force

Write-Host "Launcher added."

# ------------------------------------------------------------
# Download portable Node runtime
# ------------------------------------------------------------

Write-Step "7. Downloading portable Node.js runtime"

Write-Host "Node version: $NodeVersion"
Write-Host "Source:"
Write-Host $NodeUrl
Write-Host ""

Invoke-WebRequest `
    -Uri $NodeUrl `
    -OutFile $NodeZip `
    -UseBasicParsing

if (-not (Test-Path $NodeZip)) {
    throw "Node.js download failed."
}

Write-Host "Node runtime downloaded."

# ------------------------------------------------------------
# Extract Node
# ------------------------------------------------------------

Write-Step "8. Extracting Node.js"

New-Item $NodeExtractDir -ItemType Directory -Force | Out-Null

Expand-Archive `
    -Path $NodeZip `
    -DestinationPath $NodeExtractDir `
    -Force

$ExtractedNodeRoot = Join-Path `
    $NodeExtractDir `
    "node-v$NodeVersion-win-x64"

$NodeExe = Join-Path $ExtractedNodeRoot "node.exe"

if (-not (Test-Path $NodeExe)) {
    throw "node.exe was not found after extraction."
}

# Only node.exe is required for the portable runtime.
Copy-Item `
    $NodeExe `
    (Join-Path $RuntimeRoot "node.exe") `
    -Force

Write-Host "Bundled runtime created:"
Write-Host (Join-Path $RuntimeRoot "node.exe")

# ------------------------------------------------------------
# Validate portable runtime
# ------------------------------------------------------------

Write-Step "9. Validating bundled Node.js"

$PortableNode = Join-Path $RuntimeRoot "node.exe"

$ReportedNodeVersion = & $PortableNode --version

if ($LASTEXITCODE -ne 0) {
    throw "ode.js runtime failed validation."
}

Write-Host "Bundled Node reports: $ReportedNodeVersion"

# ------------------------------------------------------------
# Validate final package
# ------------------------------------------------------------

Write-Step "10. Validating portable package"

$PackageRequirements = @(
    (Join-Path $BuildRoot "Start Graph Simulator.cmd"),
    (Join-Path $RuntimeRoot "node.exe"),
    (Join-Path $AppRoot "server.js"),
    (Join-Path $AppRoot "package.json"),
    (Join-Path $AppRoot "node_modules")
)

foreach ($Requirement in $PackageRequirements) {

    if (-not (Test-Path $Requirement)) {
        throw "Portable package validation failed. Missing: $Requirement"
    }

    Write-Host "OK: $Requirement"
}

# ------------------------------------------------------------
# Create ZIP
# ------------------------------------------------------------

Write-Step "11. Creating portable ZIP"

if (Test-Path $OutputZip) {
    Remove-Item $OutputZip -Force
}

Compress-Archive `
    -Path "$BuildRoot\*" `
    -DestinationPath $OutputZip `
    -CompressionLevel Optimal

if (-not (Test-Path $OutputZip)) {
    throw "ZIP creation failed."
}

# ------------------------------------------------------------
# Clean temporary build files
# ------------------------------------------------------------

Write-Step "12. Cleaning temporary files"

if (Test-Path $TempRoot) {
    Remove-Item $TempRoot -Recurse -Force
}

# ------------------------------------------------------------
# Complete
# ------------------------------------------------------------

$ZipFile = Get-Item -LiteralPath $OutputZip

$ZipSizeBytes = [long]$ZipFile.Length
$ZipSizeMB = [math]::Round($ZipSizeBytes / 1MB, 2)

Write-Host ""
Write-Host "============================================================"
Write-Host " PORTABLE BUILD COMPLETE"
Write-Host "============================================================"
Write-Host ""
Write-Host "Application version : $AppVersion"
Write-Host "Node version        : $ReportedNodeVersion"
Write-Host "Architecture        : Windows x64"
Write-Host "ZIP size            : $ZipSizeMB MB"
Write-Host ""
Write-Host "Output:"
Write-Host $OutputZip
Write-Host ""
Write-Host "============================================================"