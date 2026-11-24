import { assert, describe, it } from 'vitest'

import { ageFilter, genderFilter, programmeFilter, studyTrackFilter } from '@/components/FilterView/filters'
import { precomputeFilters } from '@/components/FilterView/precompute'

import { createStudent, createStudyRight, createStudyRightElement } from '@oodikone/shared/test/utils'

const student = createStudent({
  studyRights: [
    createStudyRight({
      studyRightElements: [
        createStudyRightElement({
          code: 'KH50_001',
          startDate: new Date('2010-08-01'),
          endDate: new Date('2013-07-31'),
          studyTrack: { code: 'track-1', name: { fi: 'Testisuuntautuminen' } },
        }),
      ],
    }),
  ],
})

void describe('precomputeFilters', () => {
  void it('should leave filters without precompute undefined', () => {
    const precomputed = precomputeFilters([genderFilter(), ageFilter()], [student])

    assert.strictEqual(precomputed[genderFilter.key], undefined)
    assert.isDefined(precomputed[ageFilter.key])
  })

  void it('should give the programme filter a lookup that resolves each mode', () => {
    const getStudentToProgrammeMap = precomputeFilters([programmeFilter()], [student])[programmeFilter.key]
    const programmeCodes = (mode: string) =>
      getStudentToProgrammeMap(mode)[student.studentNumber].map(({ code }) => code)

    assert.deepStrictEqual(programmeCodes('active'), ['00000'])
    assert.deepStrictEqual(programmeCodes('any'), ['KH50_001'])
  })

  void it('should compute each programme mode only once', () => {
    let predicateCalls = 0
    const filter = programmeFilter({
      additionalModes: [
        {
          key: 'counted',
          label: 'Counted',
          description: '',
          predicate: () => {
            predicateCalls += 1
            return true
          },
        },
      ],
    })
    const getStudentToProgrammeMap = precomputeFilters([filter], [student])[programmeFilter.key]

    const first = getStudentToProgrammeMap('counted')
    const second = getStudentToProgrammeMap('counted')

    assert.strictEqual(second, first)
    assert.strictEqual(predicateCalls, 1)
  })

  void it('should return the study tracks of the programme instead of storing them in options', () => {
    const precomputed = precomputeFilters([studyTrackFilter({ code: 'KH50_001' })], [student])

    assert.deepStrictEqual(
      precomputed[studyTrackFilter.key].map(({ code }) => code),
      ['track-1']
    )
  })
})
