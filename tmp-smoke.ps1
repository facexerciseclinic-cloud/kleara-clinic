$s = New-Object Microsoft.PowerShell.Commands.WebRequestSession
try {
  $login = Invoke-RestMethod -Method Post -Uri 'http://localhost:5002/api/auth/login' -Body (ConvertTo-Json @{ username = 'admin'; password = 'admin123' }) -ContentType 'application/json' -WebSession $s
  Write-Output '---LOGIN RESPONSE---'
  $login | ConvertTo-Json -Depth 5
  $refresh = Invoke-RestMethod -Method Post -Uri 'http://localhost:5002/api/auth/refresh' -ContentType 'application/json' -WebSession $s
  Write-Output '---REFRESH RESPONSE---'
  $refresh | ConvertTo-Json -Depth 5
  $logout = Invoke-RestMethod -Method Post -Uri 'http://localhost:5002/api/auth/logout' -ContentType 'application/json' -WebSession $s
  Write-Output '---LOGOUT RESPONSE---'
  $logout | ConvertTo-Json -Depth 5
} catch {
  Write-Output 'ERROR:'
  try {
    $resp = $_.Exception.Response
    if ($resp -ne $null) { $sr = New-Object System.IO.StreamReader($resp.GetResponseStream()); $sr.ReadToEnd() }
    else { $_ }
  } catch { $_ }
}