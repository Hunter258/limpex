const pool = require('../config/database');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
    try {
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash('Admin@123', salt);

        await pool.query(
            `INSERT INTO users (email, password_hash, first_name, last_name, role_id)
             VALUES ($1, $2, $3, $4, 1)
             ON CONFLICT (email) DO NOTHING`,
            ['admin@limpex.com', passwordHash, 'Admin', 'User']
        );

        console.log('Default admin user created:');
        console.log('Email: admin@limpex.com');
        console.log('Password: Admin@123');
        
        process.exit(0);
    } catch (error) {
        console.error('Seed failed:', error);
        process.exit(1);
    }
};

seedDatabase();
