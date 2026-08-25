# reviews-api

Servicio propio de reseñas de Google. Reemplaza Elfsight: sin costo por vista, sin límite de
tráfico. Multi-tenant por diseño (`ALLOWED_PLACE_IDS` acepta varios IDs), en uso hoy solo por
pau-dallochio.

Estrategia híbrida: hoy sirve desde Places API (New) (`src/providers/places.js`, máx. 5 reseñas
por place). Cuando Google apruebe el acceso a Business Profile API, se suma
`src/providers/gbp.js` y se cambia el provider en `src/services/reviewsService.js` — el contrato
de respuesta y el frontend no cambian.

## Setup

```bash
npm install
cp .env.example .env   # completar GOOGLE_PLACES_SERVER_KEY y ALLOWED_PLACE_IDS
npm run dev
```

## Endpoint

```
GET /reviews?placeId=<ChIJ...>&limit=5&minStars=4&lang=es
```

`placeId` requerido y validado contra `ALLOWED_PLACE_IDS`. Cachea 24h en memoria por placeId; si
Google falla, sirve el último payload bueno con `"stale": true` en vez de error.

## Test

```bash
npm test
```

## Deploy (Fly.io)

```bash
fly secrets set GOOGLE_PLACES_SERVER_KEY=... ALLOWED_PLACE_IDS=...
fly deploy
```
