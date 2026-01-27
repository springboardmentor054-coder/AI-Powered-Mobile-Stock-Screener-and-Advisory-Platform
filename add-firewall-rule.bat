@echo off
echo Adding Windows Firewall Rule for Stock Screener Backend...
echo.

powershell -Command "New-NetFirewallRule -DisplayName 'Stock Screener Backend Port 5000' -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow"

if %errorlevel% equ 0 (
    echo.
    echo SUCCESS! Firewall rule added successfully.
    echo Port 5000 is now open for incoming connections.
    echo.
    echo You can now use the Stock Screener app!
) else (
    echo.
    echo FAILED! Could not add firewall rule.
    echo Please run this file as Administrator.
    echo Right-click on add-firewall-rule.bat and select "Run as administrator"
)

echo.
pause
