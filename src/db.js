import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export default async function handler(req, res) {
  try {
    const client = await pool.connect();
    console.log('Connected to database successfully');
    // Your query logic here
    client.release();
  } catch (error) {
    console.error('Error connecting to database:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      config: process.env.DATABASE_URL ? 'Set' : 'Not set'
    });
  }
}
