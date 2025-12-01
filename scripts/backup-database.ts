import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY must be set in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Tables to backup (in dependency order - referenced tables first)
const TABLES = [
    'areas',
    'centers',
    'cpv_codes',
    'contracts',
    'contract_areas',
    'contract_centers',
    'lots',
    'credits',
    'invoices'
];

async function backupTable(tableName: string, backupDir: string): Promise<void> {
    console.log(`Backing up table: ${tableName}...`);

    try {
        const { data, error } = await supabase
            .from(tableName)
            .select('*');

        if (error) {
            console.error(`Error backing up ${tableName}:`, error);
            return;
        }

        const filePath = path.join(backupDir, `${tableName}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`✓ Backed up ${data?.length || 0} rows from ${tableName}`);
    } catch (error) {
        console.error(`Exception backing up ${tableName}:`, error);
    }
}

async function main() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const backupDir = path.join(process.cwd(), 'database-backups', `backup-${timestamp}`);

    // Create backup directory
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    console.log(`\n📦 Starting database backup to: ${backupDir}\n`);

    // Backup each table
    for (const table of TABLES) {
        await backupTable(table, backupDir);
    }

    // Create metadata file
    const metadata = {
        timestamp: new Date().toISOString(),
        tables: TABLES,
        supabaseUrl: supabaseUrl
    };

    fs.writeFileSync(
        path.join(backupDir, '_metadata.json'),
        JSON.stringify(metadata, null, 2)
    );

    console.log(`\n✅ Backup completed successfully!`);
    console.log(`📁 Backup location: ${backupDir}\n`);
}

main().catch(console.error);
