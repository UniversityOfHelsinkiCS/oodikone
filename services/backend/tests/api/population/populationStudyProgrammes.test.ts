import { Express } from 'express'
import request from 'supertest'
import { describe, it, beforeAll, assert } from 'vitest'

import { initTests } from '../../utils'

void describe('Population statistics (study programme)', () => {
  let app: Express
  beforeAll(async () => {
    app = await initTests()
  })

  it('should return correctly formatted responses', async () => {
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

  it('should return correct programmes to allProgrammes', async () => {
    const res = await request(app)
      .get('/populationstatistics/studyprogrammes')
      .set('shib-session-id', 'test')
      .set('uid', 'basic')
      .set('hygroupcn', 'grp-oodikone-basic-users')

    const testMathProgramme = {
      code: 'KH50_001',
      curriculumPeriodIds: [
        'hy-lv-76',
        'hy-lv-74',
        'hy-lv-75',
        'hy-lv-72',
        'hy-lv-73',
        'hy-lv-71',
        'hy-lv-69',
        'hy-lv-68',
        'hy-lv-70',
      ].sort(),
      degreeProgrammeType: 'urn:code:degree-program-type:bachelors-degree',
      name: {
        en: "Bachelor's Programme in Mathematical Sciences",
        fi: 'Matemaattisten tieteiden kandiohjelma',
        sv: 'Kandidatsprogrammet i matematiska vetenskaper',
      },
      progId: 'MAT',
    }

    // Sort curriculum periods so that order doesn't mess up tests
    res.body.allProgrammes.KH50_001.curriculumPeriodIds.sort()

    assert.strictEqual(Object.keys(res.body.allProgrammes).length, 972)
    assert.deepStrictEqual(res.body.allProgrammes.KH50_001, testMathProgramme)
  })

  it('should return the programmes, that user has access to, to filteredProgrammes', async () => {
    const res = await request(app)
      .get('/populationstatistics/studyprogrammes')
      .set('shib-session-id', 'test')
      .set('uid', 'basic')
      .set('hygroupcn', 'grp-oodikone-basic-users')

    const testMathProgramme = {
      code: 'KH50_001',
      curriculumPeriodIds: [
        'hy-lv-76',
        'hy-lv-74',
        'hy-lv-75',
        'hy-lv-72',
        'hy-lv-73',
        'hy-lv-71',
        'hy-lv-69',
        'hy-lv-68',
        'hy-lv-70',
      ].sort(),
      degreeProgrammeType: 'urn:code:degree-program-type:bachelors-degree',
      name: {
        en: "Bachelor's Programme in Mathematical Sciences",
        fi: 'Matemaattisten tieteiden kandiohjelma',
        sv: 'Kandidatsprogrammet i matematiska vetenskaper',
      },
      progId: 'MAT',
    }

    assert.strictEqual(Object.keys(res.body.filteredProgrammes).length, 2) // Basic has access to math bachelor + master

    // Sort curriculum periods so that order doesn't mess up tests
    res.body.filteredProgrammes.KH50_001.curriculumPeriodIds.sort()
    res.body.allProgrammes.KH50_001.curriculumPeriodIds.sort()

    assert.deepStrictEqual(res.body.filteredProgrammes.KH50_001, testMathProgramme)
    assert.deepStrictEqual(res.body.allProgrammes.KH50_001, testMathProgramme) // All programmes should still include filteredProgramme programmes
  })

  it.todo(
    'should return both degree levels of study programme when searching KH90_001 or MH90_001 (ELK, ELL) in filteredProgrammes'
  )
})
