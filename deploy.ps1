# Quick Deploy Script for Vercel

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Kleara Clinic - Vercel Deployment Script" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
Write-Host "Checking Vercel CLI..." -ForegroundColor Yellow
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue

if (-not $vercelInstalled) {
    Write-Host "Vercel CLI not found. Installing..." -ForegroundColor Red
    npm install -g vercel
    Write-Host "Vercel CLI installed!" -ForegroundColor Green
} else {
    Write-Host "Vercel CLI already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Choose Deployment Option:" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "1. Deploy Server (Backend)" -ForegroundColor White
Write-Host "2. Deploy Client (Frontend)" -ForegroundColor White
Write-Host "3. Deploy Both (Server + Client)" -ForegroundColor White
Write-Host "4. Exit" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1-4)"

function Deploy-Server {
    Write-Host ""
    Write-Host "Deploying Server..." -ForegroundColor Yellow
    Set-Location -Path "$PSScriptRoot\server"
    
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    
    Write-Host "Deploying to Vercel..." -ForegroundColor Yellow
    vercel --prod
    
    Write-Host "Server deployed successfully!" -ForegroundColor Green
    Set-Location -Path $PSScriptRoot
}

function Deploy-Client {
    Write-Host ""
    Write-Host "Deploying Client..." -ForegroundColor Yellow
    Set-Location -Path "$PSScriptRoot\client"
    
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    
    Write-Host "Building client..." -ForegroundColor Yellow
    npm run build
    
    Write-Host "Deploying to Vercel..." -ForegroundColor Yellow
    vercel --prod
    
    Write-Host "Client deployed successfully!" -ForegroundColor Green
    Set-Location -Path $PSScriptRoot
}

switch ($choice) {
    "1" {
        Deploy-Server
    }
    "2" {
        Deploy-Client
    }
    "3" {
        Deploy-Server
        Deploy-Client
    }
    "4" {
        Write-Host "Exiting..." -ForegroundColor Yellow
        exit
    }
    default {
        Write-Host "Invalid choice. Exiting..." -ForegroundColor Red
        exit
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Go to https://vercel.com/dashboard" -ForegroundColor White
Write-Host "2. Configure Environment Variables" -ForegroundColor White
Write-Host "3. Test your deployments" -ForegroundColor White
Write-Host ""
Write-Host "Documentation: VERCEL_DEPLOYMENT.md" -ForegroundColor Cyan
Write-Host ""
