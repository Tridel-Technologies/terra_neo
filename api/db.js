const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    password: 'Tridel@qp@2025',
    host: '192.168.0.104',
    port: 5433,
    database: 'db_terra_inho',
});

// Connect to the PostgreSQL database
const connectDB = async () => {
    try {
        const client = await pool.connect();
        console.log('Connected to PostgreSQL');
        client.release();
    } catch (err) {
        console.error('Database connection failed:', err);
    }
};

module.exports = { pool, connectDB };