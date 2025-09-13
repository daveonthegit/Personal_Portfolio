# PowerShell script to test the contact form endpoint
# Run this to verify the email integration is working

$uri = "http://localhost:8080/contact"
$body = @{
    name = "Test User"
    email = "test@example.com"
    subject = "Test Message"
    message = "This is a test message from the contact form."
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
}

Write-Host "Testing contact form endpoint..."
Write-Host "URL: $uri"
Write-Host "Body: $body"

try {
    $response = Invoke-RestMethod -Uri $uri -Method POST -Body $body -Headers $headers
    Write-Host "Response: $($response | ConvertTo-Json)"
    Write-Host "✅ Contact form test completed successfully!"
} catch {
    Write-Host "❌ Error testing contact form:"
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response body: $responseBody"
    }
}
