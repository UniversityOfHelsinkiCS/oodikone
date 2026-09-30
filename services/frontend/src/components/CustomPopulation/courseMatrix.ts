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
 * Returns the latest completion per course group, sorted by course group id.
 */
export const getHopsCourses = (student: FormattedStudent): StudentCourse[] => {
  const hopsCourseIds = new Set(student.studyplans?.flatMap(plan => plan.included_courses ?? []) ?? [])
  const passedCoursesInHops = student.courses.filter(course => course.passed && hopsCourseIds.has(course.course_id))

  const latestByGroupId = new Map<string, StudentCourse>()
  for (const course of passedCoursesInHops) {
    if (!course.courseGroupId) continue

    const existing = latestByGroupId.get(course.courseGroupId)
    if (!existing || new Date(course.date).getTime() > new Date(existing.date).getTime()) {
      latestByGroupId.set(course.courseGroupId, course)
    }
  }

  return [...latestByGroupId.values()].sort((a, b) => a.courseGroupId.localeCompare(b.courseGroupId))
}

export const calculateExcelData = (
  students: FormattedStudent[],
  courseInfoByGroupId: Map<string, { code: string; name: string }>
) => {
  // Keyed by course groupId internally so different courses are never accidentally merged,
  // while different versions of the same course are; code/name are only for display.
  const counters = new Map<string, { code: string; name: string; credits: number; students: Set<string> }>()

  const rows = students.map(student => {
    const courses = getHopsCourses(student).map(course => {
      const groupId = course.courseGroupId
      const { code, name } = courseInfoByGroupId.get(groupId) ?? { code: course.course_code, name: '' }
      const counter = counters.get(groupId) ?? { code, name, credits: 0, students: new Set() }
      counters.set(groupId, counter)
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
