import { FormattedStudent, StudentCourse } from '@oodikone/shared/types/studentData'

export type CourseMatrixCourse = {
  code: string
  name: string
  credits: number
}

export type CourseMatrixRow = {
  studentNumber: string
  name: string
  courses: CourseMatrixCourse[]
}

export type CourseMatrixAggregate = {
  code: string
  name: string
  credits: number
  students: number
}

/**
 * Passed completions of the student that are included in one of the student's study plans (HOPS).
 * Returns the latest completion per course code, sorted by course code.
 */
export const getHopsCourses = (student: FormattedStudent): StudentCourse[] => {
  const hopsCourseCodes = new Set(student.studyplans?.flatMap(plan => plan.included_courses ?? []) ?? [])
  const passedCoursesInHops = student.courses.filter(course => course.passed && hopsCourseCodes.has(course.course_code))

  const latestByCode = new Map<string, StudentCourse>()
  for (const course of passedCoursesInHops) {
    if (!course.course_code) continue

    const existing = latestByCode.get(course.course_code)
    if (!existing || new Date(course.date).getTime() > new Date(existing.date).getTime()) {
      latestByCode.set(course.course_code, course)
    }
  }

  return [...latestByCode.values()].sort((a, b) => a.course_code.localeCompare(b.course_code))
}

export const calculateExcelData = (students: FormattedStudent[], courseNameByCode: Map<string, string>) => {
  const counters = new Map<string, { name: string; credits: number; students: Set<string> }>()

  const rows = students.map(student => {
    const courses = getHopsCourses(student).map(course => {
      const code = course.course_code
      const counter = counters.get(code) ?? {
        name: courseNameByCode.get(code) ?? '',
        credits: 0,
        students: new Set(),
      }
      counters.set(code, counter)
      counter.credits += course.credits ?? 0
      counter.students.add(student.studentNumber)

      return { code, name: courseNameByCode.get(code) ?? '', credits: course.credits ?? 0 }
    })

    return { studentNumber: student.studentNumber, studentName: student.name, courses }
  })

  const completedCoursesRows = rows.map(({ studentNumber, studentName: name, courses }) => [
    studentNumber,
    name,
    ...courses.map(course => `${course.name} (${course.code})`),
  ])

  const courseCounterRows = [...counters.entries()]
    .map(([code, { name, credits, students }]) => [code, name, students.size.toString(), credits.toString()])
    .sort(([_a, __a, aStudents], [_b, __b, bStudents]) => parseInt(bStudents) - parseInt(aStudents))

  return { completedCoursesRows, courseCounterRows }
}
