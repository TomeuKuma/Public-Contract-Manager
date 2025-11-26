# Walkthrough: Extracción Automática de Datos desde PDF con IA

He implementado exitosamente la funcionalidad de extracción automática de datos desde PDFs de resoluciones de adjudicación usando Gemini AI.

## ⚠️ Problema Resuelto: Página en Blanco

**Causa**: La librería `pdf-parse` no funciona en navegadores porque depende de APIs de Node.js (`Buffer`, módulos nativos).

**Solución**: Reemplazado `pdf-parse` por `pdfjs-dist`, que es la librería oficial de Mozilla para trabajar con PDFs en el navegador.

### Cambios Realizados
- ❌ Desinstalado: `pdf-parse`
- ✅ Instalado: `pdfjs-dist`
- ✅ Actualizado: `src/lib/pdfExtractionService.ts` para usar `pdfjs-dist`

## Archivos Creados

### 1. [src/lib/pdfExtractionService.ts](file:///c:/Users/Kuma/Documents/IMAScontrol/expense-manager-imas-main/src/lib/pdfExtractionService.ts)
**Servicio principal de extracción**:
- `extractTextFromPDF()`: Extrae texto del PDF usando `pdfjs-dist` (compatible con navegador)
- `extractContractDataFromPDF()`: Envía el texto a Gemini 2.0 Flash y parsea la respuesta JSON
- Prompt engineering optimizado para contratos del IMAS
- Validación de datos extraídos y manejo de errores específicos

### 2. [src/hooks/useCatalogMapping.ts](file:///c:/Users/Kuma/Documents/IMAScontrol/expense-manager-imas-main/src/hooks/useCatalogMapping.ts)
**Hook para mapeo de catálogos**:
- Carga áreas y centros con TanStack Query (caché de 1 hora)
- `findClosestMatch()`: Búsqueda por similitud de texto
- `findMultipleMatches()`: Mapeo de arrays de nombres a IDs
- Retorna `null` si no hay match (usuario selecciona manualmente)

### 3. [src/components/forms/PDFExtractionModal.tsx](file:///c:/Users/Kuma/Documents/IMAScontrol/expense-manager-imas-main/src/components/forms/PDFExtractionModal.tsx)
**Modal de interfaz de usuario**:
- Upload de PDF con validación de tipo
- Botón "Extraure Dades" con loading state
- Preview detallado de datos extraídos:
  - Expedient, fecha, objecte
  - Tipo y procedimiento
  - Lots detectados con proveedor y fechas
- Manejo de errores con mensajes específicos
- Botón "Aplicar al Formulari" para confirmar

### 4. [src/pages/NewContract.tsx](file:///c:/Users/Kuma/Documents/IMAScontrol/expense-manager-imas-main/src/pages/NewContract.tsx) (Modificado)
**Integración en formulario existente**:
- Botón "Importar des de PDF" en la parte superior
- Handler `handlePDFDataExtracted()` que rellena:
  - Nombre del contracte
  - Número de expedient
  - Tipo contractual
  - Procedimiento de adjudicación
  - Objecte
  - Áreas y centros seleccionados
- Toast de confirmación con instrucciones

## Flujo de Usuario

1. Usuario hace clic en **"Importar des de PDF"** en el formulario de nuevo contracte
2. Se abre el modal de extracción
3. Usuario selecciona un PDF de resolución de adjudicación
4. Click en **"Extraure Dades"**
5. **Procesamiento** (5-10 segundos):
   - Extracción de texto del PDF usando pdfjs-dist
   - Envío a Gemini AI
   - Parseo de respuesta JSON
6. **Preview** de datos extraídos:
   - Expedient: `2022/143/CSER`
   - Objecte: "servei de cuina menjador..."
   - Lots: 1 detectado
   - Proveedor: "Rossello y Piña S.L"
7. Click en **"Aplicar al Formulari"**
8. Campos del formulario se rellenan automáticamente
9. Usuario revisa y completa información faltante
10. Guarda el contracte normalmente

## Datos Extraídos

### Del Contracte
- ✅ Expedient (formato: YYYY/NNN/XXXX)
- ✅ Objecte/Título
- ✅ Tipo contractual (Obra/Servei/Subministrament)
- ✅ Procedimiento de adjudicación
- ✅ Fecha de adjudicación (ISO format)
- ✅ Áreas mencionadas (mapeadas a IDs)
- ✅ Centros mencionados (mapeados a IDs)

### De Cada Lot
- ✅ Nombre del lot
- ✅ Descripción CPV
- ✅ Proveedor (nombre y CIF)
- ✅ Fechas (formalización, inicio, fin)
- ✅ Si es prorrogable

> [!IMPORTANT]
> Los **lots** se muestran en el preview pero **NO se crean automáticamente** en la base de datos. El usuario debe añadirlos manualmente después de crear el contracte. Esto es por diseño, ya que el formulario actual no soporta creación de múltiples lots en un solo paso.

## Tecnología Utilizada

- **Gemini 2.0 Flash Exp**: Modelo de IA gratuito de Google
- **pdfjs-dist**: Librería oficial de Mozilla para PDFs en navegador
- **TanStack Query**: Caché de catálogos (áreas, centros)
- **Shadcn/UI**: Componentes del modal

## Coste

**$0.00** - Gemini 2.0 Flash está en tier gratuito:
- 15 requests/minuto
- 1,500 requests/día
- Suficiente para ~50 contractes/mes

## Manejo de Errores

| Error | Mensaje |
|-------|---------|
| Archivo no es PDF | "Per favor, selecciona un arxiu PDF vàlid" |
| PDF escaneado sin texto | "El PDF no contiene texto extraíble..." |
| API key inválida | "Error de configuración: API key de Gemini inválida" |
| Límite de API excedido | "Límite de API excedido. Intenta de nuevo..." |
| JSON inválido | "Error al procesar la respuesta de IA..." |

## Próximos Pasos Sugeridos

1. **Probar con PDFs reales** del IMAS
2. **Ajustar prompt** si la extracción no es precisa
3. **Añadir badges visuales** para campos auto-completados
4. **Implementar creación automática de lots** (requiere refactorizar formulario)
5. **Añadir extracción de importes económicos** (si están en el PDF)
