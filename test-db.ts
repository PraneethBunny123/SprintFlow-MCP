import 'dotenv/config';
import pg from 'pg';

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    await client.connect();
    console.log('✅ Connected successfully');
    const res = await client.query('SELECT current_database()');
    console.log('📦 Database:', res.rows[0].current_database);
    await client.end();
  } catch (err) {
    console.error('❌ Failed:', err);
  }
}

main();