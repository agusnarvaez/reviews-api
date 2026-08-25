import { env } from '../config/env.js'
import { AppError } from '../errors/AppError.js'
import { fetchReviews } from '../services/reviewsService.js'

const DEFAULT_LIMIT = 5
const DEFAULT_LANG = 'es'

export const getReviews = async (req, res, next) => {
  try {
    const { placeId, limit, minStars, lang } = req.query

    if (!placeId) {
      throw new AppError('placeId es requerido', {
        statusCode: 400,
        code: 'PLACE_ID_REQUIRED',
      })
    }

    if (!env.allowedPlaceIds.includes(placeId)) {
      throw new AppError('placeId no permitido', {
        statusCode: 400,
        code: 'PLACE_ID_NOT_ALLOWED',
      })
    }

    const payload = await fetchReviews(placeId, {
      limit: limit ? Number(limit) : DEFAULT_LIMIT,
      minStars: minStars ? Number(minStars) : 0,
      lang: lang || DEFAULT_LANG,
    })

    res.status(200).json(payload)
  } catch (error) {
    next(error)
  }
}
