import { getPassingSemester } from '../../util/semester'
import { type CourseStatistics, CourseStatsCounter } from '../courses/courseStatsCounter'
import { encrypt, decrypt } from '../encrypt'
import { findCourses, parseCreditInfo } from './shared'

export type Bottlenecks = {
  allStudents: number
  coursestatistics: CourseStatistics[]
}

export const bottlenecksOf = async (
  selectedStudents: string[],
  selectedStudentsByYear: { [year: string]: string[] },
  selectedCourses: string[],
  isEncrypted = false
) => {
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

  if (isEncrypted) selectedStudents = selectedStudents.map(decrypt)

  const courses = await findCourses(selectedStudents, selectedCourses)

  // HACK: If year isn't present or is invalid, return MAGIC_NUMBER.
  //       The new degree programs start on 2017.
  const getYear = (studentnumber: string): number => {
    const MAGIC_NUMBER = 2017
    for (const year in selectedStudentsByYear) {
      if (selectedStudentsByYear[year].includes(studentnumber)) {
        return parseInt(year, 10) || MAGIC_NUMBER
      }
    }

    return MAGIC_NUMBER
  }

  const selectedStudentCount = selectedStudents.length
  const stats = {} as Record<string, CourseStatsCounter>

  for (const course of courses) {
    const { code: mainCode, name: mainName } = courses.find(({ code }) => code == course?.main_course_code) ?? course
    const coursestats = stats[mainCode] ?? new CourseStatsCounter(mainCode, mainName)

    coursestats.addCourseSubstitutions(course.substitutions)
    course.enrollments?.forEach(({ studentnumber, state, enrollment_date_time }) => {
      const semester = getPassingSemester(getYear(studentnumber), enrollment_date_time)
      coursestats.markEnrollment(studentnumber, state, semester)
    })
    course.credits
      ?.map(parseCreditInfo)
      .forEach(({ studentnumber, passingGrade, improvedGrade, failingGrade, grade, date }) => {
        const semester = getPassingSemester(getYear(studentnumber), date)
        coursestats.markCredit(studentnumber, grade, passingGrade, failingGrade, improvedGrade, semester)
      })

    stats[mainCode] = coursestats
  }

  const bottlenecks: Bottlenecks = {
    allStudents: selectedStudentCount,
    coursestatistics: Object.values(stats).map(coursestatistics =>
      coursestatistics.getFinalStats(selectedStudentCount)
    ),
  }

  if (isEncrypted) {
    encryptStudentNumbers(bottlenecks)
  }

  return bottlenecks
}
