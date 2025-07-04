interface ImportMetaEnv {
  readonly VITE_MCP_SERVER_URL: string;
  readonly VITE_MCP_USERNAME: string;
  readonly VITE_MCP_PASSWORD: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_OPENAI_API_KEY: string;
  readonly VITE_FIGMA_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
