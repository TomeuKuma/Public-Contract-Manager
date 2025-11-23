
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase credentials in .env file');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    },
});

const CSV_PATH = path.join(__dirname, '..', 'codigos_cpv.csv');

interface CPVRecord {
    CODI: string;
    Castellà: string;
    Català: string;
    'Tipus de contracte': string;
}

function calculateDepth(codeNum: string): number {
    if (codeNum.endsWith('000000')) return 1; // Division
    if (codeNum.endsWith('00000')) return 2;  // Group
    if (codeNum.endsWith('0000')) return 3;   // Class
    if (codeNum.endsWith('000')) return 4;    // Category
    return 5;                                 // Full element
}

async function importCPVCodes() {
    console.log('Starting CPV import...');

    if (!fs.existsSync(CSV_PATH)) {
        console.error(`CSV file not found at ${CSV_PATH}`);
        process.exit(1);
    }

    const fileContent = fs.readFileSync(CSV_PATH, 'latin1');
    const records: CPVRecord[] = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        delimiter: ',',
        quote: '"'
    });

    console.log(`Parsed ${records.length} records.`);

    const cpvData = records.map((record) => {
        const fullCode = record.CODI; // e.g., "03000000-1"
        const [codeNumeric, checkDigit] = fullCode.split('-');

        if (!codeNumeric || !checkDigit) {
            console.warn(`Invalid code format: ${fullCode}`);
            return null;
        }

        const division = codeNumeric.substring(0, 2);
        const groupCode = codeNumeric.substring(0, 3);
        const classCode = codeNumeric.substring(0, 4);
        const categoryCode = codeNumeric.substring(0, 5);
        const depthLevel = calculateDepth(codeNumeric);

        return {
            code: fullCode,
            code_numeric: codeNumeric,
            check_digit: checkDigit,
            description_es: record['Castellà'],
            description_ca: record['Català'],
            contract_type: record['Tipus de contracte'],
            division,
            group_code: groupCode,
            class_code: classCode,
            category_code: categoryCode,
            depth_level: depthLevel,
        };
    }).filter(item => item !== null);

    console.log(`Prepared ${cpvData.length} valid records for insertion.`);

    // Insert in batches
    const BATCH_SIZE = 1000;
    for (let i = 0; i < cpvData.length; i += BATCH_SIZE) {
        const batch = cpvData.slice(i, i + BATCH_SIZE);
        const { error } = await supabase.from('cpv_codes').upsert(batch, { onConflict: 'code' });

        if (error) {
            console.error(`Error inserting batch ${i / BATCH_SIZE + 1}:`, error);
        } else {
            console.log(`Inserted batch ${i / BATCH_SIZE + 1} (${batch.length} records)`);
        }
    }

    console.log('CPV import completed.');
}

importCPVCodes().catch(console.error);
