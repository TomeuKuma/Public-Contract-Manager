
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKUP_DIR = path.join(__dirname, '..', 'backup_data');

// NEW CREDENTIALS PROVIDED BY USER
const NEW_SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const NEW_SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY || "";

const supabase = createClient(NEW_SUPABASE_URL, NEW_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const TABLES_ORDER = [
    'areas',
    'centers',
    'contracts',
    'contract_areas',
    'contract_centers',
    'lots',
    'credits',
    'invoices'
];

async function restoreTable(table: string) {
    console.log(`Restoring ${table}...`);
    const filePath = path.join(BACKUP_DIR, `${table}.json`);

    if (!fs.existsSync(filePath)) {
        console.log(`No backup file found for ${table}, skipping.`);
        return;
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);

    if (!data || data.length === 0) {
        console.log(`No data to restore for ${table}.`);
        return;
    }

    // Insert in chunks to avoid payload limits
    const CHUNK_SIZE = 100;
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
        let chunk = data.slice(i, i + CHUNK_SIZE);

        // Sanitize contracts data
        if (table === 'contracts') {
            chunk = chunk.map((item: any) => {
                const { instructor_technician, ...rest } = item;
                return rest;
            });
        }

        const { error } = await supabase.from(table).upsert(chunk, { onConflict: 'id' });

        if (error) {
            console.error(`Error restoring chunk ${i / CHUNK_SIZE + 1} for ${table}:`, error);
        } else {
            console.log(`Restored chunk ${i / CHUNK_SIZE + 1} (${chunk.length} records) for ${table}`);
        }
    }
}

async function clearDatabase() {
    console.log('Clearing existing data to avoid conflicts...');
    // Delete in reverse order of dependencies
    const TABLES_REVERSE = [...TABLES_ORDER].reverse();
    for (const table of TABLES_REVERSE) {
        const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
        if (error) {
            console.error(`Error clearing ${table}:`, error);
        } else {
            console.log(`Cleared ${table}`);
        }
    }
}

async function runRestore() {
    console.log('Starting restore process...');
    await clearDatabase();
    for (const table of TABLES_ORDER) {
        await restoreTable(table);
    }
    console.log('Restore complete!');
}

runRestore();
