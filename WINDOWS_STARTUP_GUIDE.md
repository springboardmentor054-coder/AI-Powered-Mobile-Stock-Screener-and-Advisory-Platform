# Windows Startup Guide for Stock Screener

## ✅ Your Server is Now Running!

Your stock screener backend is running with PM2 and will automatically restart if it crashes.

## Current Status

Check your server status anytime:
```powershell
cd C:\Users\vinee\OneDrive\Desktop\AI-Powered-Mobile-Stock-Screener-and-Advisory-Platform\backend
pm2 status
```

View live logs:
```powershell
pm2 logs stock-screener-backend
```

## Daily Auto-Updates

Your server is configured to automatically update stock data daily at 6:00 AM using Yahoo Finance (no rate limits! 🎉).

## Making Server Auto-Start on Windows Boot

**Option 1: Task Scheduler (Recommended)**

1. Open Task Scheduler (search in Windows)
2. Click "Create Basic Task"
3. Name: "Stock Screener PM2 Startup"
4. Trigger: "When the computer starts"
5. Action: "Start a program"
6. Program/script: 
   ```
   C:\Users\vinee\OneDrive\Desktop\AI-Powered-Mobile-Stock-Screener-and-Advisory-Platform\pm2-startup.bat
   ```
7. Click "Finish"

**Option 2: Startup Folder (Simpler)**

1. Press `Win + R`
2. Type: `shell:startup`
3. Press Enter
4. Create a shortcut to `pm2-startup.bat` in this folder
5. Right-click the shortcut → Properties → Run: "Minimized" → OK

## When You Restart Your Computer

- **With Task Scheduler/Startup**: Server starts automatically
- **Without auto-start**: Run `pm2-startup.bat` or use:
  ```powershell
  cd C:\Users\vinee\OneDrive\Desktop\AI-Powered-Mobile-Stock-Screener-and-Advisory-Platform\backend
  pm2 resurrect
  ```

## Manual Commands

**Stop the server:**
```powershell
pm2 stop stock-screener-backend
```

**Start the server:**
```powershell
cd backend
pm2 start ecosystem.config.js
```

**Restart the server:**
```powershell
pm2 restart stock-screener-backend
```

**Trigger manual data update:**
```powershell
curl -X POST http://localhost:5000/api/admin/trigger-update
```

## Check Data Freshness

```powershell
curl http://localhost:5000/api/admin/data-status
```

## Next Steps

1. ✅ Server is running with PM2
2. ✅ Auto-restart on crash enabled
3. ✅ Daily updates scheduled (6 AM)
4. ⏳ Set up Windows auto-start (follow steps above)
5. ⏳ Test the new Yahoo Finance update function

Want to test the updated stock data fetcher? Run:
```powershell
cd backend/scripts
node testUpdate.js
```

This will update all 185 stocks using Yahoo Finance (no rate limits!).
