
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

console.log('Database configured:', process.env.DB_NAME);

pool.on('error', (err) => {
    console.error('Unexpected database pool error:', err.message);
});

export default pool;