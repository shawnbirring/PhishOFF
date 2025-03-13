import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '.env' });

export default defineConfig({
  schema: './db/schema.ts',
  out: './supabase/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.POSTGRES_URL!,
    ssl: {
      rejectUnauthorized: false,      // Bypass self-signed cert validation (dev only)
    },
  },
  verbose: true,   
  migrations: {
    table: 'drizzle_migrations',      // Custom migration table name
    schema: 'public',                 // Explicit schema for migration table
  },
});