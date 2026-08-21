import { Express } from 'express'
import request from 'supertest'
import { describe, it, beforeAll, assert } from 'vitest'

import { initTests } from '../../../utils'

void describe('Course yearly statistics - validation', () => {
  let app: Express
  beforeAll(async () => {
    app = await initTests()
  })

  it('should return nothing with missing parameters', async () => {
    const res = await request(app)
      .get('/courseyearlystats')
      .set('shib-session-id', 'test')
      .set('uid', 'basic')
      .set('hygroupcn', 'grp-oodikone-basic-users')

    assert.strictEqual(res.status, 422)
    assert.strictEqual(res.body?.error, 'Missing required query parameters')
  })

  it.todo('should return correct amount of students for a course with substitutions')
  it.todo('should return correct amount of students for multiple coursecodes without substitutions')
  it.todo('should return correct amount of students for multiple coursecodes with substitutions')
})
