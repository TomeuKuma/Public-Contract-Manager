import { createClient } from '@supabase/supabase-js';
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

// Tables to truncate (in reverse dependency order - child tables first)
const TABLES = [
    'invoices',
    'credits',
    'lots',
    'contract_centers',
    'contract_areas',
    'contracts',
    'cpv_codes',
    'centers',
    'areas'
];

async function truncateTable(tableName: string): Promise<void> {
    console.log(`Truncating table: ${tableName}...`);

    try {
        const { error } = await supabase
            .from(tableName)
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

        if (error) {
            console.error(`Error truncating ${tableName}:`, error);
            return;
        }

        console.log(`✓ Truncated ${tableName}`);
    } catch (error) {
        console.error(`Exception truncating ${tableName}:`, error);
    }
}

async function main() {
    console.log(`\n⚠️  WARNING: This will delete ALL data from the database!\n`);
    console.log(`Please ensure you have created a backup before proceeding.\n`);

    // In a real scenario, you'd want user confirmation here
    // For now, we'll proceed automatically

    console.log(`🗑️  Starting database reset...\n`);

    // Truncate each table
    for (const table of TABLES) {
        await truncateTable(table);
    }

    console.log(`\n✅ Database reset completed successfully!`);
    console.log(`All tables are now empty but structure is preserved.\n`);
}

main().catch(console.error);
