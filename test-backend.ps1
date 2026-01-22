# Backend API Test Script
# Tests all backend endpoints to ensure everything works

Write-Host "🧪 Stock Screener Backend - API Test Suite" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:5000"
$testsPassed = 0
$testsFailed = 0

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Endpoint,
        [hashtable]$Body = @{},
        [int]$ExpectedStatus = 200
    )
    
    Write-Host "Testing: $Name..." -ForegroundColor Yellow -NoNewline
    
    try {
        $params = @{
            Uri = "$baseUrl$Endpoint"
            Method = $Method
            ContentType = "application/json"
        }
        
        if ($Body.Count -gt 0) {
            $params.Body = ($Body | ConvertTo-Json)
        }
        
        $response = Invoke-WebRequest @params -UseBasicParsing
        
        if ($response.StatusCode -eq $ExpectedStatus) {
            Write-Host " ✅ PASSED" -ForegroundColor Green
            $script:testsPassed++
            return $true
        } else {
            Write-Host " ❌ FAILED (Status: $($response.StatusCode))" -ForegroundColor Red
            $script:testsFailed++
            return $false
        }
    } catch {
        Write-Host " ❌ FAILED ($($_.Exception.Message))" -ForegroundColor Red
        $script:testsFailed++
        return $false
    }
}

function Test-HealthEndpoint {
    Write-Host ""
    Write-Host "📡 Testing Health Endpoint..." -ForegroundColor Cyan
    
    if (Test-Endpoint -Name "GET /health" -Method "GET" -Endpoint "/health") {
        try {
            $response = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
            Write-Host "   Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
        } catch {}
    }
}

function Test-ScreenerEndpoint {
    Write-Host ""
    Write-Host "🔍 Testing Screener Endpoint..." -ForegroundColor Cyan
    
    # Test 1: Valid IT query
    $result1 = Test-Endpoint `
        -Name "POST /screener - IT stocks" `
        -Method "POST" `
        -Endpoint "/screener" `
        -Body @{ query = "Show IT stocks with PE below 25" }
    
    if ($result1) {
        try {
            $response = Invoke-RestMethod -Uri "$baseUrl/screener" -Method POST -Body (@{ query = "Show IT stocks with PE below 25" } | ConvertTo-Json) -ContentType "application/json"
            Write-Host "   Found $($response.data.Count) stocks" -ForegroundColor Gray
        } catch {}
    }
    
    # Test 2: Valid Finance query
    Test-Endpoint `
        -Name "POST /screener - Finance stocks" `
        -Method "POST" `
        -Endpoint "/screener" `
        -Body @{ query = "Finance stocks with PE below 20" }
    
    # Test 3: Invalid query (should fail gracefully)
    Write-Host "Testing: POST /screener - Invalid query..." -ForegroundColor Yellow -NoNewline
    try {
        $response = Invoke-WebRequest `
            -Uri "$baseUrl/screener" `
            -Method POST `
            -Body (@{ query = "" } | ConvertTo-Json) `
            -ContentType "application/json" `
            -UseBasicParsing `
            -ErrorAction Stop
        
        Write-Host " ❌ FAILED (Should have returned error)" -ForegroundColor Red
        $script:testsFailed++
    } catch {
        if ($_.Exception.Response.StatusCode -eq 400) {
            Write-Host " ✅ PASSED (Correctly rejected invalid input)" -ForegroundColor Green
            $script:testsPassed++
        } else {
            Write-Host " ❌ FAILED (Wrong error code)" -ForegroundColor Red
            $script:testsFailed++
        }
    }
}

# Main test execution
Write-Host "Starting tests against $baseUrl" -ForegroundColor White
Write-Host ""

# Check if server is running
try {
    $null = Invoke-WebRequest -Uri $baseUrl -Method GET -UseBasicParsing -TimeoutSec 2
} catch {
    Write-Host "❌ Backend server is not running!" -ForegroundColor Red
    Write-Host "Please start the server with: cd backend && npm start" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Server is running" -ForegroundColor Green

# Run test suites
Test-HealthEndpoint
Test-ScreenerEndpoint

# Summary
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Test Results:" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Passed: $testsPassed" -ForegroundColor Green
Write-Host "Failed: $testsFailed" -ForegroundColor Red
Write-Host "Total:  $($testsPassed + $testsFailed)" -ForegroundColor White

if ($testsFailed -eq 0) {
    Write-Host ""
    Write-Host "🎉 All tests passed! Backend is ready." -ForegroundColor Green
    exit 0
} else {
    Write-Host ""
    Write-Host "⚠️  Some tests failed. Please review the errors above." -ForegroundColor Yellow
    exit 1
}
