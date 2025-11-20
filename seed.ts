
import { createClient } from '@supabase/supabase-js';

// Load environment variables manually since we're not in Vite
const SUPABASE_URL = "https://ukqmiilmbgtsqpyisnoe.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrcW1paWxtYmd0c3FweWlzbm9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0OTg2OTAsImV4cCI6MjA3OTA3NDY5MH0.ydw8ryC50EE5M-N8fWvPTih7Xm4nl8Wk5duf9g0N6z0";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function seed() {
    console.log('Starting seed...');

    // 1. Authenticate
    const email = `admin-${Date.now()}@imas.com`;
    const password = 'password123';

    console.log(`Creating temporary user: ${email}`);
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
    });

    if (authError) {
        console.error('Error creating user:', authError);
        // Try signing in if user exists (fallback)
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: 'admin@imas.com',
            password: 'password123'
        });
        if (signInError) {
            console.error('Could not sign in either:', signInError);
            return;
        }
    }

    console.log('Authenticated successfully.');

    // --- Contract 1: Obra ---
    console.log('Creating Obra contract...');
    const { data: contractObra, error: errObra } = await supabase
        .from('contracts')
        .insert({
            name: 'Reforma integral de la cuina de la Residència Llar dels Ancians',
            dossier_number: 'DOSS-2025-OBRA-01',
            file_number: 'EXP-2025-OBRA-01',
            instructor_technician: 'Bartomeu Miralles',
            contracting_body: 'UFAG Residència Llar dels Ancians',
            contact_responsible: 'Arquitecte Tècnic IMAS',
            award_procedure: 'Contracte obert',
            contract_type: 'Obra',
            purpose: 'Obres de reforma i adequació de les instal·lacions de cuina per adaptar-se a la normativa vigent.',
            extendable: false,
            modifiable: true
        })
        .select()
        .single();

    if (errObra) {
        console.error('Error creating Obra contract:', errObra);
        return;
    }

    // Get Area and Center IDs
    const { data: areaSoc } = await supabase.from('areas').select('id').eq('name', 'Atenció Sociosanitària').single();
    const { data: centerLlar } = await supabase.from('centers').select('id').eq('name', 'Residència Llar dels Ancians').single();

    if (areaSoc) await supabase.from('contract_areas').insert({ contract_id: contractObra.id, area_id: areaSoc.id });
    if (centerLlar) await supabase.from('contract_centers').insert({ contract_id: contractObra.id, center_id: centerLlar.id });

    // Lot
    const { data: lotObra } = await supabase.from('lots').insert({
        contract_id: contractObra.id,
        name: "Lot únic: Execució d'obra",
        cpv: '45210000',
        awardee: 'Construccions Mallorca S.L.',
        cif_nif: 'B57123456',
        observations: "Termini d'execució de 4 mesos",
        start_date: '2025-03-01',
        end_date: '2025-06-30'
    }).select().single();

    // Credit
    const { data: creditObra } = await supabase.from('credits').insert({
        lot_id: lotObra.id,
        organic_item: '1234',
        program_item: '6000',
        economic_item: '62000',
        accounting_document_number: '2025000123',
        credit_committed_d: 150000.00
    }).select().single();

    // Invoice
    await supabase.from('invoices').insert({
        credit_id: creditObra.id,
        invoice_number: 'CERT-01',
        invoice_date: '2025-03-31',
        base_amount: 25000.00,
        vat_amount: 5250.00
    });


    // --- Contract 2: Concessió ---
    console.log('Creating Concessió contract...');
    const { data: contractConc, error: errConc } = await supabase
        .from('contracts')
        .insert({
            name: 'Gestió del servei de cafeteria del Centre de dia Reina Sofia',
            dossier_number: 'DOSS-2025-CONC-01',
            file_number: 'EXP-2025-CONC-01',
            instructor_technician: 'Maria Mayol',
            contracting_body: 'UFAG Centre de dia Reina Sofia',
            contact_responsible: 'Director del Centre',
            award_procedure: 'Contracte menor ADO',
            contract_type: 'Concessió',
            purpose: "Concessió administrativa per a l'explotació del servei de bar-cafeteria.",
            extendable: true,
            modifiable: false
        })
        .select()
        .single();

    if (errConc) {
        console.error('Error creating Concessió contract:', errConc);
        return;
    }

    const { data: centerReina } = await supabase.from('centers').select('id').eq('name', 'Centre de dia Reina Sofia').single();

    if (areaSoc) await supabase.from('contract_areas').insert({ contract_id: contractConc.id, area_id: areaSoc.id });
    if (centerReina) await supabase.from('contract_centers').insert({ contract_id: contractConc.id, center_id: centerReina.id });

    // Lot
    const { data: lotConc } = await supabase.from('lots').insert({
        contract_id: contractConc.id,
        name: "Cànon d'explotació",
        cpv: '55330000',
        awardee: 'Serveis de Restauració Balear S.A.',
        cif_nif: 'A07123456',
        observations: 'Cànon anual de 12.000€',
        start_date: '2025-01-01',
        end_date: '2025-12-31'
    }).select().single();

    // Credit
    const { data: creditConc } = await supabase.from('credits').insert({
        lot_id: lotConc.id,
        organic_item: '1234',
        program_item: '2270',
        economic_item: '22700',
        accounting_document_number: '2025000456',
        credit_committed_d: 12000.00
    }).select().single();

    // Invoice
    await supabase.from('invoices').insert({
        credit_id: creditConc.id,
        invoice_number: 'CANON-01',
        invoice_date: '2025-01-31',
        base_amount: 1000.00,
        vat_amount: 210.00
    });

    console.log('Seed completed successfully!');
}

seed();
