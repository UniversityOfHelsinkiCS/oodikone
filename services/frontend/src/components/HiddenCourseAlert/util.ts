import type { ProgrammeCourse } from '@oodikone/shared/types'

export const getHiddenCourseCodes = (courses: ProgrammeCourse[]): string[] =>
  courses.filter(course => course.visible.visibility === false).map(course => course.code)

/**
 * A module is hidden if every course that has it as the parent is hidden
 */
export const getHiddenModuleCodes = (courses: ProgrammeCourse[]): string[] => {
  const moduleVisibility = new Map<string, boolean>()
  for (const course of courses) {
    if (!course.parent_code) continue
    const visible = course.visible.visibility !== false
    moduleVisibility.set(course.parent_code, (moduleVisibility.get(course.parent_code) ?? false) || visible)
  }

  return [...moduleVisibility.entries()].filter(([, visible]) => !visible).map(([code]) => code)
}
