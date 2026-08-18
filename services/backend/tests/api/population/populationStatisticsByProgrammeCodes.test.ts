import { Express } from 'express'
import request from 'supertest'
import { describe, it, beforeAll, assert } from 'vitest'

import { CanError } from '@oodikone/shared/routes'
import { CustomPopulationByProgrammesResBody } from '@oodikone/shared/routes/populations'
import { initTests, ResponseWithBody } from '../../utils'

void describe('Population statistics by programme codes', () => {
  let app: Express
  beforeAll(async () => {
    app = await initTests()
  })

  it('should not return anything with missing years', async () => {
    const res = (await request(app)
      .post('/populationstatisticsbyprogrammecodes')
      .send({ programmes: ['KH50_001'] })
      .set('shib-session-id', 'test')
      .set('uid', 'basic')
      .set('hygroupcn', 'grp-oodikone-basic-users')) as ResponseWithBody<CanError<CustomPopulationByProgrammesResBody>>

    assert.deepEqual(res.status, 400)
    assert.deepEqual(res.body, { error: 'Programme based populations require years to be defined' })
  })

  it('should not return any data to unauthorized user', async () => {
    const res = (await request(app)
      .post('/populationstatisticsbyprogrammecodes')
      .send({ programmes: ['MH50_001'], years: ['2021'] })
      .set('shib-session-id', 'test')
      .set('uid', 'onlyiamrights')
      .set('hygroupcn', 'grp-oodikone-basic-users')) as ResponseWithBody<CanError<CustomPopulationByProgrammesResBody>>

    assert.deepEqual(res.status, 403)
    assert.deepEqual(res.body, { error: 'Trying to request unauthorized students data' })
  })

  it('should return students in the programmes for authorized user', async () => {
    const res = (await request(app)
      .post('/populationstatisticsbyprogrammecodes')
      .send({ programmes: ['KH50_001'], years: ['2021'] })
      .set('shib-session-id', 'test')
      .set('uid', 'basic')
      .set('hygroupcn', 'grp-oodikone-basic-users')) as ResponseWithBody<CustomPopulationByProgrammesResBody>

    assert.strictEqual(res.status, 200)
    assert.notStrictEqual(res.body.students.length, 0)
  })
})
