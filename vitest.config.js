import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    env: {
      GOOGLE_PLACES_SERVER_KEY: 'test-key',
      ALLOWED_PLACE_IDS: 'ChIJallowed1,ChIJallowed2,ChIJallowed3,ChIJallowed4',
      CACHE_TTL_MS: '300',
    },
  },
})
