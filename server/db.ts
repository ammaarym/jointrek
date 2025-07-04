import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "@shared/schema";

// Make sure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

// Use HTTP connection instead of WebSocket for better Replit compatibility
const sql = neon(process.env.DATABASE_URL);

// Create a Drizzle ORM instance with our schema using HTTP
export const db = drizzle(sql, { schema });

// Create a dummy pool for compatibility
export const pool = {
  end: async () => {
    // No-op for HTTP connections
  }
};

// Export a function to close the database connection
export const closeDb = async () => {
  await pool.end();
};