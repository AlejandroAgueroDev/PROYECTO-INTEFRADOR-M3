# FranquiciaChat — ComicSansCon 🎭

POC de una **Single Page Application** donde los usuarios chatean con personajes
ficticios usando **Google Gemini AI**, desarrollada para ComicSansCon (agencia
digital de experiencias interactivas para fans de videojuegos, películas y series).

**Stack:** HTML5 + CSS3 (mobile-first) + JavaScript vanilla + Axios + Vercel
Serverless Functions + Google Gemini API + Vitest. Sin frameworks de frontend.

## Personajes disponibles

| Personaje | Franquicia | Archivo de personalidad |
|---|---|---|
| 🧠 GLaDOS | Portal (videojuego) | `lib/personalities/glados.js` |
| 🟢 Yoda | Star Wars (película) | `lib/personalities/yoda.js` |
| 🐺 Geralt de Rivia | The Witcher (serie/videojuego) | `lib/personalities/geralt.js` |

Cada personaje tiene su **propio archivo** con su `systemPrompt`, y ese archivo
vive **solo en el servidor** (`/lib`, usado por `/api/chat.js`) — nunca se envía
al cliente, para no revelar cómo está "armado" el personaje.

## Estructura del proyecto

```
├── api/
│   └── chat.js              # Vercel Function: llama a Gemini de forma segura
├── lib/
│   └── personalities/
│       ├── glados.js        # Personalidad 1 (archivo propio)
│       ├── yoda.js          # Personalidad 2 (archivo propio)
│       ├── geralt.js        # Personalidad 3 (archivo propio)
│       └── index.js         # Agrupa las 3 personalidades
├── css/
│   ├── styles.css           # Layout, tipografía, header, vistas, chat
│   └── cards.css            # CSS específico de las tarjetas de personaje
├── js/
│   ├── app.js                # Bootstrap + render de cada vista
│   ├── router.js             # Router SPA (History API) — testeable
│   ├── chat.js                # Lógica de la vista de chat
│   ├── characters.js         # Metadatos de personajes para la UI (sin prompts)
│   └── utils.js               # Fetch a la API, transformación, localStorage
├── tests/
│   ├── utils.test.js
│   ├── router.test.js
│   ├── characters.test.js
│   └── api-chat.test.js       # Testea la Vercel Function mockeando fetch
├── index.html
├── vercel.json                 # Rewrites para el SPA routing + /api
├── package.json
├── vitest.config.js
├── .env.example
└── .gitignore
```

## Rutas de la SPA

- `/home` (y `/`) — Bienvenida + preview de personajes
- `/characters` — Galería completa de personajes (extra: selección múltiple)
- `/chat/:id` — Chat con el personaje elegido (ej: `/chat/glados`)
- `/about` — Info del proyecto y stack técnico

Toda la navegación usa `history.pushState` / `popstate`, sin recargar la página.

## Funcionalidades implementadas

**Requeridas:**
- ✅ Interfaz responsive mobile-first (breakpoints: 600px tablet, 1024px desktop)
- ✅ Routing SPA con History API, botones back/forward funcionando
- ✅ Fetch a la API con async/await, manejo de errores y estado de carga
- ✅ Separación fetching / transformación / render (`utils.js` vs `chat.js`)
- ✅ System prompt por personaje, API key oculta en Vercel Function
- ✅ Tests unitarios con Vitest mockeando axios/fetch

**Extra credit implementado:**
- ✅ Persistencia con `localStorage` (por personaje) + botón "Borrar historial" + badge visual de "historial guardado"
- ✅ Galería de 3 personajes con tarjetas visuales y system prompt propio por archivo
- ✅ Timestamps en mensajes, indicador de "escribiendo…" animado, Enter para enviar, botón de copiar respuesta, modo oscuro/claro con toggle

## Cómo correr en local

```bash
pnpm install
```

### Opción A: con Vercel CLI (recomendado, corre también la Function)

```bash
pnpm add -g vercel   # si no la tenés instalada
cp .env.example .env
# Completá GEMINI_API_KEY en .env con tu key real de https://aistudio.google.com/app/apikey
vercel dev
```

Abrí `http://localhost:3000`.

> ⚠️ Corré **`vercel dev` directamente**, no `pnpm dev` / `npm run dev`. El
> `package.json` a propósito **no** tiene un script `dev` que llame a `vercel
> dev`, porque si en el dashboard de Vercel (Project Settings → Development
> Command) queda configurado como `pnpm dev`, se genera una invocación
> recursiva (`pnpm dev` → `vercel dev` → intenta correr el Development
> Command → `pnpm dev` → ...) y falla con
> `Error: vercel dev must not recursively invoke itself`.
> Si ya te pasó eso: andá a tu proyecto en vercel.com → **Settings → General
> → Development Command**, dejalo vacío/override apagado (o en el CLI,
> asegurate de que `.vercel/project.json` no tenga ese override), y listo.

### Opción B: solo frontend (sin backend funcional)

Podés abrir `index.html` con un servidor estático (ej. extensión "Live Server"),
pero el chat no va a poder llamar a `/api/chat` sin `vercel dev` corriendo.

## Tests

```bash
pnpm test          # corre toda la suite una vez
pnpm test:watch    # modo watch
```

Los tests mockean `axios` y `global.fetch`, así que corren sin red y sin
necesitar una API key real.

## Deploy en Vercel — paso a paso

1. **Subí el proyecto a GitHub** (repo nuevo, `git init` + `git add .` + `git commit` + `git push`).
2. Entrá a [vercel.com](https://vercel.com) → **Add New... → Project** → importá el repo de GitHub.
3. Framework Preset: dejalo en **Other** (no hay build step, es HTML/CSS/JS plano).
4. En **Environment Variables**, agregá:
   - `GEMINI_API_KEY` = tu API key real de Gemini (nunca la subas al repo).
5. Deploy. Vercel va a detectar automáticamente `api/chat.js` como Serverless Function.
6. Una vez desplegado, probá:
   - Que las 3 rutas (`/home`, `/characters`, `/about`) carguen bien navegando directo por URL (gracias a los `rewrites` de `vercel.json`).
   - Que el chat responda de verdad (confirma que la Function y la env var están OK).
   - Que recargar la página en `/chat/glados` no rompa (SPA fallback funcionando).

## Notas de seguridad

- La `GEMINI_API_KEY` **nunca** se expone al cliente: solo existe como variable
  de entorno del lado del servidor, leída dentro de `api/chat.js`.
- Los `systemPrompt` de cada personaje también quedan en el servidor (`/lib`);
  el cliente solo recibe metadatos visuales (`js/characters.js`).
- Se usan `safetySettings` de Gemini para moderar contenido, y el prompt de
  cada personaje pide explícitamente evitar contenido dañino.

## Licencia / uso

Proyecto educativo (POC) creado por ComicSansCon. Los personajes referenciados
pertenecen a sus respectivas franquicias (Valve, Lucasfilm/Disney, CD Projekt
Red); este proyecto no reproduce diálogos ni contenido protegido de esas obras,
solo recrea un estilo de personalidad para fines de demostración.
