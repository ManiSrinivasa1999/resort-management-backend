import { loadConfig } from "./config";

export async function getDatabaseUrl(): Promise<string> {
  const config = await loadConfig();

  const DB_HOST = encodeURIComponent(config.DB_HOST);
  const DB_USER = encodeURIComponent(config.DB_USER);
  const DB_PASSWORD = encodeURIComponent(config.DB_PASSWORD);
  const DB_NAME = encodeURIComponent(config.DB_NAME);
  const DB_PORT = config.DB_PORT;

  return `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
}
