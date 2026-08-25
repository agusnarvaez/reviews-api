import express from 'express'
import morgan from 'morgan'
import cors from 'cors'

import reviewsRoutes from './routes/reviews.routes.js'
import { env, normalizeRequestOrigin } from './config/env.js'
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js'

const app = express()

const allowedOrigins = new Set(env.corsOrigins)

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true)
      return
    }

    const normalizedOrigin = normalizeRequestOrigin(origin)

    if (allowedOrigins.has(normalizedOrigin)) {
      callback(null, true)
      return
    }

    callback(new Error(`Origin not allowed by CORS: ${origin}`))
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
}

app.set('port', env.port)

app.use(cors(corsOptions))
app.options('*', cors(corsOptions))
app.use(morgan('dev'))
app.use(express.json({ limit: '100kb' }))

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' })
})

app.use('/reviews', reviewsRoutes)
app.use(notFoundHandler)
app.use(errorHandler)

export default app
