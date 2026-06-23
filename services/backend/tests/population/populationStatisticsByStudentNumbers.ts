import { Express } from 'express'
import assert from 'node:assert/strict'
import { describe, it, before } from 'node:test'
import request from 'supertest'

import { initTests } from '../utils'

let app: Express
before(async () => {
  app = await initTests()
})

void describe('Population statistics by student number', async () => {
  await it('should not return anything with missing parameters', async () => {
    const res = await request(app)
      .post('/populationstatisticsbystudentnumbers')
      .set('shib-session-id', 'test')
      .set('uid', 'basic')
      .set('hygroupcn', 'grp-oodikone-basic-users')

    assert.deepEqual(res.status, 422)
    assert.deepEqual(res.body.error, 'Body should include student numbers')
  })
})
