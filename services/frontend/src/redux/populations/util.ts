import type { FetchBaseQueryMeta } from '@reduxjs/toolkit/query'
import { getProgressCriteria } from '@/redux/populations/criteriaProgress'
import type { PopulationCourseStats } from '@oodikone/shared/routes/populations'
import { CreditTypeCode } from '@oodikone/shared/types'
import type { FormattedStudent, ProgressCriteria, Unarray } from '@oodikone/shared/types'

type PopulationCourseStatsEnrollment = Omit<Unarray<PopulationCourseStats['enrollments']>, 'studentnumber'>
export type PopulationCourseStatsCredit = Omit<Unarray<PopulationCourseStats['credits']>, 'student_studentnumber'>

export interface ExpandedCourseStats extends PopulationCourseStats {
  dataByStudent: Map<string, [PopulationCourseStatsEnrollment[], PopulationCourseStatsCredit[]]>
}

type RequiredFields = {
  students: Omit<FormattedStudent, 'criteriaProgress' | 'courses' | 'enrollments'>[]
  criteria: ProgressCriteria
  coursestatistics: PopulationCourseStats
}

export type Output<T> = T & {
  students: FormattedStudent[]
  coursestatistics: ExpandedCourseStats
}

export const formatPopulationData = <T extends RequiredFields>(
  { students, coursestatistics, ...otherParams }: T,
  _: FetchBaseQueryMeta | undefined,
  query: any
) => {
  const code = query?.programme ?? ''
  // TODO: These are typed incorrectly with attainment_date and enrollment_date_time as Dates (they are strings)
  const credits = coursestatistics.credits.sort(
    (a, b) => new Date(b.attainment_date).getTime() - new Date(a.attainment_date).getTime()
  )
  const enrollments = coursestatistics.enrollments.sort(
    (a, b) => new Date(b.enrollment_date_time).getTime() - new Date(a.enrollment_date_time).getTime()
  )

  const studentNumbers = students.map(({ studentNumber }) => studentNumber)
  const creditsAndEnrollmentsByStudent: ExpandedCourseStats['dataByStudent'] = new Map(
    studentNumbers.map(n => [n, [[], []]])
  )

  for (const enrollment of enrollments) {
    const { studentnumber, ...rest } = enrollment
    creditsAndEnrollmentsByStudent.get(studentnumber)![0].push(rest)
  }

  for (const credit of credits) {
    const { student_studentnumber: studentnumber, ...rest } = credit
    creditsAndEnrollmentsByStudent.get(studentnumber)![1].push(rest)
  }

  const formattedStudents = students.map(student => {
    const [enrollments, credits] = creditsAndEnrollmentsByStudent.get(student.studentNumber)!
    const hops = student.studyplans.find(plan => plan.programme_code === code)

    return {
      ...student,
      criteriaProgress: getProgressCriteria(otherParams.criteria, student.studyrightStart, hops, credits),
      courses: credits.map(credit => {
        const passed = [CreditTypeCode.PASSED, CreditTypeCode.APPROVED].includes(credit.credittypecode)

        return {
          course_code: credit.course_code,
          date: credit.attainment_date,
          passed,
          grade: passed ? credit.grade : 'Hyl.',
          credits: credit.credits,
          isStudyModuleCredit: credit.isStudyModule,
          credittypecode: credit.credittypecode,
          language: credit.language,
          studyright_id: credit.studyright_id,
        }
      }),
      enrollments,
    }
  })

  return {
    students: formattedStudents,
    coursestatistics: {
      ...coursestatistics,
      dataByStudent: creditsAndEnrollmentsByStudent,
    },
    ...otherParams,
  }
}
