# Radar Público

Prototipo para explorar oportunidades de contratación pública en Perú, revisar evidencias, estimar costos y preparar borradores de oferta. El catálogo, las bases y los antecedentes son ficticios. El perfil, las preferencias de alertas, las evidencias, los costos y los favoritos se guardan en el navegador.

## Estructura

- `frontend/src/` contiene el código web. `frontend/dist/` se genera al compilar y se publica en Vercel.
- `backend/` contiene la API y el catálogo de demostración. Render ejecuta este directorio como un servicio Node.js.
- `scripts/` contiene el arranque conjunto para desarrollo local.

## Desarrollo local

Usa Node.js 22. Ejecuta estos comandos desde la raíz del repositorio.

```powershell
npm install
npm run dev
```

Abre `http://127.0.0.1:5173`. El mismo comando inicia la API en `http://localhost:3001`. Recarga la página para ver los cambios en los archivos del frontend. Pulsa `Ctrl+C` para detener ambos servicios.

- `npm run dev:frontend` y `npm run dev:backend` inician cada servicio por separado.
- `npm run build` genera `frontend/dist/`. La API se ejecuta directamente con Node.js.
- `npm run preview` sirve el frontend compilado en `http://127.0.0.1:5173`. Para probarlo con la API local, ejecuta `npm run dev:backend` en otra terminal.

`PORT` cambia el puerto de la API. `PUBLIC_API_URL` indica el origen de la API que consume el frontend. Se lee al iniciar el modo desarrollo o al ejecutar `npm run build`. Si pruebas una compilación con un puerto distinto de `3001`, define `$env:PUBLIC_API_URL` antes de compilar.

## Despliegue

1. Sube los archivos del proyecto al repositorio de GitHub.
2. En Render, crea un Blueprint desde el repositorio para usar `render.yaml`. Si creas un Web Service manualmente, selecciona `backend` como directorio raíz, `npm install` como comando de compilación, `npm start` como comando de inicio y `/api/health` como ruta de verificación.
3. En Vercel, importa el mismo repositorio y configura `frontend` como **Root Directory**. El archivo `vercel.json` configura el comando de compilación y el directorio de salida. Agrega `PUBLIC_API_URL` con el origen HTTPS de Render, por ejemplo `https://radar-publico-api.onrender.com`.
4. Opcionalmente, configura `FRONTEND_ORIGINS` en Render con los orígenes permitidos separados por comas, por ejemplo `https://radar-publico.vercel.app,http://127.0.0.1:5173`. Si se omite, la API de demostración permite peticiones desde cualquier origen.

## API

- `GET /api/health` comprueba el estado del servicio.
- `GET /api/opportunities` lista convocatorias. Acepta `q`, `region` y `category`.
- `GET /api/opportunities/:id` devuelve el expediente de ejemplo.
- `POST /api/opportunities/:id/review` recibe `{"evidence":{"experiencia":"Contrato 01"}}` y devuelve evidencias registradas y pendientes.
- `POST /api/estimate` recibe `{"lines":[{"name":"Personal","quantity":10,"unitCost":50}]}`. Un `unitCost` de `null` indica una partida pendiente de cotización.
- `POST /api/opportunities/:id/draft` recibe `{"profile":{"company":"Empresa Demo","ruc":"20123456789"},"evidence":{}}` y devuelve el texto editable del borrador.

Las integraciones con fuentes oficiales, la comparación de versiones de bases, el envío de alertas por correo, la persistencia compartida y el análisis con IA quedan pendientes. Las evidencias registradas son referencias declaradas y deben verificarse con el expediente oficial.
