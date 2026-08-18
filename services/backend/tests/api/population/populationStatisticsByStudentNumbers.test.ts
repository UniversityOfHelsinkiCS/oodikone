import { Express } from 'express'
import request from 'supertest'
import { describe, it, beforeAll, assert } from 'vitest'

import { CustomPopulationByStudentNumbersResBody } from '@oodikone/shared/routes/populations'
import { initTests, ResponseWithBody } from '../../utils'

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

  it('should not return anything to unauthorized user', async () => {
    const res = await request(app)
      .post('/populationstatisticsbystudentnumbers')
      .send({ studentNumbers: ['433237', '457144'] })
      .set('shib-session-id', 'test')
      .set('uid', 'norights')
      .set('hygroupcn', 'grp-oodikone-basic-users')

    assert.deepEqual(res.status, 200)
    assert.deepEqual(res.body.students, [])
  })

  it('should return students for authorized user', async () => {
    const res = (await request(app)
      .post('/populationstatisticsbystudentnumbers')
      .send({ studentNumbers: ['433237', '457144'] })
      .set('shib-session-id', 'test')
      .set('uid', 'basic')
      .set('hygroupcn', 'grp-oodikone-basic-users')) as ResponseWithBody<CustomPopulationByStudentNumbersResBody>

    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.body.students.length, 2)
    assert.deepEqual(res.body.discardedStudentNumbers, [])
  })
})
