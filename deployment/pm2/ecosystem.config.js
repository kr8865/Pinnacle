// PM2 process file for bare-metal / VM deployment of the Pinnacle backend
// (alternative to running the backend Docker image). Frontend is a static
// build served by Nginx directly, so it does not need a PM2 process.
//
// Usage:
//   cd backend && npm ci --omit=dev
//   pm2 start ../deployment/pm2/ecosystem.config.js --env production
//   pm2 save && pm2 startup   (to persist across server reboots)

module.exports = {
  apps: [
    {
      name: "pinnacle-backend",
      cwd: "../../backend",
      script: "server.js",
      instances: "max", // cluster mode across all CPU cores
      exec_mode: "cluster",
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
      error_file: "../../logs/pm2-error.log",
      out_file: "../../logs/pm2-out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      max_restarts: 10,
      min_uptime: "10s",
      kill_timeout: 5000,
    },
  ],
};
