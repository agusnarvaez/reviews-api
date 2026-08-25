import dotenv from 'dotenv'

dotenv.config()

const DEFAULT_CORS_ORIGINS = [
  'https://bapps.com.ar',
  'https://www.bapps.com.ar',
  'https://bapps-803f0.web.app',
  'https://bapps-803f0.firebaseapp.com',
  'https://pauladallochio.com.ar',
  'https://www.pauladallochio.com.ar',
  'https://veritokillian.ar',
  'https://www.veritokillian.ar',
  'https://mendezprop.com.ar',
  'https://azimap.bapps.com.ar',
]

const normalizeOrigin = (origin) => origin.replace(/\/$/, '')

const parseOrigins = (origins) => {
  if (!origins) {
    return DEFAULT_CORS_ORIGINS
  }

  return origins
    .split(',')
    .map((origin) => normalizeOrigin(origin.trim()))
    .filter(Boolean)
}

const getFirstDefinedEnv = (...keys) => {
  for (const key of keys) {
    if (process.env[key]) {
      return process.env[key]
    }
  }

  return ''
}

const parsePlaceIds = (ids) =>
  (ids ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)

export const env = {
  port: Number(process.env.PORT) || 3000,
  corsOrigins: parseOrigins(process.env.CORS_ALLOWED_ORIGINS),
  googlePlacesServerKey: getFirstDefinedEnv('GOOGLE_PLACES_SERVER_KEY'),
  allowedPlaceIds: parsePlaceIds(process.env.ALLOWED_PLACE_IDS),
  // ponytail: tope 30 días por ToS de Google Maps Platform, default 24h.
  cacheTtlMs: Number(process.env.CACHE_TTL_MS) || 24 * 60 * 60 * 1000,
}

export const normalizeRequestOrigin = normalizeOrigin
