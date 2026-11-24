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
      options: { selected: ['track-1'] },
      precomputed: [],
    })

    assert.strictEqual(result, true)
  })

  void it('should exclude student when the student is not in any of the selected study tracks', () => {
    const student = createStudent({ studyRights: [createStudyRight()] })

    const result = studyTrackFilter().filter(student, {
      args: ARGS,
      options: { selected: ['track-2'] },
      precomputed: [],
    })

    assert.strictEqual(result, false)
  })

  void it('should exclude student when the study right does not match the given programme code', () => {
    const student = createStudent({ studyRights: [createStudyRight()] })

    const result = studyTrackFilter().filter(student, {
      args: { code: 'OTHER' },
      options: { selected: ['track-1'] },
      precomputed: [],
    })

    assert.strictEqual(result, false)
  })

  void it('isActive should match the filter state', () => {
    assert.strictEqual(studyTrackFilter().isActive({ selected: [] }, undefined), false)
    assert.strictEqual(studyTrackFilter().isActive({ selected: ['track-1'] }, undefined), true)
  })
})

void describe('studyTrackFilter selectors', () => {
  void it('should resolve the selected study tracks from the precomputed tracks', () => {
    const track1 = { code: 'track-1', name: { fi: 'Suuntautuminen 1' } }
    const track2 = { code: 'track-2', name: { fi: 'Suuntautuminen 2' } }
    const getContext = () => ({ options: { selected: ['track-2'] }, args: ARGS, precomputed: [track1, track2] })

    const selected = studyTrackFilter.selectors.selectedStudyTracks(undefined)(getContext)

    assert.deepStrictEqual(selected, [track2])
  })

  void it('should precompute the study tracks of the given programme only', () => {
    const student = createStudent({
      studyRights: [
        createStudyRight(),
        createBaseStudyRight({
          studyRightElements: [
            createStudyRightElement({ code: 'OTHER', studyTrack: { code: 'track-x', name: { fi: 'Muu' } } }),
          ],
        }),
      ],
    })

    const studyTracks = studyTrackFilter().precompute!({ students: [student], args: ARGS })

    assert.deepStrictEqual(
      studyTracks.map(({ code }) => code),
      ['track-1']
    )
  })
})
