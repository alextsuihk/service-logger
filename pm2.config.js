module.exports = {
  apps: [
    {
      // logger Server Instance
      name: 'logger',
      script: './dist/server.js',
      merge_logs: true,
      instances: 1,
      node_args: '--max_old_space_size=512', // garbage collector size
      max_memory_restart: '512M', // restart instance if exceeds memory usage
      kill_timeout: 3000,
      wait_ready: true,
      listen_timeout: 5000,
      env: {
        NODE_ENV: 'production',
      },
      output: './logs/out.log',
      error: './logs/error.log',
    },
  ],
};
