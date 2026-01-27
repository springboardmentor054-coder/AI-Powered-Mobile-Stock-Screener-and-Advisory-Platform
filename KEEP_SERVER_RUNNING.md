# How to Keep Your Server Running 24/7

## The Problem

Your Node.js server stops when:
- ❌ You close the terminal/PowerShell window
- ❌ Your computer restarts
- ❌ You log out of Windows
- ❌ The server crashes

**Why?** Regular `node index.js` runs in the foreground and dies when the terminal closes.

---

## The Solution: PM2 Process Manager

**PM2** is a production process manager that:
- ✅ Keeps your server running in the background
- ✅ Auto-restarts on crashes
- ✅ Starts automatically on computer reboot
- ✅ Provides logs and monitoring
- ✅ Manages multiple apps easily

---

## Step-by-Step Setup

### 1. Install PM2 Globally

```powershell
npm install -g pm2
```

**Verify installation:**
```powershell
pm2 --version
```

### 2. Start Your Server with PM2

```powershell
# Navigate to project root
cd "C:\Users\vinee\OneDrive\Desktop\AI-Powered-Mobile-Stock-Screener-and-Advisory-Platform"

# Start the backend server
pm2 start backend/index.js --name "stock-screener"
```

**OR** use the config file (recommended):
```powershell
pm2 start ecosystem.config.js
```

### 3. Save the Process List

This remembers your app so it restarts on reboot:
```powershell
pm2 save
```

### 4. Setup Auto-Start on Windows Boot

```powershell
# Generate startup script
pm2 startup

# Follow the instructions it prints (copy/paste the command it gives you)
```

**Important**: PM2 will give you a command to run. It looks like:
```powershell
pm2 startup windows -u YourUsername --hp "C:\Users\YourUsername"
```
Copy and run that exact command.

---

## Essential PM2 Commands

### Check Status
```powershell
# List all running apps
pm2 list

# Show detailed info
pm2 show stock-screener

# View real-time logs
pm2 logs stock-screener

# View last 100 lines of logs
pm2 logs stock-screener --lines 100
```

### Control Server
```powershell
# Restart server (after code changes)
pm2 restart stock-screener

# Stop server
pm2 stop stock-screener

# Start server (if stopped)
pm2 start stock-screener

# Delete from PM2 (must stop first)
pm2 delete stock-screener
```

### Monitoring
```powershell
# Real-time monitoring dashboard
pm2 monit

# View CPU/Memory usage
pm2 list
```

---

## After Code Changes

When you update your code:

```powershell
# Option 1: Restart with PM2
pm2 restart stock-screener

# Option 2: Reload with zero downtime (advanced)
pm2 reload stock-screener
```

---

## Viewing Logs

PM2 automatically saves logs in:
- `C:\Users\YourUsername\.pm2\logs\`

```powershell
# View real-time logs
pm2 logs

# View only error logs
pm2 logs --err

# Clear old logs
pm2 flush
```

---

## Troubleshooting

### Server Not Starting

**Check logs:**
```powershell
pm2 logs stock-screener --err
```

**Common issues:**
- Port 5000 already in use → Stop other Node processes
- Environment variables not loaded → Check backend/.env file exists
- Database not running → Start PostgreSQL

### PM2 Not Starting on Boot

```powershell
# Regenerate startup script
pm2 unstartup
pm2 startup

# Save process list again
pm2 save
```

### Need to Change Port or Environment Variables

**Option 1**: Edit `ecosystem.config.js` and restart:
```javascript
env: {
  NODE_ENV: 'production',
  PORT: 5000  // Change this
}
```

Then:
```powershell
pm2 restart ecosystem.config.js
```

**Option 2**: Pass environment variables:
```powershell
pm2 start backend/index.js --name "stock-screener" -- PORT=3000
```

---

## Current Setup Status

### ✅ What's Working Now:
- Scheduler configured to run at 6:00 AM daily
- Manual update endpoint available
- Backend API running

### ⚠️ What You Need:
- Install PM2 (5 minutes)
- Start server with PM2
- Configure auto-start on boot

---

## Quick Start (Copy & Paste)

```powershell
# 1. Install PM2
npm install -g pm2

# 2. Navigate to project
cd "C:\Users\vinee\OneDrive\Desktop\AI-Powered-Mobile-Stock-Screener-and-Advisory-Platform"

# 3. Start server
pm2 start backend/index.js --name "stock-screener"

# 4. Save and setup auto-start
pm2 save
pm2 startup
# (Then run the command it gives you)

# 5. Verify it's running
pm2 list
pm2 logs stock-screener
```

---

## Benefits You'll Get

1. **Server Always Running** → Scheduler updates data daily at 6 AM
2. **Auto-Recovery** → Crashes? PM2 restarts it in seconds
3. **Boot Protection** → Computer restarts? Server auto-starts
4. **Easy Monitoring** → Check logs and status anytime with `pm2 logs`
5. **Zero Hassle** → Set it up once, forget about it

---

## Alternative: Windows Service (Advanced)

If you want even more control, you can run the server as a Windows Service using **node-windows**:

```powershell
npm install -g node-windows
```

But **PM2 is recommended** for most use cases - it's simpler and more popular.

---

## Why Can't Node.js Do This By Itself?

**Node.js is just a runtime** - it runs your code but doesn't include:
- Process management
- Auto-restart on crash
- Logging infrastructure  
- Startup scripts
- Monitoring tools

That's why we need tools like PM2. It's like the difference between:
- **Without PM2**: Running an app manually every time
- **With PM2**: Installing an app that runs automatically

---

## Next Steps

1. **Install PM2 now** (takes 2 minutes)
2. **Start your server with PM2**
3. **Test it**: Close terminal, server keeps running!
4. **Setup auto-start**: Server runs even after reboot
5. **Relax**: Your daily updates will happen automatically ☕

Need help? Run these to check everything:
```powershell
pm2 list                    # Is server running?
pm2 logs stock-screener     # Any errors?
node .\backend\scripts\checkDataStatus.js  # Is data being updated?
```
