# PowerShell script to help setup email configuration
# Run this script to check and set your email environment variables

Write-Host "🔧 Email Configuration Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Check if .env file exists
if (Test-Path ".env") {
    Write-Host "✅ .env file found" -ForegroundColor Green
    Write-Host "📄 Contents of .env file:" -ForegroundColor Yellow
    Get-Content ".env" | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
} else {
    Write-Host "❌ .env file not found" -ForegroundColor Red
    Write-Host "Creating sample .env file..." -ForegroundColor Yellow
    
    $envContent = @"
# Email Configuration for Contact Form
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=your-email@gmail.com
TO_EMAIL=your-email@gmail.com
"@
    
    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "✅ Sample .env file created" -ForegroundColor Green
    Write-Host "📝 Please edit .env file with your actual email settings" -ForegroundColor Yellow
}

Write-Host "`n🔍 Current Environment Variables:" -ForegroundColor Cyan
$envVars = @("SMTP_HOST", "SMTP_PORT", "SMTP_USERNAME", "SMTP_PASSWORD", "FROM_EMAIL", "TO_EMAIL")
foreach ($var in $envVars) {
    $value = [Environment]::GetEnvironmentVariable($var)
    if ($value) {
        if ($var -eq "SMTP_PASSWORD") {
            Write-Host "   $var = [HIDDEN]" -ForegroundColor Green
        } else {
            Write-Host "   $var = $value" -ForegroundColor Green
        }
    } else {
        Write-Host "   $var = [NOT SET]" -ForegroundColor Red
    }
}

Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Edit the .env file with your actual email settings" -ForegroundColor White
Write-Host "2. For Gmail: Enable 2FA and create an App Password" -ForegroundColor White
Write-Host "3. Restart the server: go run main.go" -ForegroundColor White
Write-Host "4. Test the contact form" -ForegroundColor White

Write-Host "`n🔗 Gmail App Password Guide:" -ForegroundColor Cyan
Write-Host "https://support.google.com/accounts/answer/185833" -ForegroundColor Blue
