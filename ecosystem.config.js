module.exports = {
  apps : [{
    name: 'Twitter Image Viewer',
    script: 'tsc && node dist/index.js',

    // Options reference: https://pm2.keymetrics.io/docs/usage/application-declaration/
    args: '',
    instances: 1,
    autorestart: true,
    watch: ["src", "keyfiles"],
    ignore_watch: ["dist", "logs", "node_modules"],
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }]
};
