import { Express } from 'express'
import assert from 'node:assert/strict'
import { describe, it, before } from 'node:test'
import { Sequelize } from 'sequelize'
import request, { Response } from 'supertest'

import { PopulationstatisticsResBody } from '@oodikone/shared/routes/populations'
import { dbConnections } from '../src/database/connection'
import { initTests } from './utils'

let app: Express
let connection: Sequelize
before(async () => {
  app = await initTests()
  connection = dbConnections.sequelize
})

// Override Supertest's Response body with our own type
type ResponseWithBody<T> = Omit<Response, 'body'> & { body: T }

const populationUrl = (
  programme = '',
  years: string[] = [],
  semesters: ('SPRING' | 'FALL')[] = [],
  students: string[] = []
) => {
  return `/v3/populationstatistics?${programme && 'programme=' + programme}${years.map(year => '&years=' + year).join('')}${semesters.map(sem => '&semesters=' + sem).join('')}${students.map(s => '&studentStatuses=' + s).join('')}`
}

void describe('Population statistics', async () => {
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

  await it('should not return any data to unauthorized user', async () => {
    const res = (await request(app)
      .get(populationUrl('KH50_001', ['2021', '2022'], ['SPRING', 'FALL']))
      .set('shib-session-id', 'test')
      .set('uid', 'norights')
      .set('hygroupcn', 'grp-oodikone-basic-users')) as ResponseWithBody<PopulationstatisticsResBody>

    assert.deepStrictEqual(res.body, { error: 'Trying to request unauthorized students data' })
    assert.strictEqual(res.status, 403)
  })

  await it('should fail when trying to access a programme that user has no permissions to', async () => {
    const res = (await request(app)
      .get(populationUrl('MH50_001', ['2021', '2022'], ['SPRING', 'FALL']))
      .set('shib-session-id', 'test')
      .set('uid', 'onlyiamrights')
      .set('hygroupcn', 'grp-oodikone-basic-users')) as ResponseWithBody<PopulationstatisticsResBody>

    assert.strictEqual(res.status, 403)
    assert.deepStrictEqual(res.body, { error: 'Trying to request unauthorized students data' })
  })

  await it('should return students in the programme for authorized user', async () => {
    const res = (await request(app)
      .get(populationUrl('KH50_001', ['2021', '2022'], ['SPRING', 'FALL']))
      .set('shib-session-id', 'test')
      .set('uid', 'basic')
      .set('hygroupcn', 'grp-oodikone-basic-users')) as ResponseWithBody<PopulationstatisticsResBody>

    assert.strictEqual(res.status, 200)
    assert.notStrictEqual(res.body.students.length, 0)
  })

  await it('should work with the programme flag', async () => {
    const resBachelor = (await request(app)
      .get(populationUrl('KH50_001', ['2021'], ['SPRING', 'FALL']))
      .set('shib-session-id', 'test')
      .set('uid', 'basic')
      .set('hygroupcn', 'grp-oodikone-basic-users')) as ResponseWithBody<PopulationstatisticsResBody>

    const resMaster = (await request(app)
      .get(populationUrl('MH50_001', ['2021'], ['SPRING', 'FALL']))
      .set('shib-session-id', 'test')
      .set('uid', 'basic')
      .set('hygroupcn', 'grp-oodikone-basic-users')) as ResponseWithBody<PopulationstatisticsResBody>

    assert.strictEqual(resBachelor.status, 200)
    assert.strictEqual(resBachelor.body.students.length, 38)

    assert.strictEqual(resMaster.status, 200)
    assert.strictEqual(resMaster.body.students.length, 36)
  })

  await it('should work with semester flag', async () => {
    const resFall = (await request(app)
      .get(populationUrl('KH50_001', ['2021'], ['FALL']))
      .set('shib-session-id', 'test')
      .set('uid', 'basic')
      .set('hygroupcn', 'grp-oodikone-basic-users')) as ResponseWithBody<PopulationstatisticsResBody>

    const resSpring = (await request(app)
      .get(populationUrl('KH50_001', ['2021'], ['SPRING']))
      .set('shib-session-id', 'test')
      .set('uid', 'basic')
      .set('hygroupcn', 'grp-oodikone-basic-users')) as ResponseWithBody<PopulationstatisticsResBody>

    assert.strictEqual(resFall.status, 200)
    assert.strictEqual(resSpring.status, 200)

    assert.strictEqual(resFall.body.students.length, 34)
    assert.strictEqual(resSpring.body.students.length, 4)
  })

  await it('should work with year flag correctly', async () => {
    const res2021 = (await request(app)
      .get(populationUrl('KH50_001', ['2021'], ['FALL', 'SPRING']))
      .set('shib-session-id', 'test')
      .set('uid', 'basic')
      .set('hygroupcn', 'grp-oodikone-basic-users')) as ResponseWithBody<PopulationstatisticsResBody>
    const res2022 = (await request(app)
      .get(populationUrl('KH50_001', ['2022'], ['FALL', 'SPRING']))
      .set('shib-session-id', 'test')
      .set('uid', 'basic')
      .set('hygroupcn', 'grp-oodikone-basic-users')) as ResponseWithBody<PopulationstatisticsResBody>

    const res2021_2022 = (await request(app)
      .get(populationUrl('KH50_001', ['2021', '2022'], ['FALL', 'SPRING']))
      .set('shib-session-id', 'test')
      .set('uid', 'basic')
      .set('hygroupcn', 'grp-oodikone-basic-users')) as ResponseWithBody<PopulationstatisticsResBody>

    const dbCount2021 = await connection.query(
      `select count(student_number)::integer from "sis_study_right_elements" join "sis_study_rights" on study_right_id = "sis_study_rights".id  where code = 'KH50_001' and "sis_study_right_elements".start_date > '2021-07-31' and "sis_study_right_elements".start_date < '2022-08-01'`,
      { raw: true, plain: true }
    )
    const dbCount2022 = await connection.query(
      `select count(student_number)::integer from "sis_study_right_elements" join "sis_study_rights" on study_right_id = "sis_study_rights".id  where code = 'KH50_001' and "sis_study_right_elements".start_date > '2022-07-31' and "sis_study_right_elements".start_date < '2023-08-01'`,
      { raw: true, plain: true }
    )
    const dbCount2021_2022 = await connection.query(
      `select count(student_number)::integer from "sis_study_right_elements" join "sis_study_rights" on study_right_id = "sis_study_rights".id  where code = 'KH50_001' and "sis_study_right_elements".start_date > '2021-07-31' and "sis_study_right_elements".start_date < '2023-08-01'`,
      { raw: true, plain: true }
    )

    assert.strictEqual(res2021.status, 200)
    assert.strictEqual(res2022.status, 200)

    assert.strictEqual(res2021.body.students.length, dbCount2021?.count)
    assert.strictEqual(res2022.body.students.length, dbCount2022?.count)

    assert.strictEqual(res2021_2022.status, 200)
    assert.strictEqual(res2021_2022.body.students.length, dbCount2021_2022?.count)
  })

  await it.skip('should return only students who have transferred out of the programme when TRANSFERRED flag is set', async () => {
    // TODO: This doesn't work correctly...
    const resWithTransOut = (await request(app)
      .get(populationUrl('KH50_001', ['2019'], ['FALL', 'SPRING'], ['']))
      .set('shib-session-id', 'test')
      .set('uid', 'mluukkai')
      .set('hygroupcn', 'grp-oodikone-basic-users')) as ResponseWithBody<PopulationstatisticsResBody>

    const resWithoutTransOut = (await request(app)
      .get(populationUrl('KH50_001', ['2019'], ['FALL', 'SPRING'], ['TRANSFERRED']))
      .set('shib-session-id', 'test')
      .set('uid', 'mluukkai')
      .set('hygroupcn', 'grp-oodikone-basic-users')) as ResponseWithBody<PopulationstatisticsResBody>

    const dbCountWithoutTransferredOut = await connection.query(
      `select count(student_number)::integer from "sis_study_right_elements" join "sis_study_rights" on study_right_id = "sis_study_rights".id  where code = 'KH50_001' and "sis_study_right_elements".start_date > '2019-07-31' and "sis_study_right_elements".start_date < '2020-08-01'`,
      { raw: true, plain: true }
    )
    const dbCountWithTransferredOut = await connection.query(
      `select count(student_number)::integer from "sis_study_right_elements" join "sis_study_rights" on study_right_id = "sis_study_rights".id  where code = 'KH50_001' and "sis_study_right_elements".start_date > '2019-07-31' and "sis_study_right_elements".start_date < '2020-08-01'`,
      { raw: true, plain: true }
    )

    assert.strictEqual(resWithTransOut.status, 200)
    assert.strictEqual(resWithoutTransOut.status, 200)

    assert.strictEqual(resWithTransOut.body.students.length, dbCountWithTransferredOut?.count)
    assert.strictEqual(resWithoutTransOut.body.students.length, dbCountWithoutTransferredOut?.count)
  })
  await it.todo('should return only degree-students and non-degree students when NONDEGREE flag is set')
  await it.todo('should return only degree-students and exchange students when EXCHANGE flag is set')
})
