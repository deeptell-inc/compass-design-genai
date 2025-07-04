import { Router, Request, Response } from 'express';
import { Pool } from 'pg';

const router = Router();

// Database connection (you should use environment variables in production)
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'compass_design',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

// Get dashboard statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const client = await pool.connect();
    
    // Get processed designs count
    const designsResult = await client.query(`
      SELECT COUNT(*) as count,
             COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as current_period,
             COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '60 days' 
                        AND created_at < CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as previous_period
      FROM processed_designs
    `);

    // Get code generation requests count
    const codeGenResult = await client.query(`
      SELECT COUNT(*) as count,
             COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as current_period,
             COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '60 days' 
                        AND created_at < CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as previous_period
      FROM code_generation_requests
    `);

    // Get design tokens count
    const tokensResult = await client.query(`
      SELECT COUNT(*) as count,
             COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as current_period,
             COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '60 days' 
                        AND created_at < CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as previous_period
      FROM design_tokens
    `);

    // Get average code quality score
    const qualityResult = await client.query(`
      SELECT AVG(quality_score) as avg_score,
             AVG(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN quality_score END) as current_period,
             AVG(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '60 days' 
                      AND created_at < CURRENT_DATE - INTERVAL '30 days' THEN quality_score END) as previous_period
      FROM code_quality_scores
      WHERE quality_score IS NOT NULL
    `);

    client.release();

    // Calculate trends
    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return { value: 0, isPositive: true };
      const percentage = ((current - previous) / previous) * 100;
      return {
        value: Math.round(Math.abs(percentage)),
        isPositive: percentage >= 0
      };
    };

    const designsProcessed = parseInt(designsResult.rows[0].count) || 0;
    const designsTrend = calculateTrend(
      parseInt(designsResult.rows[0].current_period) || 0,
      parseInt(designsResult.rows[0].previous_period) || 0
    );

    const codeGenerationRequests = parseInt(codeGenResult.rows[0].count) || 0;
    const codeTrend = calculateTrend(
      parseInt(codeGenResult.rows[0].current_period) || 0,
      parseInt(codeGenResult.rows[0].previous_period) || 0
    );

    const designTokensExtracted = parseInt(tokensResult.rows[0].count) || 0;
    const tokensTrend = calculateTrend(
      parseInt(tokensResult.rows[0].current_period) || 0,
      parseInt(tokensResult.rows[0].previous_period) || 0
    );

    const averageCodeQualityScore = parseFloat(qualityResult.rows[0].avg_score) || 0;
    const qualityTrend = calculateTrend(
      parseFloat(qualityResult.rows[0].current_period) || 0,
      parseFloat(qualityResult.rows[0].previous_period) || 0
    );

    res.json({
      designsProcessed: {
        value: designsProcessed,
        trend: designsTrend
      },
      codeGenerationRequests: {
        value: codeGenerationRequests,
        trend: codeTrend
      },
      designTokensExtracted: {
        value: designTokensExtracted,
        trend: tokensTrend
      },
      averageCodeQualityScore: {
        value: Math.round(averageCodeQualityScore * 10) / 10,
        trend: qualityTrend
      }
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Record a new processed design
router.post('/designs', async (req: Request, res: Response) => {
  try {
    const { design_name, figma_file_id, user_id, processing_time } = req.body;
    
    const client = await pool.connect();
    const result = await client.query(`
      INSERT INTO processed_designs (design_name, figma_file_id, user_id, processing_time, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id, created_at
    `, [design_name, figma_file_id, user_id, processing_time]);
    
    client.release();
    
    res.json({ 
      success: true, 
      id: result.rows[0].id,
      created_at: result.rows[0].created_at
    });
  } catch (error) {
    console.error('Error recording design:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Record a new code generation request
router.post('/code-generation', async (req: Request, res: Response) => {
  try {
    const { design_id, framework, user_id, quality_score } = req.body;
    
    const client = await pool.connect();
    
    // Insert code generation request
    const requestResult = await client.query(`
      INSERT INTO code_generation_requests (design_id, framework, user_id, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING id, created_at
    `, [design_id, framework, user_id]);
    
    // Insert quality score if provided
    if (quality_score) {
      await client.query(`
        INSERT INTO code_quality_scores (request_id, quality_score, created_at)
        VALUES ($1, $2, NOW())
      `, [requestResult.rows[0].id, quality_score]);
    }
    
    client.release();
    
    res.json({ 
      success: true, 
      id: requestResult.rows[0].id,
      created_at: requestResult.rows[0].created_at
    });
  } catch (error) {
    console.error('Error recording code generation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Record design tokens
router.post('/design-tokens', async (req: Request, res: Response) => {
  try {
    const { design_id, token_type, token_name, token_value, user_id } = req.body;
    
    const client = await pool.connect();
    const result = await client.query(`
      INSERT INTO design_tokens (design_id, token_type, token_name, token_value, user_id, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id, created_at
    `, [design_id, token_type, token_name, token_value, user_id]);
    
    client.release();
    
    res.json({ 
      success: true, 
      id: result.rows[0].id,
      created_at: result.rows[0].created_at
    });
  } catch (error) {
    console.error('Error recording design token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get activity data for charts
router.get('/activity', async (req: Request, res: Response) => {
  try {
    const { days = 7 } = req.query;
    
    const client = await pool.connect();
    const result = await client.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(CASE WHEN table_name = 'processed_designs' THEN 1 END) as designs,
        COUNT(CASE WHEN table_name = 'code_generation_requests' THEN 1 END) as code_requests,
        COUNT(CASE WHEN table_name = 'design_tokens' THEN 1 END) as tokens
      FROM (
        SELECT created_at, 'processed_designs' as table_name FROM processed_designs
        WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
        UNION ALL
        SELECT created_at, 'code_generation_requests' as table_name FROM code_generation_requests
        WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
        UNION ALL
        SELECT created_at, 'design_tokens' as table_name FROM design_tokens
        WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
      ) as combined
      GROUP BY DATE(created_at)
      ORDER BY date
    `);
    
    client.release();
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching activity data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;