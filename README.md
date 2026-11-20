# Radar Público

Prototipo para explorar oportunidades de contratación pública en Perú, revisar evidencias, estimar costos y preparar borradores de oferta. El catálogo, las bases y los antecedentes son ficticios. El perfil, las preferencias de alertas, las evidencias, los costos y los favoritos se guardan en el navegador.

## Desarrollo local

Usa Node.js 22. Desde la raíz, ejecuta cada comando en una terminal distinta.

```sh
npm --prefix backend start
npm --prefix frontend run dev
```

Abre `http://127.0.0.1:5173`. La API usa `http://localhost:3001` y puede usar otro puerto mediante `PORT`. Si cambias la dirección de la API, configura `PUBLIC_API_URL` antes de iniciar el frontend; la variable se lee durante la compilación.

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
