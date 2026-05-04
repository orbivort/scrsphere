import { config } from 'dotenv';
import { defineConfig, env } from 'prisma/config';
import { resolve } from 'node:path';

// Load the appropriate .env file based on NODE_ENV
const nodeEnv = process.env.NODE_ENV || 'development';
const envFile =
  nodeEnv === 'test' ? '.env.test' : nodeEnv === 'production' ? '.env.production' : '.env';

config({ path: resolve(process.cwd(), envFile) });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL', { required: true }),
  },
});
