
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY must be set in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TABLES = [
    'areas',
    'centers',
    'contracts',
    'lots',
    'credits',
    'invoices',
    'contract_areas',
    'contract_centers'
];

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKUP_DIR = path.join(__dirname, '..', 'backup_data');

if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR);
}

async function backupTable(table: string) {
    console.log(`Backing up ${table}...`);
    const { data, error } = await supabase.from(table).select('*');

    if (error) {
        console.error(`Error backing up ${table}:`, error);
        return;
    }

    const filePath = path.join(BACKUP_DIR, `${table}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Saved ${data.length} records to ${filePath}`);
}

async function runBackup() {
    console.log('Starting backup...');
    for (const table of TABLES) {
        await backupTable(table);
    }
    console.log('Backup complete!');
}

runBackup();
