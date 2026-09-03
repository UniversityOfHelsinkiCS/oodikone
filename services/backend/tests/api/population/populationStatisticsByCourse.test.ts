import { Express } from 'express'
import request from 'supertest'
import { describe, it, beforeAll, assert } from 'vitest'

import { initTests } from '../../utils'
import { yearToYearCode } from '@oodikone/shared/util'
import { PopulationstatisticsbycourseResBody } from '@oodikone/shared/routes/populations'
import { CreditModel } from '@/models'
import { EnrollmentState } from '@oodikone/shared/types'

const MAT21003 = 'hy-CU-117375829'
const MAT21005 = 'hy-CU-117376344'

void describe('Population statistics by course MAT21003 + MAT21005 (hy-CU-117375829 + hy-CU-117376344)', () => {
  let app: Express
  beforeAll(async () => {
    app = await initTests()
  })

  it('should not return anything with missing parameters', async () => {
    const res = await request(app)
      .get('/populationstatisticsbycourse')
      .set('shib-session-id', 'test')
      .set('uid', 'basic')
      .set('hygroupcn', 'grp-oodikone-basic-users')

    assert.strictEqual(res.status, 400)
    assert.deepStrictEqual(res.body.error, 'Missing required parameters.')
  })

  // Vektorianalyysi I, MAT21003
  // NOTE: Failed stats are higher than on Course population view because one student can have more than one failure.
  // Also Enrolled counts all enrollments, including duplicates
  //
  // Now failed field is acuallyFailed + duplicateFailedCredits
  it.each([
    [2017, 1, 0, 1, 0],
    [2018, 31, 27, 4, 0],
    [2019, 58, 56, 2 + 2, 0],
    [2020, 63, 62, 1 + 2, 0],
    [2021, 41, 35, 0, 47],
    [2022, 28, 21, 0, 51],
    [2023, 21, 1, 0, 36],
  ])('should return correct amount of students for single year ($0)', async (year, total, passed, failed, enrolled) => {
    const res = await request(app)
      .get(`/populationstatisticsbycourse?courses=${MAT21003}&from=${yearToYearCode(year)}&to=${yearToYearCode(year)}`)
      .set('shib-session-id', 'test')
      .set('uid', 'basic')
      .set('hygroupcn', 'grp-oodikone-basic-users')

    assert.strictEqual(res.status, 200)
    const body: PopulationstatisticsbycourseResBody = res.body

    assert.strictEqual(body.students.length, total, 'Incorrect amount of students')
    assert.strictEqual(
      body.coursestatistics.credits.filter(
        credit => body.idToGroupIdMap[credit.course_id] === MAT21003 && CreditModel.passed(credit)
      ).length,
      passed,
      'Incorrect amount of passed credits'
    )
    assert.strictEqual(
      body.coursestatistics.credits.filter(
        credit => body.idToGroupIdMap[credit.course_id] === MAT21003 && CreditModel.failed(credit)
      ).length,
      failed,
      'Incorrect amount of failed credits'
    )
    assert.strictEqual(
      body.coursestatistics.enrollments.filter(
        enrollment =>
          body.idToGroupIdMap[enrollment.course_id] === MAT21003 && enrollment.state === EnrollmentState.ENROLLED
      ).length,
      enrolled,
      'Incorrect amount of enrollments'
    )
  })

  it('should return correct amount of students for a course', async () => {
    const res = await request(app)
      .get(`/populationstatisticsbycourse?courses=${MAT21005}&from=70&to=70`)
      .set('shib-session-id', 'test')
      .set('uid', 'basic')
      .set('hygroupcn', 'grp-oodikone-basic-users')

    // Copied from response
    const testStudent = {
      firstnames: 'Mira Ilmatar',
      lastname: 'Lintula',
      started: '2018-08-01T00:00:00.000Z',
      studentNumber: '394776',
      credits: 265,
      hopsCredits: 0,
      name: 'Lintula Mira Ilmatar',
      gender_code: '2',
      email: 'sisutestidata65689@testisisudata.fi',
      secondaryEmail: null,
      phoneNumber: '+358501234567',
      updatedAt: '2026-05-24T13:43:07.827Z',
      studyrightStart: '1899-12-31T22:20:11.000Z',
      option: null,
      birthdate: '1999-03-01T00:00:00.000Z',
      sis_person_id: 'hy-hlo-125389506',
      citizenships: [
        {
          en: 'Finland',
          fi: 'Suomi',
          sv: 'Finland',
        },
      ],
      curriculumVersion: null,
      hasPersonalIdentityCode: null,
      tags: [],
      transferredStudyright: false,
      studyRights: [
        {
          admissionType: null,
          cancelled: false,
          extentCode: 5,
          facultyCode: 'H50',
          id: 'hy-opinoik-125389507',
          semesterEnrollments: [
            { semester: 137, type: 1 },
            { semester: 138, type: 1 },
            { semester: 139, type: 1 },
            { semester: 140, type: 1 },
            { semester: 141, type: 1 },
            { semester: 142, type: 1 },
            { semester: 143, type: 1 },
            { semester: 144, type: 1 },
            { semester: 145, type: 1 },
            { semester: 146, type: 1 },
            { semester: 147, type: 1 },
            { semester: 148, statutoryAbsence: false, type: 2 },
            { semester: 149, type: 3 },
            { semester: 150, type: 3 },
            { semester: 151, type: 3 },
          ],
          startDate: '2018-08-01T00:00:00.000Z',
          studyRightElements: [
            {
              code: 'KH50_001',
              degreeProgrammeType: 'urn:code:degree-program-type:bachelors-degree',
              endDate: '2021-06-11T00:00:00.000Z',
              graduated: true,
              name: {
                en: "Bachelor's Programme in Mathematical Sciences",
                fi: 'Matemaattisten tieteiden kandiohjelma',
                sv: 'Kandidatsprogrammet i matematiska vetenskaper',
              },
              phase: 1,
              startDate: '2018-08-01T00:00:00.000Z',
              studyTrack: {
                code: 'MAT-MAT',
                name: {
                  fi: 'Matematiikka',
                },
              },
            },
            {
              code: 'MH50_001',
              degreeProgrammeType: 'urn:code:degree-program-type:masters-degree',
              endDate: '2025-12-31T00:00:00.000Z',
              graduated: false,
              name: {
                en: "Master 's Programme in Mathematics and Statistics",
                fi: 'Matematiikan ja tilastotieteen maisteriohjelma',
                sv: 'Magisterprogrammet i matematik och statistik',
              },
              phase: 2,
              startDate: '2021-06-12T00:00:00.000Z',
              studyTrack: null,
            },
          ],
          tvex: false,
        },
      ],
      studyplans: [],
    }

    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.body.students.length, 40)
    const responseStudent: typeof testStudent = res.body.students
      .sort((a, b) => b.studentNumber - a.studentNumber)
      .at(-1)

    assert.strictEqual(responseStudent.name, testStudent.name)
    assert.strictEqual(responseStudent.studentNumber, testStudent.studentNumber)
    assert.strictEqual(responseStudent.credits, testStudent.credits)
    assert.strictEqual(responseStudent.credits, testStudent.credits)
    assert.strictEqual(responseStudent.started, testStudent.started)
    assert.strictEqual(responseStudent.sis_person_id, testStudent.sis_person_id)
    assert.deepStrictEqual(responseStudent.studyRights, testStudent.studyRights)
  })
})
