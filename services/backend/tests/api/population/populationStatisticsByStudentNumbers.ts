import { Express } from 'express'
import request from 'supertest'
import { describe, it, beforeAll, assert } from 'vitest'

import { initTests } from '../../utils'

void describe('Population statistics by student number', () => {
  let app: Express
  beforeAll(async () => {
    app = await initTests()
  })

  it('should not return anything with missing parameters', async () => {
    const res = await request(app)
      .post('/populationstatisticsbystudentnumbers')
      .set('shib-session-id', 'test')
      .set('uid', 'basic')
      .set('hygroupcn', 'grp-oodikone-basic-users')

    assert.deepEqual(res.status, 422)
    assert.deepEqual(res.body.error, 'Body should include student numbers')
  })
})
