import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3002,
  nodeEnv: process.env.NODE_ENV || 'development',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  figmaApiKey: process.env.FIGMA_API_KEY || '',
  figmaAccessToken: process.env.FIGMA_ACCESS_TOKEN || '',
  abtestDesignApiKey: process.env.ABTEST_DESIGN_API_KEY || '',
  nnGroupApiKey: process.env.NNGROUP_API_KEY || '',
  mcpUsername: process.env.MCP_USERNAME || 'deeptell_compass',
  mcpPassword: process.env.MCP_PASSWORD || 'n8ZiGx4w',
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    database: process.env.DB_NAME || 'compass_db',
    user: process.env.DB_USER || 'compass_user',
    password: process.env.DB_PASSWORD || 'compass_password',
  },
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
};

export const validateConfig = () => {
  const requiredKeys = ['openaiApiKey', 'figmaApiKey'];
  const missing = requiredKeys.filter(key => !config[key as keyof typeof config]);
  
  if (missing.length > 0) {
    console.warn(`Missing environment variables: ${missing.join(', ')}`);
  }
};
