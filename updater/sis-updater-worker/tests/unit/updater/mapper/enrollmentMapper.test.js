import { describe, expect, it } from 'vitest'

import './initTests.js'

import { enrollmentMapper } from '@/updater/mapper.js'
import { getSemesterByDate } from '@/updater/shared.js'

describe('enrollmentMapper', () => {
  const baseEnrollment = {
    id: 'e1',
    person_id: 'p1',
    course_unit_id: 'cu1',
    course_unit_realisation_id: 'real1',
    enrolment_date_time: '2020-01-01T00:00:00Z',
    state: 'ACTIVE',
    study_right_id: null,
  }

  const mapEnrollment = (overrides = {}) =>
    enrollmentMapper(
      overrides.personIdToStudentNumber ?? { p1: '014111111' },
      overrides.courseUnitIdToCourseUnit ?? { cu1: { code: 'TKT10', group_id: 'grp1' } },
      overrides.realisationIdToActivityPeriod ?? {},
      overrides.studyRightIdToEducationType ?? {}
    )

  it('returns null when the student number cannot be resolved', () => {
    expect(mapEnrollment({ personIdToStudentNumber: {} })(baseEnrollment)).toBeNull()
  })

  it('returns null when the course unit cannot be resolved', () => {
    expect(mapEnrollment({ courseUnitIdToCourseUnit: {} })(baseEnrollment)).toBeNull()
  })

  it('maps an enrollment correctly', () => {
    getSemesterByDate.mockReturnValue({ semestercode: 5, composite: 'sem5' })

    expect(mapEnrollment()(baseEnrollment)).toEqual({
      id: 'e1',
      studentnumber: '014111111',
      state: 'ACTIVE',
      course_code: 'TKT10',
      semestercode: 5,
      semester_composite: 'sem5',
      enrollment_date_time: '2020-01-01T00:00:00Z',
      is_open: false,
      course_id: 'cu1',
      course_group_id: 'grp1',
      studyright_id: null,
    })
  })
})
