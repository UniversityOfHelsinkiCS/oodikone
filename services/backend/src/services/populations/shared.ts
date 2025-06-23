import { orderBy } from 'lodash'
import { Op } from 'sequelize'

import { Name, DegreeProgrammeType, EnrollmentState } from '@oodikone/shared/types'
import { SISStudyRightModel, SISStudyRightElementModel, CreditModel } from '../../models'
import { getPassingSemester, SemesterStart } from '../../util/semester'
import { StudentCredit, StudentData, StudentEnrollment } from './getStudentData'

type QueryParams = {
  semesters: string[]
  years: string[]
}

type ParsedQueryParams = {
  startDate: string
  endDate: string
}

export const parseDateRangeFromParams = (query: QueryParams): ParsedQueryParams => {
  const { semesters, years } = query
  const startingYear = Math.min(...years.map(y => +y))
  const endingYear = Math.max(...years.map(y => +y))

  const hasFall = semesters.includes('FALL')
  const hasSpring = semesters.includes('SPRING')

  const startDate = hasFall
    ? new Date(`${startingYear}-${SemesterStart.FALL}`).toISOString()
    : new Date(`${startingYear + 1}-${SemesterStart.SPRING}`).toISOString()

  const endDate = hasSpring
    ? new Date(`${endingYear + 1}-${SemesterStart.FALL}`).toISOString()
    : new Date(`${endingYear + 1}-${SemesterStart.SPRING}`).toISOString()

  return { startDate, endDate }
}
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
  degreeProgrammeType: DegreeProgrammeType | null
): Promise<Record<string, { name: Name }>> => {
  if (!code || !studentNumbers.length) {
    return {}
  } else if (
    degreeProgrammeType &&
    ![DegreeProgrammeType.BACHELOR, DegreeProgrammeType.MASTER].includes(degreeProgrammeType)
  ) {
    return {}
  }

  const studyRightElementsForStudyRight = await SISStudyRightElementModel.findAll({
    attributes: [],
    where: { code },
    include: {
      model: SISStudyRightModel,
      attributes: ['studentNumber'],
      where: {
        studentNumber: { [Op.in]: studentNumbers },
      },
      include: [
        {
          model: SISStudyRightElementModel,
          attributes: ['code', 'name', 'degreeProgrammeType', 'startDate', 'endDate'],
        },
      ],
    },
  })

  return Object.fromEntries(
    studyRightElementsForStudyRight
      .map(({ studyRight }) => {
        const levelIsMasters = degreeProgrammeType === DegreeProgrammeType.MASTER
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

const defaultCourse = {
  attempts: 0,
  enrollments: {
    [EnrollmentState.ENROLLED]: new Set(),
    [EnrollmentState.REJECTED]: new Set(),
    semesters: {
      BEFORE: {
        [EnrollmentState.ENROLLED]: new Set(),
        [EnrollmentState.REJECTED]: new Set(),
      },
      '0-FALL': {
        [EnrollmentState.ENROLLED]: new Set(),
        [EnrollmentState.REJECTED]: new Set(),
      },
      '0-SPRING': {
        [EnrollmentState.ENROLLED]: new Set(),
        [EnrollmentState.REJECTED]: new Set(),
      },
      '1-FALL': {
        [EnrollmentState.ENROLLED]: new Set(),
        [EnrollmentState.REJECTED]: new Set(),
      },
      '1-SPRING': {
        [EnrollmentState.ENROLLED]: new Set(),
        [EnrollmentState.REJECTED]: new Set(),
      },
      '2-FALL': {
        [EnrollmentState.ENROLLED]: new Set(),
        [EnrollmentState.REJECTED]: new Set(),
      },
      '2-SPRING': {
        [EnrollmentState.ENROLLED]: new Set(),
        [EnrollmentState.REJECTED]: new Set(),
      },
      '3-FALL': {
        [EnrollmentState.ENROLLED]: new Set(),
        [EnrollmentState.REJECTED]: new Set(),
      },
      '3-SPRING': {
        [EnrollmentState.ENROLLED]: new Set(),
        [EnrollmentState.REJECTED]: new Set(),
      },
      '4-FALL': {
        [EnrollmentState.ENROLLED]: new Set(),
        [EnrollmentState.REJECTED]: new Set(),
      },
      '4-SPRING': {
        [EnrollmentState.ENROLLED]: new Set(),
        [EnrollmentState.REJECTED]: new Set(),
      },
      '5-FALL': {
        [EnrollmentState.ENROLLED]: new Set(),
        [EnrollmentState.REJECTED]: new Set(),
      },
      '5-SPRING': {
        [EnrollmentState.ENROLLED]: new Set(),
        [EnrollmentState.REJECTED]: new Set(),
      },
      LATER: {
        [EnrollmentState.ENROLLED]: new Set(),
        [EnrollmentState.REJECTED]: new Set(),
      },
    },
  },
  grades: {},
  students: {
    all: new Set(),
    passed: new Set(),
    failed: new Set(),
    improvedPassedGrade: new Set(),
    markedToSemester: new Set(),
    enrolledNoGrade: new Set(),
  },

  stats: {
    passingSemesters: {
      BEFORE: 0,
      '0-FALL': 0,
      '0-SPRING': 0,
      '1-FALL': 0,
      '1-SPRING': 0,
      '2-FALL': 0,
      '2-SPRING': 0,
      '3-FALL': 0,
      '3-SPRING': 0,
      '4-FALL': 0,
      '4-SPRING': 0,
      '5-FALL': 0,
      '5-SPRING': 0,
      LATER: 0,
    },
  },
}

export const parseCourseData = (
  studyRightCode: string,
  studyRightStartDate: string,
  students: StudentData[],
  enrollments: StudentEnrollment[],
  credits: StudentCredit[]
) => {
  const getYear = (studentnumber: string) => {
    const student = students.find(student => student.studentnumber === studentnumber)

    return (
      student?.studyRights
        .flatMap(({ studyRightElements }) => studyRightElements)
        .find(element => element.code === studyRightCode)
        ?.startDate.getFullYear() ?? +studyRightStartDate
    )
  }

  const coursestats = new Map<string, typeof defaultCourse>()
  for (const enrollment of enrollments) {
    const { course_code, studentnumber, state, enrollment_date_time } = enrollment

    // We cannot display these
    if (course_code === null) continue

    if (!coursestats.has(course_code)) coursestats.set(course_code, structuredClone(defaultCourse))
    const course = coursestats.get(course_code)!

    const initialDate = new Date(enrollment_date_time)
    const semester = getPassingSemester(getYear(studentnumber), initialDate)

    course.enrollments[state].add(studentnumber)
    course.enrollments.semesters[semester][state].add(studentnumber)
  }

  for (const credit of credits) {
    const { course_code, student_studentnumber: studentnumber, grade, attainment_date: date } = credit

    // We cannot display these
    if (course_code === null) continue

    const passingGrade = CreditModel.passed(credit)
    const failingGrade = CreditModel.failed(credit)
    const improvedGrade = CreditModel.improved(credit)

    if (!coursestats.has(course_code)) coursestats.set(course_code, structuredClone(defaultCourse))
    const course = coursestats.get(course_code)!

    course.attempts += 1
    const gradeCount = course.grades[grade]?.count ?? 0
    course.grades[grade] = { count: gradeCount + 1, status: { passingGrade, failingGrade, improvedGrade } }

    course.students.all.add(studentnumber)
    if (passingGrade) {
      if (!course.students.markedToSemester.has(studentnumber)) {
        course.students.markedToSemester.add(studentnumber)

        const semester = getPassingSemester(getYear(studentnumber), new Date(date))
        course.stats.passingSemesters[semester]++
      }

      course.students.passed.add(studentnumber)
      course.students.failed.delete(studentnumber)
    } else if (improvedGrade) {
      course.students.improvedPassedGrade.add(studentnumber)
      course.students.passed.add(studentnumber)
      course.students.failed.delete(studentnumber)
    } else if (failingGrade && !course.students.passed.has(studentnumber)) {
      course.students.failed.add(studentnumber)
    }
  }

  return Array.from(coursestats.entries()).map(([code, { attempts, enrollments, grades, students, stats }]) => {
    return {
      course: {
        code,
        name: { en: code },
        substitutions: [],
      },
      attempts,
      enrollments: {
        [EnrollmentState.ENROLLED]: Array.from(enrollments[EnrollmentState.ENROLLED]),
        [EnrollmentState.REJECTED]: Array.from(enrollments[EnrollmentState.REJECTED]),
        semesters: Object.fromEntries(
          Object.entries(enrollments.semesters).map(([key, val]) => [
            key,
            {
              [EnrollmentState.ENROLLED]: Array.from(val[EnrollmentState.ENROLLED]),
              [EnrollmentState.REJECTED]: Array.from(val[EnrollmentState.REJECTED]),
            },
          ])
        ),
      },
      grades,
      students: Object.fromEntries(Object.entries(students).map(([key, val]) => [key, Array.from(val)])),
      stats,
    }
  })
}
