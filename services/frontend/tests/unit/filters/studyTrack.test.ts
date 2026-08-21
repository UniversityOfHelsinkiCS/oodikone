import { assert, describe, it } from 'vitest'

import { StudentStudyRight } from '@oodikone/shared/types/studentData'

import {
  createStudent,
  createStudyRight as createBaseStudyRight,
  createStudyRightElement,
} from '@oodikone/shared/test/utils'

const { studyTrackFilter } = await import('@/components/FilterView/filters/studyTrack')

const createStudyRight = (overrides: Partial<StudentStudyRight> = {}): StudentStudyRight =>
  createBaseStudyRight({
    studyRightElements: [
      createStudyRightElement({
        code: 'KH50_001',
        studyTrack: { code: 'track-1', name: { fi: 'Testisuuntautuminen' } },
      }),
    ],
    ...overrides,
  })

const ARGS = { code: 'KH50_001' }

void describe('studyTrackFilter', () => {
  void it('should include student when the student is in one of the selected study tracks', () => {
    const student = createStudent({ studyRights: [createStudyRight()] })

    const result = studyTrackFilter().filter(student, {
      args: ARGS,
      options: { selected: ['track-1'], studyTracks: [] },
      precomputed: undefined,
    })

    assert.strictEqual(result, true)
  })

  void it('should exclude student when the student is not in any of the selected study tracks', () => {
    const student = createStudent({ studyRights: [createStudyRight()] })

    const result = studyTrackFilter().filter(student, {
      args: ARGS,
      options: { selected: ['track-2'], studyTracks: [] },
      precomputed: undefined,
    })

    assert.strictEqual(result, false)
  })

  void it('should exclude student when the study right does not match the given programme code', () => {
    const student = createStudent({ studyRights: [createStudyRight()] })

    const result = studyTrackFilter().filter(student, {
      args: { code: 'OTHER' },
      options: { selected: ['track-1'], studyTracks: [] },
      precomputed: undefined,
    })

    assert.strictEqual(result, false)
  })

  void it('isActive should match the filter state', () => {
    assert.strictEqual(studyTrackFilter().isActive({ selected: [], studyTracks: [] }, undefined), false)
    assert.strictEqual(studyTrackFilter().isActive({ selected: ['track-1'], studyTracks: [] }, undefined), true)
  })
})
