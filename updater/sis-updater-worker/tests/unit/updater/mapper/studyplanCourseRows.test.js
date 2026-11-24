import { describe, expect, it } from 'vitest'

import './initTests.js'

import { studyplanCourseRows } from '@/updater/mapper.js'

describe('studyplanCourseRows', () => {
  it('maps included courses and modules to studyplan-course rows', () => {
    const studyplans = [{ id: 'sp1', included_courses: ['cu1', 'cu2'], includedModules: ['mod1'] }]

    expect(studyplanCourseRows(studyplans)).toEqual([
      { studyplan_id: 'sp1', course_id: 'cu1' },
      { studyplan_id: 'sp1', course_id: 'cu2' },
      { studyplan_id: 'sp1', course_id: 'mod1' },
    ])
  })

  it('creates one row for an id included as both a course and a module', () => {
    const studyplans = [{ id: 'sp1', included_courses: ['mod1'], includedModules: ['mod1'] }]

    expect(studyplanCourseRows(studyplans)).toEqual([{ studyplan_id: 'sp1', course_id: 'mod1' }])
  })

  it('removes duplicate ids within a studyplan', () => {
    const studyplans = [{ id: 'sp1', included_courses: ['cu1', 'cu1', 'cu2'], includedModules: [] }]

    expect(studyplanCourseRows(studyplans)).toEqual([
      { studyplan_id: 'sp1', course_id: 'cu1' },
      { studyplan_id: 'sp1', course_id: 'cu2' },
    ])
  })

  it('keeps the same course for different studyplans', () => {
    const studyplans = [
      { id: 'sp1', included_courses: ['cu1'], includedModules: [] },
      { id: 'sp2', included_courses: ['cu1'], includedModules: [] },
    ]

    expect(studyplanCourseRows(studyplans)).toEqual([
      { studyplan_id: 'sp1', course_id: 'cu1' },
      { studyplan_id: 'sp2', course_id: 'cu1' },
    ])
  })

  it('drops missing ids', () => {
    const studyplans = [{ id: 'sp1', included_courses: ['cu1', null, ''], includedModules: [undefined] }]

    expect(studyplanCourseRows(studyplans)).toEqual([{ studyplan_id: 'sp1', course_id: 'cu1' }])
  })

  it('returns no rows for studyplans without included ids', () => {
    expect(studyplanCourseRows([{ id: 'sp1', included_courses: [], includedModules: [] }])).toEqual([])
    expect(studyplanCourseRows([{ id: 'sp1' }])).toEqual([])
    expect(studyplanCourseRows([])).toEqual([])
  })

  it('sorts rows by studyplan id and course id', () => {
    const studyplans = [
      { id: 'sp2', included_courses: ['cu2'], includedModules: ['cu1'] },
      { id: 'sp1', included_courses: ['cu3'], includedModules: [] },
    ]

    expect(studyplanCourseRows(studyplans)).toEqual([
      { studyplan_id: 'sp1', course_id: 'cu3' },
      { studyplan_id: 'sp2', course_id: 'cu1' },
      { studyplan_id: 'sp2', course_id: 'cu2' },
    ])
  })
})
