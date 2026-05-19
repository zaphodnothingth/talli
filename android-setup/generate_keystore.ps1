<#
.SYNOPSIS
    Generates a secure release keystore file for signing the Talli PWA Android Bundle.
.DESCRIPTION
    This script searches for Java's keytool utility on the system,
    prompts for password and details, and uses keytool to generate an RSA 2048-bit 
    Android signing keystore (talli.keystore) used by Bubblewrap or standard compilers.
.NOTES
    Make sure to store the generated 'talli.keystore' file and your password in a safe place!
    Losing them will prevent you from uploading updates to your app on Google Play.
#>

$ErrorActionPreference = "Stop"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "     Talli Android Keystore Generator Script      " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Search for keytool in common locations or PATH
$keytoolPath = "keytool"
$foundKeytool = $false

# Try finding via environment/PATH first
try {
    $null = Get-Command keytool -ErrorAction SilentlyContinue
    $foundKeytool = $true
    Write-Host "[✓] keytool found in system PATH." -ForegroundColor Green
} catch {
    # Try searching common JDK installations
    $javaPaths = @(
        "C:\Program Files\Java\*",
        "C:\Program Files (x86)\Java\*",
        "C:\Program Files\Eclipse Foundation\*",
        "C:\Program Files\AdoptOpenJDK\*",
        "$env:USERPROFILE\.bubblewrap\jdk\*" # Bubblewrap default JDK location if run before
    )

    foreach ($path in $javaPaths) {
        $matches = Get-ChildItem -Path $path -Filter "keytool.exe" -Recurse -ErrorAction SilentlyContinue
        if ($matches) {
            $keytoolPath = $matches[0].FullName
            $foundKeytool = $true
            Write-Host "[✓] keytool found at: $keytoolPath" -ForegroundColor Green
            break
        }
    }
}

if (-not $foundKeytool) {
    Write-Host "[!] Java Development Kit (JDK) not found, and 'keytool' is not in your PATH." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Bubblewrap can generate this automatically when you run:" -ForegroundColor Cyan
    Write-Host "  bubblewrap build" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "If you want to generate it manually now, please:" -ForegroundColor Cyan
    Write-Host "  1. Download and install JDK 17+ (e.g., from https://adoptium.net/)"
    Write-Host "  2. Rerun this script or add Java to your Environment Variables."
    Write-Host ""
    
    $choice = Read-Host "Would you like to try to run standard keytool anyway in case it works? (Y/N)"
    if ($choice -match "[Yy]") {
        $keytoolPath = "keytool"
    } else {
        Write-Host "Exiting keystore generator. You can let Bubblewrap handle signing automatically!" -ForegroundColor Cyan
        exit 0
    }
}

# 2. Prompt user for keystore information
Write-Host ""
Write-Host "Configure your keystore parameters:" -ForegroundColor DarkCyan

$keystoreName = Read-Host "Enter Keystore Filename (Default: talli.keystore)"
if ([string]::IsNullOrWhiteSpace($keystoreName)) {
    $keystoreName = "talli.keystore"
}

$keystoreAlias = Read-Host "Enter Key Alias (Default: talli-key)"
if ([string]::IsNullOrWhiteSpace($keystoreAlias)) {
    $keystoreAlias = "talli-key"
}

# Prompt for password securely
$passEntered = $false
while (-not $passEntered) {
    $password = Read-Host "Enter a secure Keystore Password (min 6 characters)"
    if ($password.Length -ge 6) {
        $passEntered = $true
    } else {
        Write-Host "Password must be at least 6 characters!" -ForegroundColor Red
    }
}

# Distinguish Name Info
Write-Host ""
Write-Host "Please enter owner details (press Enter to accept default demo info):" -ForegroundColor DarkCyan
$fullName = Read-Host "Your Name (Default: Talli Team)"
if ([string]::IsNullOrWhiteSpace($fullName)) { $fullName = "Talli Team" }

$orgUnit = Read-Host "Organizational Unit (Default: Production)"
if ([string]::IsNullOrWhiteSpace($orgUnit)) { $orgUnit = "Production" }

$org = Read-Host "Organization Name (Default: Talli App)"
if ([string]::IsNullOrWhiteSpace($org)) { $org = "Talli App" }

$city = Read-Host "City or Locality (Default: Worldwide)"
if ([string]::IsNullOrWhiteSpace($city)) { $city = "Worldwide" }

$state = Read-Host "State or Province (Default: Global)"
if ([string]::IsNullOrWhiteSpace($state)) { $state = "Global" }

$country = Read-Host "Country Code (2 characters, e.g., US) (Default: US)"
if ([string]::IsNullOrWhiteSpace($country)) { $country = "US" }

$dname = "CN=$fullName, OU=$orgUnit, O=$org, L=$city, S=$state, C=$country"

Write-Host ""
Write-Host "Generating Keystore with Command:" -ForegroundColor Cyan
Write-Host "  $keytoolPath -genkeypair -v -keystore $keystoreName -alias $keystoreAlias -keyalg RSA -keysize 2048 -validity 10000" -ForegroundColor DarkGray
Write-Host ""

# 3. Execute keytool command
try {
    # Check if file already exists to avoid overwrite accidents
    if (Test-Path $keystoreName) {
        $overwrite = Read-Host "File '$keystoreName' already exists! Overwrite? (Y/N)"
        if ($overwrite -notmatch "[Yy]") {
            Write-Host "Keystore generation aborted to prevent losing existing keys." -ForegroundColor Yellow
            exit 0
        }
        Remove-Item $keystoreName
    }

    # Run keytool using Start-Process or direct invocation
    & $keytoolPath -genkeypair -v `
        -keystore $keystoreName `
        -alias $keystoreAlias `
        -keyalg RSA `
        -keysize 2048 `
        -validity 10000 `
        -dname $dname `
        -storepass $password `
        -keypass $password

    if (Test-Path $keystoreName) {
        $fullPath = (Get-Item $keystoreName).FullName
        Write-Host ""
        Write-Host "==================================================" -ForegroundColor Green
        Write-Host " SUCCESS! Keystore file generated successfully!  " -ForegroundColor Green
        Write-Host "==================================================" -ForegroundColor Green
        Write-Host "Keystore Path: $fullPath" -ForegroundColor Yellow
        Write-Host "Key Alias:     $keystoreAlias" -ForegroundColor Yellow
        Write-Host "Store Password: [As entered by you]" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Keep this keystore file and the password extremely secure." -ForegroundColor Green
        Write-Host "You must place this file in the root of your Android build or reference it" -ForegroundColor Green
        Write-Host "during Bubblewrap config. If lost, you cannot update your Google Play app!" -ForegroundColor Green
        Write-Host "==================================================" -ForegroundColor Green
    } else {
        Write-Host "Error: Keystore file was not created. Check console logs." -ForegroundColor Red
    }
} catch {
    Write-Host "Keystore generation failed. Ensure your JDK is installed correctly." -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
