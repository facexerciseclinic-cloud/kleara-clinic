# Quick Redeploy Script
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Redeploying Both Projects" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Redeploy Server
Write-Host "Redeploying Server..." -ForegroundColor Yellow
Set-Location -Path "C:\Clinic System\server"
vercel --prod
Write-Host "Server redeployed!" -ForegroundColor Green

Write-Host ""

# Redeploy Client
Write-Host "Redeploying Client..." -ForegroundColor Yellow
Set-Location -Path "C:\Clinic System\client"
vercel --prod
Write-Host "Client redeployed!" -ForegroundColor Green

Set-Location -Path "C:\Clinic System"

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Redeploy Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your URLs:" -ForegroundColor Yellow
Write-Host "Frontend: https://client-iqeazlr90-tainnajas-projects.vercel.app" -ForegroundColor Cyan
Write-Host "Backend:  https://kleara-system-nzuphgvej-tainnajas-projects.vercel.app" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next: Test your login!" -ForegroundColor Yellow
