const pool = require('../../backend/config/database');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MIGRATIONS_DIR = __dirname;

const ensureMigrationsTable = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version VARCHAR(255) PRIMARY KEY,
            name VARCHAR(500) NOT NULL,
            checksum VARCHAR(64) NOT NULL,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
};

const getAppliedMigrations = async () => {
    const result = await pool.query('SELECT version, checksum FROM schema_migrations ORDER BY version');
    const applied = {};
    result.rows.forEach(row => {
        applied[row.version] = row.checksum;
    });
    return applied;
};

const getMigrationFiles = () => {
    const files = fs.readdirSync(MIGRATIONS_DIR)
        .filter(f => f.endsWith('.sql'))
        .sort();
    return files.map(f => {
        const version = f.split('_')[0];
        const filePath = path.join(MIGRATIONS_DIR, f);
        const content = fs.readFileSync(filePath, 'utf8');
        const checksum = crypto.createHash('sha256').update(content).digest('hex');
        return { version, name: f, filePath, content, checksum };
    });
};

const runMigrations = async () => {
    try {
        await ensureMigrationsTable();
        const applied = await getAppliedMigrations();
        const migrations = getMigrationFiles();
        let count = 0;

        for (const migration of migrations) {
            if (applied[migration.version]) {
                if (applied[migration.version] !== migration.checksum) {
                    console.error(`FATAL: Migration ${migration.version} checksum mismatch! File was modified after being applied.`);
                    console.error(`Expected: ${applied[migration.version]}`);
                    console.error(`Got: ${migration.checksum}`);
                    process.exit(1);
                }
                continue;
            }

            console.log(`Running migration ${migration.version}: ${migration.name}`);
            await pool.query('BEGIN');
            try {
                await pool.query(migration.content);
                await pool.query(
                    'INSERT INTO schema_migrations (version, name, checksum) VALUES ($1, $2, $3)',
                    [migration.version, migration.name, migration.checksum]
                );
                await pool.query('COMMIT');
                console.log(`Migration ${migration.version} applied successfully`);
                count++;
            } catch (error) {
                await pool.query('ROLLBACK');
                console.error(`Migration ${migration.version} failed:`, error.message);
                process.exit(1);
            }
        }

        if (count === 0) {
            console.log('All migrations already applied');
        } else {
            console.log(`${count} migration(s) applied successfully`);
        }
    } catch (error) {
        console.error('Migration runner failed:', error.message);
        process.exit(1);
    }
};

if (require.main === module) {
    runMigrations().then(() => process.exit(0));
}

module.exports = { runMigrations };
