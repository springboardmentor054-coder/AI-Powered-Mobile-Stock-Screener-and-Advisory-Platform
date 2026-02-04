const { createClient } = require('redis');
require('dotenv').config();

// Create the client
const client = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// Event Listeners for Debugging
client.on('error', (err) => console.error('❌ Redis Client Error:', err));
client.on('connect', () => console.log('🔌 Redis Client Connecting...'));
client.on('ready', () => console.log('✅ Redis Client Connected & Ready!'));

// Connect immediately
(async () => {
  if (!client.isOpen) {
    await client.connect();
  }
})();

module.exports = client;