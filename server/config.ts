export interface ServerConfig {
  port: number;
  host: string;
  reusePort: boolean;
  isDevelopment: boolean;
  isProduction: boolean;
}

function createConfig(): ServerConfig {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isDevelopment = nodeEnv === 'development';
  const isProduction = nodeEnv === 'production';

  return {
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : (isDevelopment ? 3000 : 5000),
    host: process.env.HOST || (isProduction ? '0.0.0.0' : 'localhost'),
    reusePort: isProduction && process.env.REUSE_PORT !== 'false',
    isDevelopment,
    isProduction,
  };
}

export const config = createConfig();