require("dotenv").config();
const app = require("./app");
const pool = require("./database");
const dhanImportService = require("./services/dhanImport.service");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // Listen on all network interfaces
const enableAdbReverse =
  process.env.ENABLE_ADB_REVERSE === "true" ||
  (process.env.ENABLE_ADB_REVERSE !== "false" &&
    process.env.NODE_ENV !== "production");
const adbReversedDevices = new Set();
let adbUnavailableLogged = false;
let adbNoDeviceLogged = false;

function getLocalIPv4Addresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const iface of Object.values(interfaces)) {
    if (!iface) continue;

    for (const item of iface) {
      if (
        item.family === 'IPv4' &&
        !item.internal &&
        !item.address.startsWith('169.254.')
      ) {
        addresses.push(item.address);
      }
    }
  }

  return [...new Set(addresses)];
}

function tryEnableAdbReverse(port) {
  const adbCommand = resolveAdbCommand();
  if (!adbCommand) {
    if (!adbUnavailableLogged) {
      console.log('[ADB] adb not found. Install Android platform-tools or add adb to PATH.');
      adbUnavailableLogged = true;
    }
    return;
  }
  adbUnavailableLogged = false;

  try {
    execFileSync(adbCommand, ['start-server'], { stdio: 'ignore' });
  } catch (_) {
    console.log(`[ADB] Unable to start adb (${adbCommand}), skipping reverse setup.`);
    return;
  }

  let devicesOutput = '';
  try {
    devicesOutput = execFileSync(adbCommand, ['devices'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch (_) {
    console.log('[ADB] Unable to list devices, skipping reverse setup.');
    return;
  }

  const devices = devicesOutput
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.endsWith('\tdevice'))
    .map((line) => line.split('\t')[0]);

  if (devices.length === 0) {
    if (!adbNoDeviceLogged) {
      console.log('[ADB] No Android devices found for reverse setup.');
      adbNoDeviceLogged = true;
    }
    return;
  }
  adbNoDeviceLogged = false;

  for (const device of devices) {
    try {
      execFileSync(adbCommand, ['-s', device, 'reverse', `tcp:${port}`, `tcp:${port}`], {
        stdio: 'ignore',
      });
      if (!adbReversedDevices.has(device)) {
        adbReversedDevices.add(device);
        console.log(`[ADB] Reverse active for ${device}: tcp:${port} -> tcp:${port}`);
      }
    } catch (error) {
      adbReversedDevices.delete(device);
      console.log(`[ADB] Reverse failed for ${device}: ${error.message}`);
    }
  }
}

function resolveAdbCommand() {
  const candidates = ['adb'];
  const sdkRoots = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    process.env.LOCALAPPDATA
      ? path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk')
      : null,
  ].filter(Boolean);

  for (const root of sdkRoots) {
    candidates.push(path.join(root, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb'));
  }

  for (const candidate of candidates) {
    try {
      execFileSync(candidate, ['version'], { stdio: 'ignore' });
      return candidate;
    } catch (_) {
      // try next candidate
    }
  }

  return null;
}

let adbReverseInterval = null;

const server = app.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);

  const localIps = getLocalIPv4Addresses();
  if (localIps.length > 0) {
    for (const ip of localIps) {
      console.log(`Access from network: http://${ip}:${PORT}`);
    }
  } else {
    console.log('Access from network: no LAN IPv4 detected');
  }

  if (enableAdbReverse) {
    // Makes localhost API calls work on connected Android devices via USB.
    tryEnableAdbReverse(PORT);
    adbReverseInterval = setInterval(() => tryEnableAdbReverse(PORT), 15000);
  }
});

dhanImportService.ensureDhanData().catch((error) => {
  console.error("Dhan CSV import failed:", error.message);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  if (adbReverseInterval) clearInterval(adbReverseInterval);
  server.close(async () => {
    console.log('HTTP server closed');
    await pool.end();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  if (adbReverseInterval) clearInterval(adbReverseInterval);
  server.close(async () => {
    console.log('HTTP server closed');
    await pool.end();
    process.exit(0);
  });
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
