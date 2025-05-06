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
                const result = await client.query(`
                     SELECT bp.*, b.naam AS beer_naam
                     FROM beer_purchases bp
                     INNER JOIN beers b ON bp.beer_id = b.id
                    ORDER BY bp.inkoopdatum DESC
                `);
                res.status(200).json(result.rows);
                break;
            }
            case 'POST': {
                const { beer_id, leverancier, inkoopdatum, inkoopprijs, inkoopaantal } = req.body;
                console.log(`Received POST request with data: ${JSON.stringify(req.body)}`);

                  if (!beer_id || !leverancier || !inkoopdatum || !inkoopprijs || !inkoopaantal) {
                        return res.status(400).json({ error: 'All fields are required' });
                  }

                  const result = await client.query(
                      `INSERT INTO beer_purchases (beer_id, leverancier, inkoopdatum, inkoopprijs, inkoopaantal)
                       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                      [beer_id, leverancier, inkoopdatum, inkoopprijs, inkoopaantal]
                   );


                res.status(201).json(result.rows[0]);
                break;
            }
             case 'DELETE': {
                const { id } = req.query;
                console.log(`Received DELETE request for purchase with id: ${id}`);

                if (!id) {
                    return res.status(400).json({ error: 'Purchase id is required' });
                }

                 const deletedPurchaseResult = await client.query('DELETE FROM beer_purchases WHERE id = $1 RETURNING *', [id]);
            
                    if (deletedPurchaseResult.rows.length === 0) {
                        console.log(`Purchase with id: ${id} not found in beer_purchases`);
                        return res.status(404).json({ error: `Purchase with id: ${id} not found` });
                    }

                     res.status(200).json(deletedPurchaseResult.rows[0]);
                 break;
            }

            default:
                res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
                res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error) {
        console.error('Database operation failed:', error);
        res.status(500).json({ error: 'Database operation failed', details: error.message });
    } finally {
        client.release();
    }
}