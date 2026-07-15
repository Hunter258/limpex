const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

const runMigrations = async () => {
    try {
        const migrationFile = path.join(__dirname, '001_initial_schema.sql');
        const sql = fs.readFileSync(migrationFile, 'utf8');
        
        await pool.query(sql);
        console.log('Migrations completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

runMigrations();
