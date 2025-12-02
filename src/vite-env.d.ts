/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONDUCTOR_SERVER_URL: string;
  readonly VITE_CONDUCTOR_API_KEY?: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_DEV_PORT: string;
  readonly VITE_API_TIMEOUT: string;
  readonly VITE_RETRY_ATTEMPTS: string;
  readonly VITE_ENABLE_LOGGING: string;
  readonly VITE_LOG_LEVEL: string;
  readonly VITE_CONDUCTOR_GRAPHQL_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
