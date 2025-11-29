# Registre de Canvis (Changelog)

Tots els canvis notables en aquest projecte es documentaran en aquest fitxer.

## [Unreleased]

### Afegit
- **Explotació de Dades**:
  - **Verificació de Fraccionament**: Nova taula detallada amb visió jeràrquica (Lotes -> Crèdits -> Factures).
  - **Exportació Excel**: Funcionalitat per descarregar les dades de l'anàlisi de fraccionament en format `.xlsx`, incloent número d'expedient i partides pressupostàries.
- **Nous Camps de Contracte**:
  - `need_to_satisfy` ("Necessitat a satisfer"): Camp de text per justificar la necessitat del contracte.
  - `observations` ("Observacions"): Camp de text lliure per a notes addicionals.
- **Lots Prorrogables**: Ara es pot marcar un lot com a prorrogable, habilitant camps per a dates de pròrroga i termini de comunicació.
- **Crèdits Modificables**: Ara es pot marcar un contracte com a modificable, permetent afegir modificacions de crèdit als lots.
- **Càlculs Automàtics**:
  - Càlcul del percentatge de modificació en crèdits.
  - Càlcul del crèdit real (Compromès + Modificació - Reconegut).
- **Noves Utilitats**:
  - `src/lib/constants.ts`: Centralització de constants (òrgans de contractació, procediments, etc.).
  - `src/lib/formatters.ts`: Funcions per formatar divises i dates.
  - `src/lib/calculations.ts`: Lògica de càlculs financers.
- **Custom Hooks**: `useContracts`, `useLots`, `useCredits`, `useInvoices`, `useFilters` per millorar la gestió de l'estat.

### Canviat
- **Refactorització de ContractDetail**: Es va dividir el component monolític `ContractDetail.tsx` en sub-components més petits i reutilitzables:
  - `ContractHeader`: Capçalera amb informació general i accions.
  - `LotList`: Llistat de lots amb acordió.
  - `LotItem`: Detall de cada lot.
  - `CreditList`: Llistat de crèdits dins d'un lot.
  - `InvoiceList`: Llistat de factures dins d'un crèdit.
- **Actualització de Tipus**: S'han actualitzat les interfícies TypeScript a `src/types/index.ts` per coincidir amb l'esquema de la base de dades Supabase (camps en anglès/català segons DB).
- **Millora de Formularis**: Els diàlegs d'edició (`ContractEditDialog`, `LotFormDialog`, etc.) ara utilitzen tipus estrictes i constants centralitzades.

### Corregit
- **Errors de Tipus**: Resolució de múltiples errors de tipus TypeScript i incompatibilitats amb la resposta de Supabase.
- **Camps Condicionals**: Correcció de la lògica per mostrar/amagar camps segons si el contracte és prorrogable o modificable.
- **Neteja de Dades**: Implementació de lògica per netejar dades relacionades (ex: dates de pròrroga) quan es desmarca l'opció corresponent.
