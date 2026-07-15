const pool = require('../config/database');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const importCSV = async (filePath, tableName) => {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const records = parse(content, { columns: true, skip_empty_lines: true });

        for (const record of records) {
            const columns = Object.keys(record);
            const values = columns.map(col => {
                if (col === 'is_organic' || col === 'is_available') {
                    return record[col].toLowerCase() === 'true';
                }
                if (col === 'price' || col === 'stock_quantity') {
                    return parseFloat(record[col]);
                }
                return record[col];
            });

            const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
            const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;

            await pool.query(query, values);
        }

        console.log(`Imported ${records.length} records into ${tableName}`);
    } catch (error) {
        console.error(`Error importing ${filePath}:`, error.message);
    }
};

const runImports = async () => {
    const seedDir = path.join(__dirname, 'seed');

    const imports = [
        { file: 'indian_fruits.csv', table: 'products' },
        { file: 'international_fruits.csv', table: 'products' },
        { file: 'indian_vegetables.csv', table: 'products' },
        { file: 'international_vegetables.csv', table: 'products' },
        { file: 'indian_dry_fruits.csv', table: 'products' },
        { file: 'international_dry_fruits.csv', table: 'products' }
    ];

    for (const imp of imports) {
        const filePath = path.join(seedDir, imp.file);
        if (fs.existsSync(filePath)) {
            await importCSV(filePath, imp.table);
        } else {
            console.log(`File not found: ${imp.file}`);
        }
    }

    console.log('All imports completed!');
    process.exit(0);
};

runImports();
