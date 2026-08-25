import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'

import app from '../src/app.js'

const placeFixture = (overrides = {}) => ({
  id: 'ChIJallowed1',
  displayName: { text: 'PAULA DALLOCHIO Estudio Inmobiliario' },
  rating: 4.9,
  userRatingCount: 37,
  googleMapsUri: 'https://maps.google.com/?cid=4714522655368005334',
  reviews: [
    {
      authorAttribution: {
        displayName: 'Nombre Apellido',
        photoUri: 'https://lh3.googleusercontent.com/a',
        uri: 'https://www.google.com/maps/contrib/1',
      },
      text: { text: 'Excelente atención', languageCode: 'es' },
      rating: 5,
      publishTime: '2025-11-03T18:22:11Z',
    },
  ],
  ...overrides,
})

const jsonResponse = (body) => ({
  ok: true,
  status: 200,
  json: async () => body,
})

const errorResponse = (status) => ({
  ok: false,
  status,
  json: async () => ({}),
})

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('GET /reviews', () => {
  it('responde 200 con el shape del contrato', async () => {
    fetch.mockResolvedValueOnce(jsonResponse(placeFixture()))

    const res = await request(app).get('/reviews').query({ placeId: 'ChIJallowed1' })

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      source: 'places',
      placeId: 'ChIJallowed1',
      rating: 4.9,
      totalCount: 37,
      stale: false,
    })
    expect(res.body.reviews[0]).toMatchObject({
      author: 'Nombre Apellido',
      avatar: 'https://lh3.googleusercontent.com/a',
      content: 'Excelente atención',
      rating: 5,
      url: 'https://www.google.com/maps/contrib/1',
    })
    expect(res.body.reviews[0].languageCode).toBeUndefined()
  })

  it('cache hit: la segunda llamada no toca la red', async () => {
    fetch.mockResolvedValueOnce(jsonResponse(placeFixture({ id: 'ChIJallowed2' })))

    const first = await request(app).get('/reviews').query({ placeId: 'ChIJallowed2' })
    const second = await request(app).get('/reviews').query({ placeId: 'ChIJallowed2' })

    expect(first.status).toBe(200)
    expect(second.status).toBe(200)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('stale fallback: Google 500 después de un fetch OK devuelve stale:true', async () => {
    fetch.mockResolvedValueOnce(jsonResponse(placeFixture({ id: 'ChIJallowed3' })))

    const first = await request(app).get('/reviews').query({ placeId: 'ChIJallowed3' })
    expect(first.body.stale).toBe(false)

    // TTL de test = 300ms (vitest.config.js); esperamos a que venza para forzar un refetch.
    await new Promise((resolve) => setTimeout(resolve, 400))

    fetch.mockResolvedValueOnce(errorResponse(500))

    const second = await request(app).get('/reviews').query({ placeId: 'ChIJallowed3' })

    expect(second.status).toBe(200)
    expect(second.body.stale).toBe(true)
    expect(second.body.reviews[0].author).toBe('Nombre Apellido')
  })

  it('minStars filtra reseñas negativas, pero sin el param no filtra nada', async () => {
    const mixedFixture = placeFixture({
      id: 'ChIJallowed4',
      reviews: [
        {
          authorAttribution: { displayName: 'Cliente Feliz' },
          text: { text: 'Diez puntos', languageCode: 'es' },
          rating: 5,
          publishTime: '2025-11-03T18:22:11Z',
        },
        {
          authorAttribution: { displayName: 'Cliente Enojado' },
          text: { text: 'Pésima experiencia', languageCode: 'es' },
          rating: 2,
          publishTime: '2025-11-02T18:22:11Z',
        },
      ],
    })

    fetch.mockResolvedValueOnce(jsonResponse(mixedFixture))
    const filtered = await request(app)
      .get('/reviews')
      .query({ placeId: 'ChIJallowed4', minStars: 4 })

    expect(filtered.body.reviews).toHaveLength(1)
    expect(filtered.body.reviews[0].author).toBe('Cliente Feliz')

    // Mismo placeId, cache ya tibia: sin minStars, el default es 0 y no filtra nada.
    const unfiltered = await request(app).get('/reviews').query({ placeId: 'ChIJallowed4' })

    expect(unfiltered.body.reviews).toHaveLength(2)
  })

  it('placeId fuera de la allowlist devuelve 400', async () => {
    const res = await request(app).get('/reviews').query({ placeId: 'ChIJblocked' })

    expect(res.status).toBe(400)
    expect(res.body.code).toBe('PLACE_ID_NOT_ALLOWED')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('placeId faltante devuelve 400', async () => {
    const res = await request(app).get('/reviews')

    expect(res.status).toBe(400)
    expect(res.body.code).toBe('PLACE_ID_REQUIRED')
  })
})
