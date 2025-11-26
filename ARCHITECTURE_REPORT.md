# Informe de Análisis de Arquitectura - IMAS Contract Manager

## 1. ANÁLISIS DE ARQUITECTURA

### Separación de Responsabilidades
*   **Estado Actual**: Mejorable.
*   **Hallazgos**:
    *   Existe una capa de servicios (`src/lib/contractService.ts`), pero mezcla la obtención de datos con lógica de negocio compleja (filtrado en cliente, cálculo de totales).
    *   Los componentes de UI (ej. `ContractEditDialog`) realizan llamadas directas a Supabase (`fetchAreasAndCenters`), acoplando la vista con la infraestructura de datos.
*   **Recomendación**: Centralizar toda la lógica de datos en hooks personalizados (ej. `useMasterData`) y servicios puros.

### Responsabilidad de Componentes
*   **Hallazgos**:
    *   `ContractCard` asume demasiada responsabilidad de cálculo. Realiza iteraciones pesadas (`reduce` anidados) para calcular totales y porcentajes dentro del renderizado.
*   **Impacto**: Bloqueo del hilo principal en listas largas y re-renders costosos.

### Estructura de Carpetas
*   **Estado**: ✅ Correcta.
*   **Detalle**: La estructura `components`, `hooks`, `lib`, `pages`, `types` es estándar y escalable para este tipo de proyecto.

## 2. OPTIMIZACIÓN DE RENDIMIENTO

### Memoización (Prioridad Alta)
*   **`ContractCard.tsx`**: Los cálculos de `totalCreditReal`, `totalCreditCommitted`, `executionPercentage` se ejecutan en cada render.
    *   **Acción**: Envolver en `useMemo` o pre-calcular en backend.
*   **`ContractEditDialog.tsx`**: La obtención de áreas y centros se repite cada vez que se abre el diálogo.

### Queries de Supabase
*   **Estado**: ⚠️ Crítico.
*   **Hallazgos**: `getContracts` hace un `select('*')` con múltiples `inner joins` y trae **todos** los lotes y créditos anidados.
*   **Solución**: Crear una vista SQL (`contracts_summary`) que devuelva los totales ya calculados, evitando traer todo el árbol de datos al frontend para la vista de lista.

### Paginación y Filtrado
*   **Estado**: ⚠️ Roto/Ineficiente.
*   **Hallazgos**: El filtro por años (`selectedYears`) se aplica en el **cliente** después de recibir la página de la base de datos.
*   **Consecuencia**: Resultados inconsistentes (páginas vacías) y descarga innecesaria de datos.

## 3. GESTIÓN DE ESTADO

### TanStack Query
*   **Estado**: ⛔ Incorrecto.
*   **Hallazgos**: Aunque `QueryClientProvider` está configurado, `useContracts.ts` utiliza `useState` + `useEffect` manual.
*   **Impacto**: Pérdida de caché, reintentos automáticos, deduplicación de peticiones y actualizaciones en segundo plano.

### Estado Local vs Global
*   Datos maestros como "Áreas" y "Centros" se piden localmente en cada componente. Deberían ser "Server State" cacheados globalmente.

## 4. TIPADO Y SEGURIDAD

### Tipado
*   **Estado**: ⚠️ Débil en puntos clave.
*   **Hallazgos**: Uso de `any` en `contractService.ts` (`processedData?.map((contract: any) => ...`). Esto anula la seguridad de TypeScript.

### Validación
*   **Estado**: ⚠️ Insuficiente.
*   **Hallazgos**: Los formularios (`ContractEditDialog`) usan `react-hook-form` pero sin esquema de validación (Zod). Se confía en validaciones HTML básicas.

## 5. MANTENIBILIDAD

### Testing
*   **Estado**: ⛔ Inexistente.
*   **Hallazgos**: No hay configuración de tests ni archivos `.test.ts`.

### Documentación
*   Falta JSDoc en funciones con lógica compleja (ej. `getContracts`).

### Duplicación (DRY)
*   La lógica de carga de datos maestros está repetida en múltiples formularios.

## 6. BUENAS PRÁCTICAS

*   ✅ **Componentes Funcionales**: Uso correcto.
*   ✅ **UI Libraries**: Buen uso de Shadcn/UI y Tailwind.
*   ❌ **Manejo de Errores**: Falta de Error Boundaries.
*   ❌ **Async/Await**: Mezcla de `try/catch` con estados manuales propensa a condiciones de carrera.

---

## PLAN DE ACCIÓN RECOMENDADO

1.  **Migración a TanStack Query**: Refactorizar `useContracts` para eliminar `useState` manual.
2.  **Optimización de Base de Datos**: Crear Vista SQL para totales de contratos.
3.  **Corrección de Filtrado**: Mover lógica de años al backend.
4.  **Validación Robusta**: Implementar Zod en formularios.
5.  **Optimización UI**: Memoizar cálculos en `ContractCard`.
