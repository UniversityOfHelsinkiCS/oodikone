import express from 'express'
import request from 'supertest'
import { describe, it, assert } from 'vitest'

import { testTimeMiddleware } from '../../src/middleware/testTime'
import { now } from '../../src/util/clock'

describe('test time middleware', () => {
  it('uses the date from the x-test-now header', async () => {
    const app = express()
    app.use(testTimeMiddleware)
    app.get('/', (_request, response) => response.send(now().toISOString()))

    const response = await request(app).get('/').set('x-test-now', '2026-03-01T12:00:00.000Z')

    assert.strictEqual(response.text, '2026-03-01T12:00:00.000Z')
  })

  it('the acual current date if x-test-now header missing', async () => {
    const app = express()
    app.use(testTimeMiddleware)
    app.get('/', (_request, response) => response.send(now().toISOString()))

    const response = await request(app).get('/')

    assert.notStrictEqual(response.text, '2026-03-01T12:00:00.000Z')
  })

  it('the acual current date if x-test-now header has incorrect date', async () => {
    const app = express()
    app.use(testTimeMiddleware)
    app.get('/', (_request, response) => response.send(now().toISOString()))

    const response = await request(app).get('/').set('x-test-now', 'moimoi mitä kuuluu')

    assert.notStrictEqual(response.text, '2026-03-01T12:00:00.000Z')
  })
})
