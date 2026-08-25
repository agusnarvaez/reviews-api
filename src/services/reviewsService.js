import { env } from '../config/env.js'
import { fetchPlaceReviews } from '../providers/places.js'

// ponytail: Map en memoria alcanza — 1 place, 1 máquina con min_machines_running=1.
// Si algún día hay muchos places o varias máquinas, mover a Redis/Upstash.
// La key es solo placeId (sin lang): asume un idioma por place, válido mientras
// el consumidor sea pau-dallochio (siempre 'es'). Si algún día un mismo place
// necesita servirse en varios idiomas, la key pasa a ser `${placeId}:${lang}`.
const cache = new Map()

const applyFilters = (payload, { limit, minStars, lang }) => {
  const reviews = payload.reviews
    .filter((review) => review.content.trim().length > 0)
    .filter((review) => review.rating >= minStars)
    .filter(
      (review) =>
        !review.languageCode || review.languageCode.toLowerCase().startsWith(lang.toLowerCase())
    )
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, limit)
    .map(({ languageCode, ...review }) => review)

  return { ...payload, reviews }
}

export const fetchReviews = async (placeId, options) => {
  const cached = cache.get(placeId)
  const isFresh = cached && Date.now() - cached.fetchedAtMs < env.cacheTtlMs

  if (isFresh) {
    return applyFilters({ ...cached.payload, stale: false }, options)
  }

  try {
    const payload = await fetchPlaceReviews(placeId, options.lang)
    cache.set(placeId, { payload, fetchedAtMs: Date.now() })
    return applyFilters({ ...payload, stale: false }, options)
  } catch (error) {
    if (cached) {
      return applyFilters({ ...cached.payload, stale: true }, options)
    }
    throw error
  }
}
