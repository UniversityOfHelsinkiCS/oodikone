import { orderBy } from 'lodash'
import { Op, QueryTypes } from 'sequelize'

import { dbConnections } from '../../database/connection'
import { Credit, Enrollment, SISStudyRight, SISStudyRightElement } from '../../models'
import { Name } from '../../shared/types'
import { DegreeProgrammeType, EnrollmentState } from '../../types'

const { sequelize } = dbConnections

export const getCurriculumVersion = (curriculumPeriodId: string) => {
  if (!curriculumPeriodId) {
    return null
  }
  const versionNumber = parseInt(curriculumPeriodId.slice(-2), 10)
  const year = versionNumber + 1949
  const startYear = Math.floor((year - 1) / 3) * 3 + 1
  const endYear = startYear + 3
  const curriculumVersion = `${startYear}-${endYear}`
  return curriculumVersion
}

export const getOptionsForStudents = async (
  studentNumbers: string[],
  code: string,
  level?: DegreeProgrammeType
): Promise<Record<string, { name: Name }>> => {
  if (!studentNumbers.length) {
    return {}
  } else if (level && ![DegreeProgrammeType.BACHELOR, DegreeProgrammeType.MASTER].includes(level)) {
    return {}
  }

  const studyRightElementsForStudyRight = await SISStudyRightElement.findAll({
    attributes: [],
    where: {
      code,
    },
    include: [
      {
        model: SISStudyRight,
        attributes: ['studentNumber'],
        where: {
          studentNumber: {
            [Op.in]: studentNumbers,
          },
        },
        include: [
          {
            model: SISStudyRightElement,
            attributes: ['code', 'name', 'degreeProgrammeType', 'startDate', 'endDate'],
          },
        ],
      },
    ],
  })

  return Object.fromEntries(
    studyRightElementsForStudyRight
      .map(({ studyRight }) => {
        const levelIsMasters = level === DegreeProgrammeType.MASTER
        const filter = levelIsMasters ? DegreeProgrammeType.BACHELOR : DegreeProgrammeType.MASTER

        // NOTE: If in masters, then select latest finished bachlor studyRight otherwise select first started masters studyRight
        const [latestProgramme] = orderBy(
          studyRight.studyRightElements.filter(element => element.degreeProgrammeType === filter),
          [levelIsMasters ? 'endDate' : 'startDate'],
          [levelIsMasters ? 'desc' : 'asc']
        )

        return [studyRight.studentNumber, { name: latestProgramme?.name }] as [string, { name: Name }]
      })
      .filter(([_, { name }]) => !!name)
  )
}

export type EnrollmentsQueryResult = Array<{
  code: string
  name: Name
  substitutions: string[]
  main_course_code: string
  enrollments: Array<Pick<Enrollment, 'studentnumber' | 'state' | 'enrollment_date_time'>> | null
}>

type CreditPick = Pick<Credit, 'grade' | 'student_studentnumber' | 'attainment_date' | 'credittypecode' | 'course_code'>

export type CoursesQueryResult = Array<
  EnrollmentsQueryResult[number] & {
    credits: Array<CreditPick>
  }
>

const findDefinedCourseStatsForStudents = `
  SELECT
    course.code,
    course.name,
    course.substitutions,
    course.main_course_code,
    enrollment.data AS enrollments,
    credit.data AS credits
  FROM course
  LEFT JOIN (
    SELECT
      course_code,
      ARRAY_AGG(JSONB_BUILD_OBJECT(
        'studentnumber', studentnumber,
        'state', state,
        'enrollment_date_time', enrollment_date_time
      )) AS data
    FROM enrollment
    WHERE studentnumber IN (:studentnumbers)
      AND state = :enrollmentState
    GROUP BY course_code
  ) AS enrollment
    ON enrollment.course_code = course.code
  LEFT JOIN (
    SELECT
      course_code,
      ARRAY_AGG(JSONB_BUILD_OBJECT(
        'grade', grade,
        'student_studentnumber', student_studentnumber,
        'attainment_date', attainment_date,
        'credittypecode', credittypecode,
        'course_code', course_code
      )) AS data
    FROM credit
    WHERE student_studentnumber IN (:studentnumbers)
    GROUP BY course_code
  ) AS credit
    ON credit.course_code = course.code
  WHERE
    (
      course.code IN (:courseCodes)
      OR (
        SELECT
          JSONB_AGG(DISTINCT alt_code)
        FROM course, LATERAL JSONB_ARRAY_ELEMENTS(substitutions) as alt_code
        WHERE code IN (:courseCodes)
      ) ? course.code
    ) AND (enrollment.data IS NOT NULL OR credit.data IS NOT NULL)
`

const findAllCourseStatsForStudents = `
  SELECT
    course.code,
    course.name,
    course.substitutions,
    course.main_course_code,
    enrollment.data AS enrollments,
    credit.data AS credits
  FROM course
  LEFT JOIN (
    SELECT
      course_code,
      ARRAY_AGG(JSONB_BUILD_OBJECT(
        'studentnumber', studentnumber,
        'state', state,
        'enrollment_date_time', enrollment_date_time
      )) AS data
    FROM enrollment
    WHERE studentnumber IN (:studentnumbers)
      AND state = :enrollmentState
    GROUP BY course_code
  ) AS enrollment
    ON enrollment.course_code = course.code
  LEFT JOIN (
    SELECT
      course_code,
      ARRAY_AGG(JSONB_BUILD_OBJECT(
        'grade', grade,
        'student_studentnumber', student_studentnumber,
        'attainment_date', attainment_date,
        'credittypecode', credittypecode,
        'course_code', course_code
      )) AS data
    FROM credit
    WHERE student_studentnumber IN (:studentnumbers)
    GROUP BY course_code
  ) AS credit
    ON credit.course_code = course.code
  WHERE
    enrollment.data IS NOT NULL OR credit.data IS NOT NULL
`

export const findCourses = async (studentNumbers: string[], courses: string[] = []) => {
  return sequelize.query(courses.length ? findDefinedCourseStatsForStudents : findAllCourseStatsForStudents, {
    replacements: {
      studentnumbers: studentNumbers.length > 0 ? studentNumbers : ['DUMMY'],
      courseCodes: courses.length ? courses : ['DUMMY'],
      enrollmentState: EnrollmentState.ENROLLED,
    },
    type: QueryTypes.SELECT,
  }) as Promise<CoursesQueryResult>
}

export const parseCreditInfo = (credit: CreditPick) => {
  return {
    studentnumber: credit.student_studentnumber,
    grade: credit.grade,
    passingGrade: Credit.passed(credit),
    failingGrade: Credit.failed(credit),
    improvedGrade: Credit.improved(credit),
    date: credit.attainment_date,
  }
}
