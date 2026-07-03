import { Express } from 'express'
import request from 'supertest'
import { describe, it, beforeAll, assert } from 'vitest'

import { initTests } from '../utils'

void describe('Changelog', () => {
  let app: Express
  beforeAll(async () => {
    app = await initTests()
  })

  it('should return dev data in dev env', async () => {
    const res = await request(app)
      .get('/changelog')
      .set('shib-session-id', 'test')
      .set('uid', 'mluukkai')
      .set('hygroupcn', 'grp-oodikone-basic-users')

    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.body[0].title, 'Release 3')
  })
})
