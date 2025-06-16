import type { Bottlenecks } from '@oodikone/shared/routes/populations'
import type { EncrypterData } from '@oodikone/shared/types'
import { getPassingSemester } from '../../util/semester'
import { encrypt, decrypt } from '../encrypt'
import { CourseStatsCounter } from './courseStatsCounter'
import { findCourses, parseCreditInfo } from './shared'

/**
 * Encrypts the data in-place.
 */
const encryptStudentNumbers = (bottlenecks: Bottlenecks) => {
  for (const course of Object.keys(bottlenecks.coursestatistics)) {
    const encryptedStudentStats = {}
    for (const data of Object.keys(bottlenecks.coursestatistics[course].students)) {
      encryptedStudentStats[data] = {}
      const studentnumbers = Object.keys(bottlenecks.coursestatistics[course].students[data])
      studentnumbers.forEach(studentnumber => {
        encryptedStudentStats[data][encrypt(studentnumber).encryptedData] =
          bottlenecks.coursestatistics[course].students[data][studentnumber]
      })
    }
    bottlenecks.coursestatistics[course].students = encryptedStudentStats
  }
}

export const bottlenecksOf = async (
  selectedStudents: string[],
  selectedStudentsByYear: { [year: string]: string[] },
  selectedCourses: string[],
  isEncrypted: boolean
) => {
  // HACK: Encrypted students can't be decrypted if passed as strings
  if (isEncrypted) selectedStudents = (selectedStudents as unknown as EncrypterData[]).map(decrypt)

  // HACK: If year isn't present or is invalid, return MAGIC_NUMBER.
  //       The new degree programs start on 2017.
  const getYear = (studentnumber: string): number => {
    const MAGIC_NUMBER = 2017
    for (const [year, students] of Object.entries(selectedStudentsByYear)) {
      if (students.includes(studentnumber)) return parseInt(year, 10) || MAGIC_NUMBER
    }

    return MAGIC_NUMBER
  }

  const selectedStudentCount = selectedStudents.length
  const stats = new Map<string, CourseStatsCounter>()

  const courses = await findCourses(selectedStudents, selectedCourses)
  for (const course of courses) {
    const { code: mainCode, name: mainName } = courses.find(({ code }) => code == course?.main_course_code) ?? course
    const coursestats = stats.get(mainCode) ?? new CourseStatsCounter(mainCode, mainName)

    coursestats.addCourseSubstitutions(course.substitutions)
    course.enrollments?.forEach(({ studentnumber, state, enrollment_date_time }) => {
      // HACK: date should already be Date object
      const initialDate = new Date(enrollment_date_time)
      const semester = getPassingSemester(getYear(studentnumber), initialDate)
      coursestats.markEnrollment(studentnumber, state, semester)
    })
    course.credits
      ?.map(parseCreditInfo)
      .forEach(({ studentnumber, passingGrade, improvedGrade, failingGrade, grade, date }) => {
        // HACK: date should already be Date object
        const initialDate = new Date(date)
        const semester = getPassingSemester(getYear(studentnumber), initialDate)
        coursestats.markCredit(studentnumber, grade, passingGrade, failingGrade, improvedGrade, semester)
      })

    stats.set(mainCode, coursestats)
  }

  const bottlenecks: Bottlenecks = {
    allStudents: selectedStudentCount,
    coursestatistics: Array.from(stats.values()).map(coursestatistics =>
      coursestatistics.getFinalStats(selectedStudentCount)
    ),
  }

  if (isEncrypted) encryptStudentNumbers(bottlenecks)

  return bottlenecks
}
