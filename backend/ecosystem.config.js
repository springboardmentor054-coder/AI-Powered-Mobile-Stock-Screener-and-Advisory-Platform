// PM2 Configuration File
// This tells PM2 how to run and monitor your backend server

module.exports = {
  apps: [{
    name: 'stock-screener-backend',
    script: './index.js',
    // Don't use cwd - run from backend directory directly
    
    // Environment variables
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    
    // Auto-restart on crash
    autorestart: true,
    
    // Restart if memory usage exceeds 500MB
    max_memory_restart: '500M',
    
    // Logging
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Restart behavior
    watch: false, // Don't restart on file changes in production
    max_restarts: 10,
    min_uptime: '10s',
    
    // Instance management
    instances: 1,
    exec_mode: 'fork'
  }]
};
