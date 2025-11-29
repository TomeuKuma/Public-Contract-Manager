# Documentació de l'API i Dades

Aquest document descriu l'esquema de dades utilitzat a Supabase i els serveis principals del frontend.

## 🗄️ Esquema de Base de Dades (Supabase)

### Taules Principals

#### `contracts`
Emmagatzema la informació principal dels expedients de contractació.
- `id`: UUID (Primary Key)
- `name`: Text (Nom del contracte)
- `file_number`: Text (Número d'expedient)
- `dossier_number`: Text (Número de dossier)
- `contracting_body`: Text (Òrgan de contractació)
- `award_procedure`: Text (Procediment d'adjudicació)
- `contract_type`: Text (Tipus contractual)
- `start_date`: Date
- `end_date`: Date
- `extendable`: Boolean (Prorrogable)
- `modifiable`: Boolean (Modificable)
- `need_to_satisfy`: Text (Necessitat a satisfer)
- `observations`: Text (Observacions)
- ... altres camps

#### `lots`
Lots associats a un contracte.
- `id`: UUID (PK)
- `contract_id`: UUID (FK -> contracts.id)
- `name`: Text
- `awardee`: Text (Adjudicatari)
- `credit_real_total`: Numeric (Calculat o emmagatzemat)
- ... altres camps

#### `credits`
Crèdits pressupostaris associats a un lot.
- `id`: UUID (PK)
- `lot_id`: UUID (FK -> lots.id)
- `organic_item`: Text (Orgànica)
- `program_item`: Text (Programa)
- `economic_item`: Text (Econòmica)
- `credit_committed_d`: Numeric (Crèdit compromès)
- `credit_recognized_o`: Numeric (Crèdit reconegut)
- `credit_real`: Numeric (Crèdit real)
- `modificacio_credit`: Numeric
- `any`: Integer
- ... altres camps

#### `invoices`
Factures associades a un crèdit.
- `id`: UUID (PK)
- `credit_id`: UUID (FK -> credits.id)
- `invoice_number`: Text
- `base_amount`: Numeric
- `vat_amount`: Numeric
- `total`: Numeric
- `center_id`: UUID (FK -> centers.id)

### Relacions
- Un **Contracte** té molts **Lots**.
- Un **Lot** té molts **Crèdits**.
- Un **Crèdit** té moltes **Factures**.
- Els contractes també tenen relacions N:M amb **Àrees** i **Centres** a través de taules intermèdies (`contract_areas`, `contract_centers`).

## 🔌 Serveis Frontend (`src/lib/`)

### `contractService.ts`
Conté la lògica per interactuar amb Supabase referent als contractes.

- `getContracts(filters)`: Recupera contractes aplicant filtres.
- `getContractById(id)`: Recupera un contracte complet amb les seves relacions (lots, crèdits, factures, àrees, centres) i transforma les dades per adaptar-les a la interfície `Contract`.
- `createContract(data)`: Crea un nou contracte i les seves associacions.
- `deleteContract(id)`: Elimina un contracte.

### `exploitationService.ts`
Serveis per a l'explotació i anàlisi de dades.

- `getFractionationDetails(filters)`: Recupera dades detallades per a la verificació de fraccionament, incloent estructura jeràrquica (Lotes -> Crèdits -> Factures) i camps de pressupost.

### `constants.ts`
Defineix llistes estàtiques utilitzades a l'aplicació:
- `CONTRACTING_BODIES`: Llistat d'òrgans de contractació.
- `AWARD_PROCEDURES`: Tipus de procediments.
- `CONTRACT_TYPES`: Tipus de contractes (Obra, Servei, etc.).

### `formatters.ts`
- `formatCurrency(amount)`: Formata números com a moneda (EUR).
- `formatDate(date)`: Formata dates al format local.
