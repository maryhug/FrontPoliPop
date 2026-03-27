# PeliPop

Plataforma de catálogo y gestión de películas, construida con React + TypeScript + Vite en el frontend y conectada a servicios en la nube.

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Estilos | CSS Modules + Tailwind CSS |
| Routing | React Router v6 |
| Gráficas | Recharts |
| Base de datos principal | [Supabase (PostgreSQL)](https://supabase.com/dashboard/project/spogggeahzjlwgguzcye) |
| Base de datos NoSQL | [MongoDB Atlas](https://cloud.mongodb.com/v2/6918bbd950b2f105a74efa4a#/overview) |
| API de películas | [The Movie Database (TMDB)](https://www.themoviedb.org) |
| Backend | Spring Boot — `http://localhost:5000` |

---

## Inicio rápido

### Prerrequisitos

- Node.js >= 18
- npm >= 9

### Instalación

```bash
# Clona el repositorio
git clone <url-del-repo>
cd pelipop

# Instala dependencias
npm install

# Inicia el servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

> Asegúrate de tener el servidor backend corriendo en `http://localhost:5000` antes de usar el frontend en modo desarrollo.

---

## Scripts disponibles

```bash
npm run dev        # Servidor de desarrollo con HMR
npm run build      # Build de producción
npm run preview    # Vista previa del build
npm run lint       # Análisis estático con ESLint
```

---

## Estructura del proyecto

```
src/
├── assets/            # Imágenes y recursos estáticos
├── Components/        # Componentes reutilizables
├── pages/             # Vistas principales (Login, Register, Catalog…)
│   ├── admin/         # Panel de administración
│   └── catalog/       # Catálogo de películas
├── services/          # Lógica de llamadas a la API (api.ts, auth.ts)
├── Styles/            # Estilos globales
└── main.tsx           # Punto de entrada
```

---

## Servicios externos

### TMDB — The Movie Database

API utilizada para obtener información de películas, pósters y metadatos.

Para verificar que un ID de película es correcto, accede a:

```
https://www.themoviedb.org/movie/<ID_DE_LA_PELÍCULA>
```

### Supabase (PostgreSQL)

Base de datos relacional principal. Gestiona usuarios, listas y sesiones.

Dashboard: https://supabase.com/dashboard/project/spogggeahzjlwgguzcye

### MongoDB Atlas

Base de datos NoSQL utilizada para analíticas y datos no relacionales.

Dashboard: https://cloud.mongodb.com/v2/6918bbd950b2f105a74efa4a#/overview

---

## Plugins de Vite

Este proyecto soporta dos opciones de compilación con Fast Refresh:

| Plugin | Compilador |
|---|---|
| `@vitejs/plugin-react` | Babel |
| `@vitejs/plugin-react-swc` | SWC (más rápido) |

---

## ESLint — Configuración recomendada para producción

Para habilitar reglas con chequeo de tipos, actualiza `eslint.config.js`:

```js
import tseslint from 'typescript-eslint'
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      tseslint.configs.recommendedTypeChecked,
      reactX.configs['recommended-typescript'],
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
])
```

> El React Compiler no está habilitado por defecto debido a su impacto en el rendimiento durante el desarrollo. Consulta la [documentación oficial](https://react.dev/learn/react-compiler/installation) para activarlo.

---

## Licencia

© 2025 PeliPop. Todos los derechos reservados.
