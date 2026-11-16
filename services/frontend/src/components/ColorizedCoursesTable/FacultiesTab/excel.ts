import type { NumberMode, Stats } from '@/components/ColorizedCoursesTable/SemestersTab/excel'
import type { Name } from '@oodikone/shared/types'

export type FacultiesTabCourse = {
  code: string
  name: Name
  bySemesters: { cellStats: Record<string, Stats | undefined>; facultiesTotal: Stats }
}

export const getFacultiesExcelRows = (
  courses: FacultiesTabCourse[],
  faculties: string[],
  numberMode: NumberMode,
  getTextIn: (name: Name) => string | null | undefined
): Record<string, string | number | undefined>[] =>
  courses.map(({ code, name, bySemesters }) => ({
    Course: code,
    Name: getTextIn(name) ?? '',
    ...Object.fromEntries(
      faculties.map(facultyCode => [facultyCode, bySemesters.cellStats[facultyCode]?.[numberMode] ?? 0])
    ),
    Total: bySemesters.facultiesTotal[numberMode],
  }))
