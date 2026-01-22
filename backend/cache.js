const redis = require("redis");

// Create Redis client with retry strategy disabled
const client = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
    reconnectStrategy: false, // Disable automatic reconnection
  },
});

let isConnected = false;

client.on("error", (err) => {
  if (!isConnected) {
    console.warn("⚠️  Redis not available - caching disabled");
    console.warn("   App will continue without cache");
    isConnected = false;
  }
});

client.on("connect", () => {
  console.log("✅ Redis Client Connected");
  isConnected = true;
});

// Try to connect to Redis (optional)
(async () => {
  try {
    await client.connect();
  } catch (err) {
    console.warn("⚠️  Redis not running - caching disabled");
    console.warn("   Install Redis or the app will work without caching");
    isConnected = false;
  }
})();

// Export wrapped client that handles disconnected state gracefully
module.exports = {
  async get(key) {
    if (!isConnected) return null;
    try {
      return await client.get(key);
    } catch (err) {
      return null;
    }
  },
  async setEx(key, seconds, value) {
    if (!isConnected) return;
    try {
      await client.setEx(key, seconds, value);
    } catch (err) {
      // Silently fail if Redis is down
    }
  },
};
