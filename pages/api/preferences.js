// pages/api/preferences.js
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
                const result = await client.query('SELECT invisible_beers, striked_beers FROM user_preferences LIMIT 1');
                if (result.rows.length === 0) {
                    return res.status(404).json({ error: 'No preferences found' });
                }
                res.status(200).json(result.rows[0]);
                break;
            }

            case 'PATCH': {
                const { invisibleBeers, strikedBeers } = req.body;
                if (invisibleBeers === undefined || strikedBeers === undefined) {
                    return res.status(400).json({ error: 'Invalid input' });
                }
                try{
                    await client.query(
                        'UPDATE user_preferences SET invisible_beers = $1, striked_beers = $2',
                        [JSON.stringify(invisibleBeers), JSON.stringify(strikedBeers)] // Convert arrays to JSON strings
                    );
                    res.status(200).json({ message: 'Preferences updated successfully' });
                }catch (dbError) {
                    console.error('Database update failed:', dbError);
                    res.status(500).json({ error: 'Database update failed', details: dbError.message });
                }

                break;
            }

            default:
                res.setHeader('Allow', ['GET', 'PATCH']);
                res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error) {
        console.error('Database operation failed:', error);
        res.status(500).json({ error: 'Database operation failed', details: error.message });
    } finally {
        client.release();
    }
}