# Gestor de Contractes Públics (IMAS)

> **Documentació Tècnica per a Agents d'IA i Desenvolupadors**
> Aquest document detalla l'arquitectura, model de dades i lògica de negoci del projecte.

## 📋 Visió General

Aplicació web (SPA) per a la gestió integral de contractes públics de l'IMAS (Institut Mallorquí d'Afers Socials). Permet el seguiment econòmic i administratiu des de l'adjudicació fins a la facturació.

**Objectiu Principal**: Centralitzar la informació contractual, controlar l'execució pressupostària (crèdits i factures) i facilitar la gestió de pròrrogues i modificacions.

## 🛠️ Stack Tecnològic

- **Frontend**: React 18 (Vite), TypeScript.
- **UI Framework**: Tailwind CSS, Shadcn/UI (basat en Radix UI).
- **Backend (BaaS)**: Supabase (PostgreSQL + Auth + RLS).
- **Gestió d'Estat**: TanStack Query (React Query) v5.
- **Formularis**: React Hook Form + Zod.
- **Drag & Drop**: @dnd-kit (per reordenar lots).
- **Icones**: Lucide React.

## 🏗️ Arquitectura i Estructura

El projecte segueix una arquitectura de Single Page Application (SPA) que consumeix directament l'API de Supabase.

### Estructura de Directoris Clau

```
src/
├── components/         # UI Components
│   ├── contracts/      # ContractCard, ContractList, ContractForm
│   ├── lots/           # LotList, LotItem (Memoized), LotForm
│   ├── credits/        # CreditList, CreditItem
│   └── ui/             # Shadcn primitives (Button, Input, etc.)
├── hooks/              # Custom Hooks
│   ├── useContracts.ts # Hook principal (Paginació, CRUD)
│   ├── useFilters.ts   # Context global de filtres
│   └── useCPVCodes.ts  # Cerca de codis CPV
├── lib/                # Core Logic
│   ├── contractService.ts # SERVEI PRINCIPAL (Supabase Client)
│   ├── supabase.ts     # Client instanciat
│   └── utils.ts        # Helpers (cn, formatters)
├── pages/              # Rutes (React Router)
│   ├── Index.tsx       # Dashboard principal
│   └── ContractDetail.tsx # Vista detallada
└── types/              # TypeScript Definitions
    └── index.ts        # Tipus derivats de DB (Supabase)
```

## 💾 Model de Dades (Supabase)

La base de dades és relacional (PostgreSQL). La jerarquia principal és:

`Contracte` 1:N `Lots` 1:N `Crèdits` 1:N `Factures`

### Entitats Principals

1.  **Contracts (`contracts`)**:
    *   Expedient marc. Camps clau: `contract_type`, `award_procedure`, `start_date`, `end_date`.
    *   Relació M:N amb `areas` i `centers` (taules pivot `contract_areas`, `contract_centers`).

2.  **Lots (`lots`)**:
    *   Unitat d'adjudicació.
    *   **Drag & Drop**: Camp `sort_order` per mantenir l'ordre visual.
    *   Relació amb `cpv_codes` (Vocabulari Comú de Contractació).

3.  **Credits (`credits`)**:
    *   Assignació pressupostària anual per lot.
    *   Camps clau: `organic_item`, `program_item`, `economic_item`.
    *   **Càlculs**: `credit_real` (camp calculat o emmagatzemat, veure lògica).

4.  **Invoices (`invoices`)**:
    *   Factures imputades a un crèdit.

## 🧠 Lògica de Negoci i "Gotchas" per a IA

Si ets una IA modificant aquest codi, tingues en compte:

### 1. Optimització de Rendiment (`contractService.ts`)
*   **Paginació**: `getContracts` utilitza paginació al servidor (`page`, `pageSize`). No intentis carregar tots els contractes de cop.
*   **Filtrat**: Els filtres de text (`search`), tipus i procediment s'apliquen a nivell de base de dades (Supabase `.eq()` o `.ilike()`).
*   **Càlculs**: El camp `credit_real_total` es calcula al client (TypeScript) després de rebre les dades de la pàgina actual.

### 2. Drag & Drop
*   Utilitzem `@dnd-kit`.
*   El component `LotItem` està **memoitzat** (`React.memo`) per evitar re-renders massius en moure un lot.
*   En actualitzar l'ordre, s'ha d'enviar `contract_id` i `name` a `updateLotOrder` per complir amb les restriccions d'unicitat de l'operació `upsert`.

### 3. Tipat (TypeScript)
*   Els tipus a `src/types/index.ts` estenen els tipus generats automàticament per Supabase (`src/integrations/supabase/types.ts`).
*   **NO** modifiquis manualment les interfícies base si pots regenerar els tipus de Supabase. Si no pots regenerar-los, actualitza `types.ts` manualment amb precaució.

### 4. Build System (Vite)
*   Configuració de `manualChunks` a `vite.config.ts` per separar llibreries grans (React, Supabase, Radix UI) i millorar la càrrega inicial.

## 🚀 Desenvolupament Local

1.  **Instal·lar**: `npm install`
2.  **Variables d'entorn**: `.env` amb `VITE_SUPABASE_URL` i `VITE_SUPABASE_PUBLISHABLE_KEY`.
3.  **Executar**: `npm run dev`

## 🧪 Scripts de Base de Dades

Les migracions es troben a `supabase/migrations`.
*   `20251123205500_add_lot_sort_order.sql`: Afegeix suport per reordenar lots.
*   `20251123163000_create_cpv_tables.sql`: Taula de codis CPV.
