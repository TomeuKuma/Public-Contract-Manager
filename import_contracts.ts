
import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';

// Load environment variables manually
const SUPABASE_URL = "https://ukqmiilmbgtsqpyisnoe.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrcW1paWxtYmd0c3FweWlzbm9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0OTg2OTAsImV4cCI6MjA3OTA3NDY5MH0.ydw8ryC50EE5M-N8fWvPTih7Xm4nl8Wk5duf9g0N6z0";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const csvData = `nom_contracte,area,centres_associats,num_dossier,num_expedient,tecnic_instructor,organ_contractacio,responsable_contacte,procediment_adjudicacio,tipus_contractual,objecte,prorrogable,modificable
"Obres de manteniment derivades de l'informe seguiment dels fonaments de la Bonanova","Atenció Sociosanitària","Residència La Bonanova",,1018747C,,,,"Obra","Obres de manteniment derivades de l'informe seguiment dels fonaments de la Bonanova",false,false
"Elaboració del projecte Escales d’emergències","Atenció Sociosanitària","Residència La Bonanova",1143111E,1198142M,,,,"Obra","Elaboració del projecte Escales d’emergències",false,false
"Obres Xarxa d’hidrants","Atenció Sociosanitària","Residència La Bonanova",,905892J,,,,"Obra","Obres Xarxa d’hidrants",false,false
"Revisió plecs tecnics manteniment Bonanova","Atenció Sociosanitària","Residència La Bonanova",,1133347T,Pep Toni,,,,"Obra","Revisió plecs tecnics manteniment Bonanova",false,false
"Simplificat: LOT 1 vestuaris LOT 2 línia de vida LOT 3 obres cruis i humitats (reivindicacions sindicals), terrassa 5P, falsos sostres 5P, arquetes parking, coloms, torretes ascensors i algunes terrasses LOT 4 revisió pilars","Atenció Sociosanitària","Residència La Bonanova",,760013Z,,,,"Obra","Simplificat: LOT 1 vestuaris LOT 2 línia de vida LOT 3 obres cruis i humitats (reivindicacions sindicals), terrassa 5P, falsos sostres 5P, arquetes parking, coloms, torretes ascensors i algunes terrasses LOT 4 revisió pilars",false,false
"Reparacio portes d’emergència (carpinteria)","Atenció Sociosanitària","Residència La Bonanova",,1239880F,,,,"Obra","Reparacio portes d’emergència (carpinteria)",false,false
"Obra de reforma integral cuina","Atenció Sociosanitària","Residència La Bonanova",,887836F,,,,"Obra","Obra de reforma integral cuina",false,false
"Obra reforma cuina provisional","Atenció Sociosanitària","Residència La Bonanova",,996050D,,,,"Obra","Obra reforma cuina provisional",false,false
"Impermeabilitzacio de terrasses i banys Bonanova","Atenció Sociosanitària","Residència La Bonanova",,1153946D,Joan Mut,,,,"Obra","Impermeabilitzacio de terrasses i banys Bonanova",false,false
"PROPUESTA CONTRATO SERVICIO REDACCIÓN PROYECTOS OBRA,INSTALACIÓN Y DIRECCIÓN DE TRABAJOS PARA DIVERSOS CENTROS DEL IMAS","Atenció Sociosanitària,Atenció Comunitaria i Promoció de la Autonomia Personal",,1143111E,2025/05/CSER,Arquitectura,SJA,,,"Obra","PROPUESTA CONTRATO SERVICIO REDACCIÓN PROYECTOS OBRA,INSTALACIÓN Y DIRECCIÓN DE TRABAJOS PARA DIVERSOS CENTROS DEL IMAS",false,false
"Contracte manteniment preventiu i correctiu legionel·la centres gent gran","Atenció Sociosanitària","Residència Llar dels Ancians,Residència La Bonanova,Residència Bartomeu Quetglas,Residència Huialfàs,Residència Oms-Sant Miquel,Residència Miquel Mir,Residència Sant Josep,Residència Son Caulelles",,1149220P,,,,"Obra","Contracte manteniment preventiu i correctiu legionel·la centres gent gran",false,false
"Contracte manteniment preventiu i correctiu 22 centres IMAS. 5 lots: legionel·la, ascensors, baixa tensió, contraincendis, RITE (de gent gran inclou Oms-Sant Miquel i els centres de dia Reina Sofia, Can Clar i Son Perxana)","Atenció Sociosanitària,Atenció Comunitaria i Promoció de la Autonomia Personal","Residència Oms-Sant Miquel,Centre de dia Reina Sofia,Centre de dia Can Clar,Centre de dia Son Perxana",1250176F,1271913X,Cata Comella,,,,"Obra","Contracte manteniment preventiu i correctiu 22 centres IMAS. 5 lots: legionel·la, ascensors, baixa tensió, contraincendis, RITE (de gent gran inclou Oms-Sant Miquel i els centres de dia Reina Sofia, Can Clar i Son Perxana)",false,false
"Substitució de la instal·lació de la centraleta contraincendis","Atenció Sociosanitària","Residència Bartomeu Quetglas",,961781H,Pep Toni,,,,"Obra","Substitució de la instal·lació de la centraleta contraincendis",false,false
"Despreniments peces de la fatxada","Atenció Sociosanitària","Residència Bartomeu Quetglas",,996346P,,,,"Obra","Despreniments peces de la fatxada",false,false
"2 A/C planta 2ª","Atenció Sociosanitària","Residència Huialfàs",1143111E,2025/05/CSER,Arquitectura,SJA,,,"Obra","2 A/C planta 2ª",false,false
"Obres substitució canonades","Atenció Sociosanitària","Residència Llar dels Ancians",,874344R,Juan Mut,,,,"Obra","Obres substitució canonades",false,false
"Projecte de reparació del mur de contenció de l'entrada de la Llar","Atenció Sociosanitària","Residència Llar dels Ancians",,1016996W,,,,"Obra","Projecte de reparació del mur de contenció de l'entrada de la Llar",false,false
"Obra de reparació del tancament perimetral de la parcel·la","Atenció Sociosanitària","Residència Llar dels Ancians",,981777E,,,,"Obra","Obra de reparació del tancament perimetral de la parcel·la",false,false
"Timbres pacient-infermera mòdul A","Atenció Sociosanitària","Residència Llar dels Ancians",,1116834J,Marc Costa,,,,"Obra","Timbres pacient-infermera mòdul A",false,false
"Paviment modul C","Atenció Sociosanitària","Residència Llar dels Ancians",,1261708Y,,,,"Obra","Paviment modul C",false,false
"Arreglar cantells balcons mòdul A","Atenció Sociosanitària","Residència Llar dels Ancians",,1116795E,Joan Mut,,,,"Obra","Arreglar cantells balcons mòdul A",false,false
"Canvi instal·lació gasoil a gas SANT JOSEP","Atenció Sociosanitària","Residència Sant Josep",,1152825X,Arquitectura,,,,"Obra","Canvi instal·lació gasoil a gas SANT JOSEP",false,false
"Adequació i ampliacio punts de treball","Atenció Sociosanitària","Residència Sant Josep",,1225993T,,,,"Obra","Adequació i ampliacio punts de treball",false,false
"Enrajolar patis i rampa bugaderia","Atenció Sociosanitària","Residència Son Caulelles",,996313T,JORGE Y CARLOS BRIONES,,,,"Obra","Enrajolar patis i rampa bugaderia",false,false`;

