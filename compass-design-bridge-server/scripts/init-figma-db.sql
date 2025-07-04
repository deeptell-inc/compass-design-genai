-- Figma API keys table for storing encrypted user API keys

CREATE TABLE IF NOT EXISTS figma_api_keys (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL UNIQUE,
    encrypted_api_key TEXT NOT NULL,
    figma_user_info JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_figma_api_keys_user_id ON figma_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_figma_api_keys_is_active ON figma_api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_figma_api_keys_updated_at ON figma_api_keys(updated_at);

-- Sample data (optional - remove in production)
-- INSERT INTO figma_api_keys (user_id, encrypted_api_key, figma_user_info, is_active) VALUES
-- ('user1@example.com', 'encrypted_key_placeholder', '{"name": "Test User", "email": "user1@example.com"}', true);

-- View for admin monitoring
CREATE OR REPLACE VIEW figma_connections_summary AS
SELECT 
    COUNT(*) as total_connections,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_connections,
    COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_connections,
    MAX(updated_at) as last_updated
FROM figma_api_keys;