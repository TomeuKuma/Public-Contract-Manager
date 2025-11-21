# Gestor de Contractes Públics (IMAS)

Aquest projecte és una aplicació web moderna dissenyada per optimitzar la gestió i el seguiment dels contractes públics de les Administracions. El seu objectiu principal és proporcionar una eina eficient per administrar expedients, visualitzar detalls financers i operatius, i mantenir un control rigorós sobre la informació contractual.

## 🎯 Finalitat del Projecte

L'aplicació busca centralitzar la informació dels contractes, facilitant als gestors la presa de decisions i el seguiment administratiu. Permet:
- **Digitalitzar la gestió** d'expedients de contractació.
- **Millorar la transparència** i l'accés a la informació dels contractes.
- **Agilitzar els processos** d'alta i consulta d'expedients.

## 🚀 Característiques Principals

- **Autenticació Segura**: Sistema de login per protegir l'accés a la informació sensible.
- **Dashboard Interactiu**: Vista general amb mètriques i llistats de contractes actius.
- **Gestió de Contractes**:
  - Creació de nous contractes amb validació de dades.
  - **Lots Prorrogables**: Gestió de pròrrogues amb dates i terminis de comunicació.
  - **Crèdits Modificables**: Càlcul automàtic de percentatges de modificació i crèdit real.
  - Visualització detallada de cada expedient (lots, crèdits, factures).
  - Edició i actualització de la informació contractual.
- **Interfície Moderna**: Disseny net i responsiu per a una millor experiència d'usuari.

## 🛠️ Stack Tecnològic

El projecte està construït utilitzant tecnologies modernes de desenvolupament web per assegurar rendiment, escalabilitat i mantenibilitat:

- **Frontend Core**:
  - [React](https://react.dev/) - Biblioteca per construir interfícies d'usuari.
  - [Vite](https://vitejs.dev/) - Entorn de desenvolupament i empaquetador ràpid.
  - [TypeScript](https://www.typescriptlang.org/) - Tipat estàtic per un codi més robust.

- **UI & Estils**:
  - [Tailwind CSS](https://tailwindcss.com/) - Framework d'utilitats CSS.
  - [Shadcn UI](https://ui.shadcn.com/) - Components d'interfície reutilitzables i accessibles.
  - [Lucide React](https://lucide.dev/) - Icones vectorials lleugeres.

- **Gestió d'Estat i Dades**:
  - [TanStack Query](https://tanstack.com/query/latest) - Gestió d'estat asíncron i caché de dades.
  - [Supabase](https://supabase.com/) - Backend as a Service (Base de dades, Autenticació).

- **Formularis i Validació**:
  - [React Hook Form](https://react-hook-form.com/) - Maneig eficient de formularis.
  - [Zod](https://zod.dev/) - Validació d'esquemes de dades.

## 📂 Estructura del Projecte

```
src/
├── components/         # Components reutilitzables
│   ├── contracts/      # Components específics de contractes
│   ├── lots/           # Components específics de lots
│   ├── credits/        # Components específics de crèdits
│   ├── invoices/       # Components específics de factures
│   ├── forms/          # Formularis (Diàlegs)
│   └── ui/             # Components base (Shadcn)
├── hooks/              # Custom hooks (useContracts, useLots, etc.)
├── lib/                # Utilitats, constants i serveis
├── pages/              # Pàgines principals (Rutes)
└── types/              # Definicions de tipus TypeScript
```

## 🏁 Començant

Segueix aquests passos per executar el projecte en el teu entorn local:

### Prerrequisits
- Node.js (versió 18 o superior recomanada)
- npm o yarn

### Instal·lació

1.  **Clonar el repositori**:
    ```bash
    git clone https://github.com/TomeuKuma/Public-Contract-Manager
    cd expense-manager-imas-main
    ```

2.  **Instal·lar dependències**:
    ```bash
    npm install
    ```

3.  **Configurar variables d'entorn**:
    Crea un arxiu `.env` a l'arrel del projecte i afegeix les credencials necessàries (per exemple, connexió a Supabase).

4.  **Executar el servidor de desenvolupament**:
    ```bash
    npm run dev
    ```

L'aplicació estarà disponible a `http://localhost:8080` (o el port que indiqui la consola).

## 📄 Scripts Disponibles

- `npm run dev`: Inicia el servidor de desenvolupament.
- `npm run build`: Construeix l'aplicació per a producció.
- `npm run lint`: Executa el linter per verificar la qualitat del codi.
- `npm run preview`: Vista prèvia de la build de producció.
