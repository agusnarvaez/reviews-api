import { Router } from 'express'

import { getReviews } from '../controllers/reviewsController.js'

const router = Router()

router.get('/', getReviews)

export default router
