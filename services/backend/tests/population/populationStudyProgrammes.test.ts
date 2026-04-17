import { Express } from 'express'
import assert from 'node:assert/strict'
import { describe, it, before } from 'node:test'
import request from 'supertest'

import { initTests } from '../utils'

let app: Express
before(async () => {
  app = await initTests()
})

void describe('Population statistics (study programme)', async () => {
  await it('should return correctly formatted responses', async () => {
    const res = await request(app)
      .get('/populationstatistics/studyprogrammes')
      .set('shib-session-id', 'test')
      .set('uid', 'basic')
      .set('hygroupcn', 'grp-oodikone-basic-users')

    assert.strictEqual(res.status, 200)

    assert.strictEqual(Object.keys(res.body).includes('allProgrammes'), true)
    assert.strictEqual(Object.keys(res.body).includes('filteredProgrammes'), true)

    assert.notStrictEqual(Object.keys(res.body.allProgrammes).length, 0)
    assert.notStrictEqual(Object.keys(res.body.filteredProgrammes).length, 0)
  })

  await it('should return correct programmes to allProgrammes', async () => {
    const res = await request(app)
      .get('/populationstatistics/studyprogrammes')
      .set('shib-session-id', 'test')
      .set('uid', 'basic')
      .set('hygroupcn', 'grp-oodikone-basic-users')

    const testMathProgramme = {
      code: 'KH50_001',
      curriculumPeriodIds: [
        'hy-lv-72',
        'hy-lv-73',
        'hy-lv-71',
        'hy-lv-69',
        'hy-lv-68',
        'hy-lv-70',
        'hy-lv-76',
        'hy-lv-74',
        'hy-lv-75',
      ],
      degreeProgrammeType: 'urn:code:degree-program-type:bachelors-degree',
      name: {
        en: "Bachelor's Programme in Mathematical Sciences",
        fi: 'Matemaattisten tieteiden kandiohjelma',
        sv: 'Kandidatsprogrammet i matematiska vetenskaper',
      },
      progId: 'MAT',
    }

    assert.strictEqual(Object.keys(res.body.allProgrammes).length, 972)
    assert.deepStrictEqual(res.body.allProgrammes.KH50_001, testMathProgramme)
  })

  await it('should return the programmes, that user has access to, to filteredProgrammes', async () => {
    const res = await request(app)
      .get('/populationstatistics/studyprogrammes')
      .set('shib-session-id', 'test')
      .set('uid', 'basic')
      .set('hygroupcn', 'grp-oodikone-basic-users')

    const testMathProgramme = {
      code: 'KH50_001',
      curriculumPeriodIds: [
        'hy-lv-72',
        'hy-lv-73',
        'hy-lv-71',
        'hy-lv-69',
        'hy-lv-68',
        'hy-lv-70',
        'hy-lv-76',
        'hy-lv-74',
        'hy-lv-75',
      ],
      degreeProgrammeType: 'urn:code:degree-program-type:bachelors-degree',
      name: {
        en: "Bachelor's Programme in Mathematical Sciences",
        fi: 'Matemaattisten tieteiden kandiohjelma',
        sv: 'Kandidatsprogrammet i matematiska vetenskaper',
      },
      progId: 'MAT',
    }

    assert.strictEqual(Object.keys(res.body.filteredProgrammes).length, 2) // Basic has access to math bachelor + master

    assert.deepStrictEqual(res.body.filteredProgrammes.KH50_001, testMathProgramme)
    assert.deepStrictEqual(res.body.allProgrammes.KH50_001, testMathProgramme) // All programmes should still include filteredProgramme programmes
  })

  await it.todo(
    'should return both degree levels of study programme when searching KH90_001 or MH90_001 (ELK, ELL) in filteredProgrammes'
  )
})
