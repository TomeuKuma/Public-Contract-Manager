# Gestor de Contratos Públicos (IMAS)

Este proyecto es una aplicación web moderna diseñada para optimizar la gestión y el seguimiento de los contratos públicos. Su objetivo principal es proporcionar una herramienta eficiente para administrar expedientes, visualizar detalles financieros y operativos, y mantener un control riguroso sobre la información contractual.

## 🎯 Finalidad del Proyecto

La aplicación busca centralizar la información de los contratos, facilitando a los gestores la toma de decisiones y el seguimiento administrativo. Permite:
- **Digitalizar la gestión** de expedientes de contratación.
- **Mejorar la transparencia** y el acceso a la información de los contratos.
- **Agilizar los procesos** de alta y consulta de expedientes.

## 🚀 Características Principales

- **Autenticación Segura**: Sistema de login para proteger el acceso a la información sensible.
- **Dashboard Interactivo**: Vista general con métricas y listados de contratos activos.
- **Gestión de Contratos**:
  - Creación de nuevos contratos con validación de datos.
  - Visualización detallada de cada expediente (importes, fechas, adjudicatarios).
  - Edición y actualización de la información contractual.
- **Interfaz Moderna**: Diseño limpio y responsivo para una mejor experiencia de usuario.

## 🛠️ Stack Tecnológico

El proyecto está construido utilizando tecnologías modernas de desarrollo web para asegurar rendimiento, escalabilidad y mantenibilidad:

- **Frontend Core**:
  - [React](https://react.dev/) - Biblioteca para construir interfaces de usuario.
  - [Vite](https://vitejs.dev/) - Entorno de desarrollo y empaquetador rápido.
  - [TypeScript](https://www.typescriptlang.org/) - Tipado estático para un código más robusto.

- **UI & Estilos**:
  - [Tailwind CSS](https://tailwindcss.com/) - Framework de utilidades CSS.
  - [Shadcn UI](https://ui.shadcn.com/) - Componentes de interfaz reutilizables y accesibles.
  - [Lucide React](https://lucide.dev/) - Iconos vectoriales ligeros.

- **Gestión de Estado y Datos**:
  - [TanStack Query](https://tanstack.com/query/latest) - Gestión de estado asíncrono y caché de datos.
  - [Supabase](https://supabase.com/) - Backend as a Service (Base de datos, Autenticación).

- **Formularios y Validación**:
  - [React Hook Form](https://react-hook-form.com/) - Manejo eficiente de formularios.
  - [Zod](https://zod.dev/) - Validación de esquemas de datos.

## 🏁 Comenzando

Sigue estos pasos para ejecutar el proyecto en tu entorno local:

### Prerrequisitos
- Node.js (versión 18 o superior recomendada)
- npm o yarn

### Instalación

1.  **Clonar el repositorio**:
    ```bash
    git clone <url-del-repositorio>
    cd expense-manager-imas-main
    ```

2.  **Instalar dependencias**:
    ```bash
    npm install
    ```

3.  **Configurar variables de entorno**:
    Crea un archivo `.env` en la raíz del proyecto y añade las credenciales necesarias (por ejemplo, conexión a Supabase).

4.  **Ejecutar el servidor de desarrollo**:
    ```bash
    npm run dev
    ```

La aplicación estará disponible en `http://localhost:8080` (o el puerto que indique la consola).

## 📄 Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo.
- `npm run build`: Construye la aplicación para producción.
- `npm run lint`: Ejecuta el linter para verificar la calidad del código.
- `npm run preview`: Vista previa de la build de producción.
