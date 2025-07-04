CREATE TABLE users (
  user_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE figma_files (
  file_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  figma_file_key VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  last_imported_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE (user_id, figma_file_key),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE generated_artifacts (
  artifact_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  figma_file_key VARCHAR(255),
  figma_node_id VARCHAR(255),
  artifact_type VARCHAR(50) NOT NULL,
  content TEXT,
  artifact_url VARCHAR(2048),
  prompt_text TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE user_events (
  event_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36),
  anonymous_id VARCHAR(255),
  session_id VARCHAR(255),
  event_type VARCHAR(100) NOT NULL,
  url VARCHAR(2048),
  element_selector VARCHAR(1024),
  payload JSON,
  event_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  received_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE ai_suggestions (
  suggestion_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  suggestion_type VARCHAR(100) NOT NULL,
  source_context JSON,
  prompt_text TEXT,
  suggestion_content TEXT NOT NULL,
  llm_model_used VARCHAR(100),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE ab_test_ideas (
  idea_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  hypothesis TEXT,
  target_metric VARCHAR(100),
  control_description TEXT,
  variant_description TEXT,
  related_suggestion_id VARCHAR(36),
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (related_suggestion_id) REFERENCES ai_suggestions(suggestion_id)
);

CREATE TABLE ab_test_results (
  result_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  idea_id VARCHAR(36) NOT NULL,
  variant_name VARCHAR(50) NOT NULL,
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL(10,2),
  observation_period_start TIMESTAMP,
  observation_period_end TIMESTAMP,
  notes TEXT,
  recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (idea_id) REFERENCES ab_test_ideas(idea_id)
);

CREATE INDEX idx_user_events_user_id ON user_events(user_id);
CREATE INDEX idx_user_events_event_type ON user_events(event_type);
CREATE INDEX idx_user_events_event_timestamp ON user_events(event_timestamp);
CREATE INDEX idx_generated_artifacts_user_id ON generated_artifacts(user_id);
CREATE INDEX idx_ai_suggestions_user_id ON ai_suggestions(user_id);
