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
 * Returns the latest completion per course id, sorted by course id.
 */
export const getHopsCourses = (student: FormattedStudent): StudentCourse[] => {
  const hopsCourseIds = new Set(student.studyplans?.flatMap(plan => plan.included_courses ?? []) ?? [])
  const passedCoursesInHops = student.courses.filter(course => course.passed && hopsCourseIds.has(course.course_id))

  const latestById = new Map<string, StudentCourse>()
  for (const course of passedCoursesInHops) {
    if (!course.course_id) continue

    const existing = latestById.get(course.course_id)
    if (!existing || new Date(course.date).getTime() > new Date(existing.date).getTime()) {
      latestById.set(course.course_id, course)
    }
  }

  return [...latestById.values()].sort((a, b) => a.course_id.localeCompare(b.course_id))
}

export const calculateExcelData = (
  students: FormattedStudent[],
  courseInfoById: Map<string, { code: string; name: string }>
) => {
  // Keyed by course_id internally so different courses are never accidentally merged;
  // code/name are only for display.
  const counters = new Map<string, { code: string; name: string; credits: number; students: Set<string> }>()

  const rows = students.map(student => {
    const courses = getHopsCourses(student).map(course => {
      const id = course.course_id
      const { code, name } = courseInfoById.get(id) ?? { code: id, name: '' }
      const counter = counters.get(id) ?? { code, name, credits: 0, students: new Set() }
      counters.set(id, counter)
      counter.credits += course.credits ?? 0
      counter.students.add(student.studentNumber)

      return { code, name, credits: course.credits ?? 0 }
    })

    return { studentNumber: student.studentNumber, studentName: student.name, courses }
  })

  const completedCoursesRows = rows.map(({ studentNumber, studentName: name, courses }) => [
    studentNumber,
    name,
    ...courses.map(course => `${course.name} (${course.code})`),
  ])

  const courseCounterRows = [...counters.values()]
    .map(({ code, name, credits, students }) => [code, name, students.size.toString(), credits.toString()])
    .sort(([_a, __a, aStudents], [_b, __b, bStudents]) => parseInt(bStudents) - parseInt(aStudents))

  return { completedCoursesRows, courseCounterRows }
}
