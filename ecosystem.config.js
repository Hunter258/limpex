module.exports = {
    apps: [{
        name: 'limpex-api',
        script: './backend/server.js',
        instances: 'max',
        exec_mode: 'cluster',
        env: {
            NODE_ENV: 'production',
            PORT: 5000
        },
        error_file: './logs/error.log',
        out_file: './logs/out.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        merge_logs: true,
        max_memory_restart: '500M',
        watch: false,
        max_restarts: 10,
        min_uptime: '10s'
    }]
};
