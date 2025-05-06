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
    if (req.method === 'GET') {
      const result = await client.query('SELECT * FROM beers');
      res.status(200).json(result.rows);
    } else if (req.method === 'POST') {
      const { existingBeers, newBeers } = req.body;

      // Update existing beers
      for (const beer of existingBeers) {
        await client.query(
          `UPDATE beers 
           SET naam = $1, brouwer = $2, type = $3, "alcoholpercentage" = $4, prijs = $5, voorraad = $6, remark = $7, status = $8, koelkast = $9, gildeavond = $10, "avg_score" = $11 
           WHERE id = $12`,
          [
            beer.naam,
            beer.brouwer,
            beer.type,
            beer.alcoholpercentage,
            beer.prijs,
            beer.voorraad,
            beer.remark,
            beer.status,
            beer.koelkast,
            beer.gildeavond,
            beer.avg_score,
            beer.id
          ]
        );
      }

      // Insert new beers
      const insertQuery = `INSERT INTO beers (naam, brouwer, type, "alcoholpercentage", prijs, voorraad, remark, status, koelkast, gildeavond, "avg_score") 
                           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`;
      for (const beer of newBeers) {
        await client.query(insertQuery, [
          beer.naam,
          beer.brouwer,
          beer.type,
          beer.alcoholpercentage,
          beer.prijs,
          beer.voorraad,
          beer.remark,
          beer.status,
          beer.koelkast,
          beer.gildeavond,
          beer.avg_score
        ]);
      }

      res.status(201).json({ message: 'Beers updated and added successfully' });
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Database operation failed:', error);
    res.status(500).json({ error: 'Database operation failed', details: error.message });
  } finally {
    client.release();
  }
}
