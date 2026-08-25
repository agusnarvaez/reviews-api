import { env } from '../config/env.js'
import { AppError } from '../errors/AppError.js'

const PLACES_BASE_URL = 'https://places.googleapis.com/v1/places'
const FIELD_MASK = 'id,displayName,rating,userRatingCount,googleMapsUri,reviews'

const mapReview = (review) => ({
  author: review.authorAttribution?.displayName ?? 'Anónimo',
  avatar: review.authorAttribution?.photoUri ?? '',
  content: review.text?.text ?? review.originalText?.text ?? '',
  rating: review.rating ?? 0,
  time: review.publishTime ?? null,
  url: review.authorAttribution?.uri ?? '',
  // languageCode se usa para el filtro `lang` en reviewsService y no viaja en la respuesta pública.
  languageCode: review.text?.languageCode ?? review.originalText?.languageCode,
})

export const fetchPlaceReviews = async (placeId, lang) => {
  const url = `${PLACES_BASE_URL}/${placeId}?languageCode=${encodeURIComponent(lang)}&regionCode=AR`

  const response = await fetch(url, {
    headers: {
      'X-Goog-Api-Key': env.googlePlacesServerKey,
      'X-Goog-FieldMask': FIELD_MASK,
    },
  })

  if (!response.ok) {
    throw new AppError(`Places API respondió ${response.status}`, {
      statusCode: 502,
      code: 'PLACES_API_ERROR',
    })
  }

  const data = await response.json()

  return {
    source: 'places',
    placeId: data.id ?? placeId,
    rating: data.rating ?? null,
    totalCount: data.userRatingCount ?? 0,
    mapsUri: data.googleMapsUri ?? null,
    fetchedAt: new Date().toISOString(),
    reviews: (data.reviews ?? []).map(mapReview),
  }
}
