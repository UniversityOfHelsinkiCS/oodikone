import { Express } from 'express'
import assert from 'node:assert/strict'
import { describe, it, before } from 'node:test'
import request from 'supertest'

import { initTests } from '../utils'

let app: Express
before(async () => {
  app = await initTests()
})

void describe('Population statistics by course', async () => {
  await it('should not return anything with missing parameters', async () => {
    const res = await request(app)
      .get('/populationstatisticsbycourse')
      .set('shib-session-id', 'test')
      .set('uid', 'basic')
      .set('hygroupcn', 'grp-oodikone-basic-users')

    assert.deepEqual(res.status, 400)
    assert.deepEqual(res.body.error, 'The body should have a yearcode and coursecode defined')
  })

  await it('should return correct amount of students for a course', async () => {
    const res = await request(app)
      .get('/populationstatisticsbycourse?coursecodes=["MAT21005"]&from=70&to=70')
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
    assert.deepStrictEqual(res.body.students.sort((a, b) => b.studentNumber - a.studentNumber).at(-1), testStudent)
  })
})
