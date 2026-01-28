import { Express } from 'express'
import assert from 'node:assert/strict'
import { describe, it, before } from 'node:test'
import request from 'supertest'

import { initTests } from './utils'

let app: Express
before(async () => {
  app = await initTests()
})

void describe('Changelog', async () => {
  await it('should return dev data in dev env', async () => {
    const res = await request(app)
      .get('/changelog')
      .set('shib-session-id', 'test')
      .set('uid', 'mluukkai')
      .set('hygroupcn', 'grp-oodikone-basic-users')

    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.body[0].title, 'Release 3')
  })
})
