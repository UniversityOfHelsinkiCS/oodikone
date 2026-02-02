import { Express } from 'express'
import assert from 'node:assert/strict'
import { describe, it, before } from 'node:test'
import request, { Response } from 'supertest'

import { PopulationstatisticsResBody } from '@oodikone/shared/routes/populations'
import { initTests } from './utils'

let app: Express
before(async () => {
  app = await initTests()
})

// Override Supertest's Response body with our own type
type ResponseWithBody<T> = Omit<Response, 'body'> & { body: T }

const populationUrl = (programme = '', years: string[] = [], semesters: string[] = []) => {
  return `/v3/populationstatistics?${programme && 'programme=' + programme}${years.map(year => '&years=' + year).join('')}${semesters.map(sem => '&semesters=' + sem).join('')}`
}

void describe('Population', async () => {
  await it('should fail when all fields not defined', async () => {
    const resAllMissing = await request(app)
      .get(populationUrl())
      .set('shib-session-id', 'test')
      .set('uid', 'basic')
      .set('hygroupcn', 'grp-oodikone-basic-users')

    const resProgramme = await request(app)
      .get(populationUrl('KH50_001'))
      .set('shib-session-id', 'test')
      .set('uid', 'basic')
      .set('hygroupcn', 'grp-oodikone-basic-users')

    const resProgrammeAndYears = await request(app)
      .get(populationUrl('KH50_001', ['2021', '2022']))
      .set('shib-session-id', 'test')
      .set('uid', 'basic')
      .set('hygroupcn', 'grp-oodikone-basic-users')

    assert.strictEqual(resAllMissing.status, 400)
    assert.strictEqual(resProgramme.status, 400)
    assert.strictEqual(resProgrammeAndYears.status, 400)
  })

  await it('should return students in the programme', async () => {
    const res = (await request(app)
      .get(populationUrl('KH50_001', ['2021', '2022'], ['SPRING', 'FALL']))
      .set('shib-session-id', 'test')
      .set('uid', 'basic')
      .set('hygroupcn', 'grp-oodikone-basic-users')) as ResponseWithBody<PopulationstatisticsResBody>

    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.body.students.length, 64)
  })

  await it('should fail when trying to access incorrect programme', async () => {
    const res = (await request(app)
      .get(populationUrl('KH10_001', ['2021', '2022'], ['SPRING', 'FALL']))
      .set('shib-session-id', 'test')
      .set('uid', 'norights')
      .set('hygroupcn', 'grp-oodikone-basic-users')) as ResponseWithBody<PopulationstatisticsResBody>

    assert.strictEqual(res.status, 403)
  })
  await it.todo('should faild when trying to access incorrect students')
  await it.todo('should not return data to unauthorized user')
})
