﻿import { Pool } from 'pg';

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
      case 'GET':
        const result = await client.query(`
            SELECT b.*,
            STRING_AGG(bg.gildeavond_date::text, ', ' ORDER BY bg.gildeavond_date DESC) as gildeavond_dates,
            COUNT(bv.id) as vote_count
            FROM beers b
            LEFT JOIN beers_gildeavond bg ON b.id = bg.beer_id
            LEFT JOIN beer_votes bv ON b.id = bv.beer_id
            GROUP BY b.id
            ORDER BY b.prijs;
        `);
        res.status(200).json(result.rows);
        break;

      case 'POST':
        const { existingBeers, newBeers } = req.body;
          console.log("Received POST request", req.body)
        // Update existing beers
         if(existingBeers)
          for (const beer of existingBeers) {
              console.log("Updating existing beer with data", beer)
             await client.query(
                 `UPDATE beers
             SET naam = $1, brouwer = $2, type = $3, "alcoholpercentage" = $4,
                 prijs = $5, remark = $6, status = $7,  "avg_score" = $8, inkoopprijs = $9
             WHERE id = $10`,
                 [
                     beer.naam, beer.brouwer, beer.type, beer.alcoholpercentage,
                     beer.prijs, beer.remark, beer.status,
                      beer.avg_score, beer.inkoopprijs,  beer.id
                 ]
             );
         }
        // Insert new beers
        if(newBeers)
        for (const beer of newBeers) {
              console.log("Inserting new beer with data:", beer)
          try{
           const result = await client.query(
            `INSERT INTO beers (naam, brouwer, type, "alcoholpercentage",
                              prijs, remark, status, "avg_score", inkoopprijs )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [
              beer.naam, beer.brouwer, beer.type, beer.alcoholpercentage,
              beer.prijs, beer.remark, beer.status, beer.avg_score, beer.inkoopprijs
            ]
          );
            res.status(201).json({ message: 'Beers updated and added successfully', newBeers: result.rows});
         } catch(insertError) {
            console.error('Error during database insert', insertError);
            return res.status(500).json({ error: 'Database operation failed', details: insertError.message });
           }
        }
          
        break;

       case 'PATCH':
         const { id } = req.query;
         const updates = req.body;

        if (Object.keys(updates).length === 0) {
           return res.status(400).json({ error: 'No updates provided.' });
         }
          const setClause = Object.keys(updates)
            .map((key, index) => `"${key}" = $${index + 1}`)
            .join(', ');

        const updatedBeerResult = await client.query(
            `UPDATE beers SET ${setClause} WHERE id = $${Object.keys(updates).length + 1}
            RETURNING *`,
            [...Object.values(updates), id]
        );

         if (updatedBeerResult.rows.length === 0) {
             return res.status(404).json({ error: `Beer with id: ${id} not found` });
         }
          // Get the latest beer info including updated values and vote_count
          const updatedBeerWithVotes = await client.query(`
              SELECT b.*, COUNT(bv.id) as vote_count
                FROM beers b
                LEFT JOIN beer_votes bv ON b.id = bv.beer_id
                WHERE b.id = $1
                GROUP BY b.id
           `, [id]);
          res.status(200).json(updatedBeerWithVotes.rows[0]);
          break;

        case 'DELETE':
         const { id: beerId } = req.query;
          const deletedBeerResult = await client.query('DELETE FROM beers WHERE id = $1 RETURNING *', [beerId]);
            if (deletedBeerResult.rows.length === 0) {
                return res.status(404).json({ error: `Beer with id: ${beerId} not found` });
            }

          await client.query('DELETE FROM beer_votes WHERE beer_id = $1', [beerId]);

          res.status(200).json(deletedBeerResult.rows[0]);
          break;

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