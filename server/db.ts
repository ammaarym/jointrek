import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon database to work with WebSockets for better performance
neonConfig.webSocketConstructor = ws;

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