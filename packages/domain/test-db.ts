import dotenv from 'dotenv';
import path from "path"
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

console.log('DATABASE_URL: ', process.env.DATABASE_URL)

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