async function importData() {
    console.log('Starting import...');

    // 1. Authenticate
    const email = `admin-${Date.now()}@imas.com`;
    const password = 'password123';

    console.log(`Creating temporary user: ${email}`);
    const { error: authError } = await supabase.auth.signUp({ email, password });

    if (authError) {
        console.error('Error creating user:', authError);
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: 'admin@imas.com',
            password: 'password123'
        });
        if (signInError) {
            console.error('Could not sign in either:', signInError);
            return;
        }
    }
    console.log('Authenticated.');

    // 2. Fetch Areas and Centers for lookup
    const { data: areas } = await supabase.from('areas').select('id, name');
    const { data: centers } = await supabase.from('centers').select('id, name');

    const areaMap = new Map(areas?.map(a => [a.name.toLowerCase().trim(), a.id]));
    const centerMap = new Map(centers?.map(c => [c.name.toLowerCase().trim(), c.id]));

    // 3. Parse CSV
    const records = parse(csvData, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_quotes: true,
        relax_column_count: true,
        skip_records_with_error: true
    });

    console.log(`Found ${records.length} records to import.`);

    for (const record of records as any[]) {
        // Normalize data
        const type = record.tipus_contractual === 'Serveis' ? 'Servei' : record.tipus_contractual;
        const extendable = record.prorrogable?.toLowerCase() === 'true';
        const modifiable = record.modificable?.toLowerCase() === 'true';

        // Insert Contract
        const { data: contract, error } = await supabase
            .from('contracts')
            .insert({
                name: record.nom_contracte,
                dossier_number: record.num_dossier || null,
                file_number: record.num_expedient || null,
                instructor_technician: record.tecnic_instructor || null,
                contracting_body: record.organ_contractacio || null,
                contact_responsible: record.responsable_contacte || null,
                award_procedure: record.procediment_adjudicacio || null,
                contract_type: type,
                purpose: record.objecte || null,
                extendable: extendable,
                modifiable: modifiable
            })
            .select()
            .single();

        if (error) {
            console.error(`Error inserting contract "${record.nom_contracte}":`, error.message);
            continue;
        }

        console.log(`Inserted contract: ${contract.name}`);

        // Link Areas
        if (record.area) {
            const areaNames = record.area.split(',').map((s: string) => s.trim());
            for (const name of areaNames) {
                const areaId = areaMap.get(name.toLowerCase());
                if (areaId) {
                    await supabase.from('contract_areas').insert({ contract_id: contract.id, area_id: areaId });
                } else {
                    console.warn(`Area not found: ${name}`);
                }
            }
        }

        // Link Centers
        if (record.centres_associats) {
            const centerNames = record.centres_associats.split(',').map((s: string) => s.trim());
            for (const name of centerNames) {
                const centerId = centerMap.get(name.toLowerCase());
                if (centerId) {
                    await supabase.from('contract_centers').insert({ contract_id: contract.id, center_id: centerId });
                } else {
                    console.warn(`Center not found: ${name}`);
                }
            }
        }
    }

    console.log('Import completed.');
}

importData();
