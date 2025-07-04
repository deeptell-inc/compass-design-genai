# COMPASS Design Bridge MCP Server

Model Context Protocol (MCP) server for the COMPASS Design Bridge platform, providing AI-powered design analysis, code generation, and business insights.

## Features

- **Figma Integration**: Fetch design data and extract design tokens
- **AI Code Generation**: Generate production-ready code from Figma designs
- **UX Insights**: AI-powered analysis of user behavior and design patterns
- **Business Intelligence**: ROI calculations and strategic recommendations
- **External Data Integration**: A/B testing data and UX research insights

## Installation

```bash
npm install
cp .env.example .env
# Edit .env with your API keys
npm run build
```

## Development

```bash
npm run dev
```

## API Endpoints

- `GET /health` - Health check
- `GET /tools` - List available MCP tools
- `POST /execute/:toolName` - Execute a specific tool

## MCP Tools

### fetch_figma_design
Fetch design data from Figma files and extract design tokens.

### generate_code
Generate framework-specific code from Figma designs using AI.

### generate_ai_insights
Analyze design and user behavior data to generate UX insights.

### generate_business_insights
Generate business recommendations and ROI calculations.

## Configuration

Set the following environment variables:

- `ANTHROPIC_API_KEY` - Claude API key
- `FIGMA_ACCESS_TOKEN` - Figma API token
- `ABTEST_DESIGN_API_KEY` - A/B testing data API key
- `NNGROUP_API_KEY` - UX research data API key

## Usage with Claude Desktop

Add to your Claude Desktop MCP configuration:

```json
{
  "mcpServers": {
    "compass-design-bridge": {
      "command": "node",
      "args": ["path/to/compass-design-bridge-server/dist/server.js"]
    }
  }
}
```
