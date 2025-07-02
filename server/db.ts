import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from "@shared/schema";

// Note: Removed WebSocket configuration to avoid connection issues
// The Neon serverless driver can work without WebSockets

// Make sure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

// Create a database connection pool
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Create a Drizzle ORM instance with our schema
export const db = drizzle(pool, { schema });

// Export a function to close the database connection
export const closeDb = async () => {
  await pool.end();
};