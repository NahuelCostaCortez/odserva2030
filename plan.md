# Plan de publicación en Vercel

Esta carpeta (`odserva2030-vercel`) contiene la versión mínima y autosuficiente de la web para publicar en Vercel.

## Archivos incluidos

- `src/`: páginas, componentes, scripts y contenido Astro.
- `public/`: datos, CSVs e imágenes necesarias en runtime.
- `package.json` y `package-lock.json`: dependencias y scripts.
- `astro.config.mjs` y `tsconfig.json`: configuración del proyecto.
- `.gitignore`: exclusiones para no subir dependencias ni builds locales.

## Verificación local

Desde esta carpeta:

```bash
cd odserva2030-vercel
npm install
npm run build
npm run dev
```

La web debería estar disponible en:

```bash
http://localhost:4321/
```

## Crear el repositorio

Desde esta carpeta:

```bash
git init
git add .
git commit -m "Publicar web ODServa2030"
```

Luego crea un repositorio vacío en GitHub, GitLab o Bitbucket y conecta el remoto:

```bash
git remote add origin <URL_DEL_REPOSITORIO>
git branch -M main
git push -u origin main
```

## Publicar en Vercel

1. Entra en https://vercel.com.
2. Pulsa `Add New...` y luego `Project`.
3. Importa el repositorio que acabas de subir.
4. Configura el proyecto así:
   - Framework Preset: `Astro`.
   - Build Command: `npm run build`.
   - Output Directory: `dist`.
   - Install Command: `npm install`.
5. Pulsa `Deploy`.

## Actualizaciones futuras

Cuando cambies la web:

```bash
git add .
git commit -m "Actualizar web"
git push
```

Vercel desplegará automáticamente cada push a `main`.

## Notas

- No subas `node_modules`, `dist`, `.astro` ni `.vercel`.
- La web está configurada como sitio estático de Astro, así que no necesita servidor Node en producción.
- Si más adelante añades variables de entorno, configúralas en `Project Settings > Environment Variables` dentro de Vercel.
