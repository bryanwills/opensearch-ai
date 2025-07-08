declare global {
  namespace NodeJS {
    interface ProcessEnv extends CloudflareEnv {
        SEARCH_API_KEY: string;
        SUPERMEMORY_API_KEY: string;
        BACKEND_SECURITY_KEY: string;
        GOOGLE_CLIENT_ID: string;
        GOOGLE_CLIENT_SECRET: string;
        OPENAI_API_KEY: string
    }
  }
}
export {};