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
                    SELECT b.*, COUNT(bv.id) as vote_count
                    FROM beers_gildeavond b
                     LEFT JOIN beer_votes bv ON b.id = bv.beer_id
                     GROUP BY b.id
                    ORDER BY b.prijs;
                `);
                res.status(200).json(result.rows);
                break;
            }

            case 'POST': {
                const { selectedBeers, gildeavond_date, koelkast } = req.body;
                for (const beerId of selectedBeers) {
                    // Fetch beer from beers table
                    const beerResult = await client.query('SELECT * FROM beers WHERE id = $1', [beerId]);
                    if (beerResult.rows.length === 0) {
                        return res.status(404).json({ error: `Beer with id ${beerId} not found` });
                    }
                    const beer = beerResult.rows[0];

                    // Check if the beer already exists in beers_gildeavond for this date
                    const existingBeerCheck = await client.query(
                        'SELECT id FROM beers_gildeavond WHERE beer_id = $1 AND gildeavond_date = $2',
                        [beerId, gildeavond_date]
                    );

                    if (existingBeerCheck.rows.length === 0) {
                        // Insert beer to beers_gildeavond
                        await client.query(
                            `INSERT INTO beers_gildeavond (beer_id, naam, brouwer, type, "alcoholpercentage",
                                                            prijs, remark, status, koelkast, gildeavond_date, avg_score, vote_count)
                             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                            [
                                beerId, beer.naam, beer.brouwer, beer.type, beer.alcoholpercentage,
                                beer.prijs, beer.remark, beer.status, koelkast, gildeavond_date, beer.avg_score, beer.vote_count
                            ]
                        );

                        // Add gildeavond_date to beers_gildeavond_date table
                        const gildeavondDateCheck = await client.query(
                            'SELECT gildeavond_date FROM Beers_Gildeavond_Date WHERE gildeavond_date = $1', [gildeavond_date]
                        );
                        if(gildeavondDateCheck.rows.length === 0){
                            await client.query(
                                'INSERT INTO Beers_Gildeavond_Date (gildeavond_date) VALUES ($1)',
                                [gildeavond_date]
                            );
                        }
                    }
                }
                res.status(201).json({ message: 'Beers moved to Gildeavond successfully' });
                break;
            }

            case 'PATCH': {
                const { id } = req.query;
                const updates = req.body;
            
                console.log('Received PATCH request with id:', id, 'and updates:', updates);
            
                if (Object.keys(updates).length === 0) {
                    console.log('No updates provided.');
                    return res.status(400).json({ error: 'No updates provided.' });
                }
            
                const setClause = Object.keys(updates)
                    .map((key, index) => `"${key}" = $${index + 1}`)
                    .join(', ');
            
                const query = `UPDATE beers_gildeavond SET ${setClause} WHERE id = $${Object.keys(updates).length + 1} RETURNING *`;
                const values = [...Object.values(updates), id];
            
                console.log('Executing query:', query, 'with values:', values);
            
                try {
                    const updatedBeerResult = await client.query(query, values);
            
                    if (updatedBeerResult.rows.length === 0) {
                        console.log('Beer not found with id:', id);
                        return res.status(404).json({ error: `Beer with id: ${id} not found` });
                    }
            
                    // Get the latest beer info including updated values and vote_count
                    const updatedBeerWithVotes = await client.query(`
                        SELECT b.*, COUNT(bv.id) as vote_count
                        FROM beers_gildeavond b
                        LEFT JOIN beer_votes bv ON b.id = bv.beer_id
                        WHERE b.id = $1
                        GROUP BY b.id
                    `, [id]);
            
                    console.log('Successfully updated beer with id:', id);
                    res.status(200).json(updatedBeerWithVotes.rows[0]);
                } catch (error) {
                    console.error('Error during database update:', error);
                    res.status(500).json({ error: 'Database operation failed', details: error.message });
                }
                break;
            }

            case 'DELETE': {
                const { id: beerId } = req.query;
                console.log(`Received DELETE request for beer with id: ${beerId}`);
            
                try {
                    // Delete directly from beers_gildeavond
                    const deletedBeerResult = await client.query('DELETE FROM beers_gildeavond WHERE id = $1 RETURNING *', [beerId]);
            
                    if (deletedBeerResult.rows.length === 0) {
                        console.log(`Beer with id: ${beerId} not found in beers_gildeavond`);
                        return res.status(404).json({ error: `Beer with id: ${beerId} not found in beers_gildeavond` });
                    }
            
                    console.log(`Successfully deleted beer with id: ${beerId}`);
                    res.status(200).json(deletedBeerResult.rows[0]);
                } catch (error) {
                    console.error('Error during database delete operation:', error);
                    res.status(500).json({ error: 'Database operation failed', details: error.message });
                }
                break;
            }
            

            default:
                res.setHeader('Allow', ['GET', 'POST', 'PATCH', 'DELETE']);
                res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error) {
        console.error('Database operation failed:', error);
        res.status(500).json({ error: 'Database operation failed', details: error.message });
    } finally {
        client.release();
    }
}