import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import fs from 'fs';
import path from 'path';
import pkg from 'pg';
const { Client } = pkg;
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbUrl = "postgresql://postgres:PcLCea8HUIvHcriB@db.vqdjqwibxjjmbepiniyc.supabase.co:5432/postgres";

async function pushSchema() {
    console.log("Connecting to database:", dbUrl.split('@')[1]);
    const client = new Client({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("Connected successfully");

        const schemaPath = path.join(__dirname, 'supabase', 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log("Executing schema.sql...");
        await client.query(schemaSql);
        console.log("Schema applied successfully.");

        const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20240320000000_add_time_lifespan.sql');
        if (fs.existsSync(migrationPath)) {
            const migrationSql = fs.readFileSync(migrationPath, 'utf8');
            console.log("Executing migration 20240320000000_add_time_lifespan.sql...");
            await client.query(migrationSql);
            console.log("Migration applied successfully.");
        }

    } catch (error) {
        console.error("Error pushing schema:", error);
        process.exit(1);
    } finally {
        await client.end();
        console.log("Connection closed.");
    }
}

pushSchema();
