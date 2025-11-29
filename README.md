# IMAS Contract Manager

Sistema de gestión de contratos públicos para el IMAS (Institut Mallorquí d'Afers Socials). Esta aplicación SPA permite el seguimiento integral del ciclo de vida de los contratos, desde la licitación hasta la facturación.

## 🛠️ Tech Stack

-   **Frontend**: React 18 + TypeScript + Vite
-   **Estilos**: Tailwind CSS + Shadcn/UI + Radix UI
-   **Estado & Caché**: TanStack Query v5 (React Query)
-   **Formularios**: React Hook Form + Zod (Validación)
-   **Backend**: Supabase (PostgreSQL + Auth + RLS + Edge Functions)
-   **Fechas**: date-fns

## 🏗️ Arquitectura

El proyecto sigue una arquitectura modular basada en características y capas de responsabilidad.

### Estructura de Directorios

```
src/
├── components/         # Componentes de UI reutilizables
│   ├── forms/          # Formularios de negocio (Dialogs)
│   ├── ui/             # Componentes base (Shadcn)
│   └── ...
├── hooks/              # Custom Hooks
│   ├── useContracts.ts # Lógica de contratos (TanStack Query)
│   ├── useMasterData.ts# Datos maestros (Áreas, Centros)
│   └── ...
├── lib/                # Utilidades y configuración
│   ├── contractService.ts # Servicios de API (Supabase)
│   ├── schemas.ts      # Esquemas de validación Zod
│   └── utils.ts        # Helpers generales
├── pages/              # Vistas principales (Rutas)
├── types/              # Definiciones de tipos TypeScript (Supabase + Frontend)
└── integrations/       # Configuración de clientes externos (Supabase)
```

### Patrones Clave

1.  **Server State Management**: Utilizamos **TanStack Query** para todo el estado que proviene del servidor. Evitamos `useEffect` manuales para fetching de datos.
    *   Uso de `useInfiniteQuery` para listas paginadas.
    *   Uso de `useQuery` con `staleTime` largo para datos maestros (Áreas, Centros).
2.  **Validación**: Todos los formularios deben usar **React Hook Form** integrado con **Zod** (`src/lib/schemas.ts`).
3.  **Base de Datos como Fuente de Verdad**: La lógica de filtrado complejo y agregación se delega a **PostgreSQL** (Vistas y RPCs) siempre que es posible para mantener el frontend ligero.
4.  **Componentes Puros**: Se prioriza la memoización (`React.memo`, `useMemo`) en componentes de lista como `ContractCard` para evitar re-renders innecesarios.

## 📊 Explotación de Datos

El sistema incluye un módulo de análisis de datos para la toma de decisiones:

### Verificación de Fraccionamiento
Herramienta para detectar posibles fraccionamientos de contratos.
- **Gráfico Interactivo**: Visualización de crédito comprometido por órgano de contratación.
- **Tabla Detallada**: Desglose jerárquico de Lotes -> Créditos -> Facturas.
- **Exportación Excel**: Descarga de informes detallados en formato `.xlsx` incluyendo número de expediente y partidas presupuestarias.

## 💾 Modelo de Datos

La jerarquía de datos es la siguiente:

`Contracte` (Contrato Marco)
├── `Lots` (Lotes específicos)
│   └── `Credits` (Asignaciones presupuestarias anuales)
│       └── `Factures` (Ejecución real del gasto)
└── Campos Adicionales:
    ├── `need_to_satisfy` (Necesidad a satisfacer)
    └── `observations` (Observaciones generales)

*   **Relaciones**:
    *   Un Contrato tiene múltiples Lotes.
    *   Un Lote tiene múltiples Créditos (uno por año/partida).
    *   Un Crédito tiene múltiples Facturas.
    *   Contratos <-> Áreas/Centros (Relación N:M).

## 🚀 Setup de Desarrollo

1.  **Instalar dependencias**:
    ```bash
    npm install
    ```

2.  **Configurar Variables de Entorno**:
    Crear `.env` con:
    ```env
    VITE_SUPABASE_URL=tu_url_supabase
    VITE_SUPABASE_ANON_KEY=tu_key_anonima
    ```

3.  **Correr servidor local**:
    ```bash
    npm run dev
    ```

## 🤖 Guía para Agentes de IA

Si eres un agente de IA encargado de mantener o extender este código, sigue estas reglas estrictas:

1.  **No uses `any`**: El proyecto tiene un tipado fuerte. Usa los tipos generados en `src/integrations/supabase/types.ts` o extiende interfaces en `src/types/`.
2.  **TanStack Query es Mandatorio**: Para cualquier nueva lectura de datos, crea un hook en `src/hooks/` usando `useQuery` o `useMutation`. No uses `fetch` o `supabase.from().select()` directamente en componentes.
3.  **Validación Zod**: Si creas un formulario, DEBES definir su esquema en `src/lib/schemas.ts`.
4.  **Optimización SQL**: Si una vista requiere muchos `join` o agregaciones, sugiere crear una `VIEW` o función `RPC` en Supabase en lugar de procesar en JavaScript.
5.  **Memoización**: Si modificas componentes que se renderizan en listas (como tarjetas o filas de tabla), verifica si necesitan `React.memo`.

### Scripts Útiles
-   `npm run lint`: Verificar reglas de linter.
-   `npm run build`: Construir para producción.

## 🔄 Estado Actual (Mejoras Recientes)
-   [x] Migración a TanStack Query para gestión de contratos.
-   [x] Implementación de validación Zod en edición de contratos.
-   [x] Optimización de `ContractCard` con memoización.
-   [x] Creación de migración SQL para optimización de queries (`supabase/migrations/`).
-   [x] **Nuevos Campos**: "Necessitat a satisfer" y "Observacions" en contratos.
-   [x] **Verificación de Fraccionamiento**: Tabla detallada con exportación a Excel.
