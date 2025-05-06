import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

export default async function handler(req, res) {
    const client = await pool.connect();
    try {
        switch (req.method) {
            case 'GET': {
                const { beerId } = req.query;

                if (!beerId) {
                    return res.status(400).json({ error: 'Beer ID is required.' });
                }

                const result = await client.query(
                    `SELECT gildeavond_date
                     FROM beers_gildeavond
                     WHERE beer_id = $1
                     ORDER BY gildeavond_date DESC
                    `,
                    [beerId]
                );
                res.status(200).json(result.rows);
                break;
            }

            default:
                res.setHeader('Allow', ['GET']);
                res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error) {
        console.error('Database operation failed:', error);
        res.status(500).json({ error: 'Database operation failed', details: error.message });
    } finally {
        client.release();
    }
}