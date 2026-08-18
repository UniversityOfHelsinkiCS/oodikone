import { assert, describe, it } from 'vitest'

import { calculateExcelData, getHopsCourses } from '@/components/CustomPopulation/courseMatrix'
import { CreditTypeCode } from '@oodikone/shared/types'
import { FormattedStudent, StudentCourse, StudentStudyPlan } from '@oodikone/shared/types/studentData'

const createCourse = (
  course_code: string,
  credits: number,
  passed: boolean,
  date: Date,
  credittypecode: CreditTypeCode = passed ? CreditTypeCode.PASSED : CreditTypeCode.FAILED
): StudentCourse => ({
  course_code,
  date,
  passed,
  grade: passed ? '5' : 'Hyl.',
  credits,
  isStudyModuleCredit: false,
  credittypecode,
  language: 'fi',
  studyright_id: 'sr-1',
})

const createHops = (includedCourses: string[]): StudentStudyPlan => ({
  included_courses: includedCourses,
  programme_code: 'TEST',
  includedModules: [],
  completed_credits: 0,
  curriculum_period_id: 'cp-1',
  sis_study_right_id: 'sr-1',
})

const createStudent = (overrides: Partial<FormattedStudent>): FormattedStudent => ({
  firstnames: 'Testi',
  lastname: 'Opiskelija',
  started: new Date('2024-08-01'),
  studentNumber: '123456789',
  credits: 0,
  hopsCredits: 0,
  name: 'Testi Opiskelija',
  gender_code: '1',
  email: 'testi@example.com',
  secondaryEmail: '',
  phoneNumber: '',
  updatedAt: new Date(),
  tags: [],
  studyrightStart: '2024-08-01',
  option: null,
  birthdate: new Date('2000-01-01'),
  sis_person_id: '1',
  citizenships: [],
  criteriaProgress: {},
  curriculumVersion: null,
  hasPersonalIdentityCode: false,
  transferredStudyright: false,
  transferSource: undefined,
  studyRights: [],
  studyplans: [],
  courses: [],
  enrollments: [],
  ...overrides,
})

void describe('getHopsCourses', () => {
  void it('returns only passed courses included in the student HOPS', () => {
    const student = createStudent({
      courses: [
        createCourse('A', 5, true, new Date('2024-09-01')),
        createCourse('B', 5, true, new Date('2024-10-01')),
        createCourse('C', 5, false, new Date('2024-11-01')),
      ],
      studyplans: [createHops(['A', 'C'])],
    })

    const result = getHopsCourses(student)

    assert.equal(result.length, 1)
    assert.equal(result[0].course_code, 'A')
  })

  void it('returns an empty list when the student has no HOPS', () => {
    const student = createStudent({
      courses: [createCourse('A', 5, true, new Date('2024-09-01'))],
      studyplans: [],
    })

    assert.deepEqual(getHopsCourses(student), [])
  })

  void it('dedupes multiple completions keeping the latest', () => {
    const student = createStudent({
      courses: [createCourse('A', 5, true, new Date('2024-09-01')), createCourse('A', 6, true, new Date('2025-01-15'))],
      studyplans: [createHops(['A'])],
    })

    const result = getHopsCourses(student)

    assert.equal(result.length, 1)
    assert.equal(result[0].credits, 6)
  })
})

void describe('calculateExcelData', () => {
  void it('builds completed-course rows and aggregates credits per course', () => {
    const students = [
      createStudent({
        studentNumber: '1',
        courses: [createCourse('A', 5, true, new Date('2024-09-01'))],
        studyplans: [createHops(['A'])],
      }),
      createStudent({
        studentNumber: '2',
        courses: [
          createCourse('A', 5, true, new Date('2024-09-01')),
          createCourse('B', 3, true, new Date('2024-10-01')),
        ],
        studyplans: [createHops(['A', 'B'])],
      }),
    ]
    const courseNameByCode = new Map([
      ['A', 'Course A'],
      ['B', 'Course B'],
    ])

    const data = calculateExcelData(students, courseNameByCode)

    assert.deepEqual(data.completedCoursesRows, [
      ['1', 'Testi Opiskelija', 'Course A (A)'],
      ['2', 'Testi Opiskelija', 'Course A (A)', 'Course B (B)'],
    ])
    assert.deepEqual(data.courseCounterRows, [
      ['A', 'Course A', '2', '10'],
      ['B', 'Course B', '1', '3'],
    ])
  })

  void it('uses an empty name for courses missing from the course map', () => {
    const students = [
      createStudent({
        studentNumber: '1',
        courses: [createCourse('RANDOMCODE', 5, true, new Date('2024-09-01'))],
        studyplans: [createHops(['RANDOMCODE'])],
      }),
    ]

    const data = calculateExcelData(students, new Map())

    assert.deepEqual(data.completedCoursesRows, [['1', 'Testi Opiskelija', ' (RANDOMCODE)']])
    assert.deepEqual(data.courseCounterRows, [['RANDOMCODE', '', '1', '5']])
  })
})
