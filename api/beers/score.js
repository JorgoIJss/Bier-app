// pages/api/beers/score.js
import { Pool } from 'pg';
import requestIp from 'request-ip';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Get already voted beers for this IP
    const voterIp = requestIp.getClientIp(req);
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'SELECT beer_id FROM user_votes WHERE voter_ip = $1',
        [voterIp]
      );
      
      res.status(200).json({ 
        votedBeers: result.rows.reduce((acc, row) => {
              acc[row.beer_id] = true;
              return acc;
          }, {})
      });
    } catch (error) {
      console.error('Failed to get voted beers:', error);
      res.status(500).json({ error: 'Database operation failed' });
    } finally {
      client.release();
    }
  }
  
  else if (req.method === 'POST') {
    const { beerId, score } = req.body;
    const voterIp = requestIp.getClientIp(req);
    
    if (!beerId || !score || score < 1 || score > 5) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if user already voted
        const existingVote = await client.query(
            'SELECT id FROM beer_scores WHERE beer_id = $1 AND voter_ip = $2',
            [beerId, voterIp]
        );
        if (existingVote.rows.length > 0) {
            await client.query(
                'UPDATE beer_scores SET score = $1 WHERE beer_id = $2 AND voter_ip = $3',
                [score, beerId, voterIp]
            );
        } else {
            // Insert new score with IP
            await client.query(
                'INSERT INTO beer_scores (beer_id, score, voter_ip) VALUES ($1, $2, $3)',
                [beerId, score, voterIp]
            );
        }

      // Calculate new average
      const avgResult = await client.query(
        `SELECT 
          ROUND(AVG(score)::numeric, 2) as new_avg,
          COUNT(*) as total_votes
         FROM beer_scores 
         WHERE beer_id = $1`,
        [beerId]
      );

      // Update beer's average score
      await client.query(
        `UPDATE beers 
         SET avg_score = $1
         WHERE id = $2`,
        [avgResult.rows[0].new_avg, beerId]
      );

      await client.query('COMMIT');

      res.status(200).json({ 
        success: true,
          averageScore: avgResult.rows[0].new_avg,
          totalVotes: avgResult.rows[0].total_votes
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Database operation failed:', error);
      res.status(500).json({ error: 'Database operation failed' });
    } finally {
      client.release();
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}