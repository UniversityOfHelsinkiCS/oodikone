import { ColumnDef } from '@tanstack/react-table'

import { FAILED_GRADES, NUMERIC_GRADES, OTHER_PASSED_GRADES } from '@/constants/grades'
import { ObfuscatedCell } from '@/pages/CourseStatistics/CourseTab/SingleCourseStats/ResultTabs/tabs/tables/ObfuscatedCell'
import { FormattedStats } from '@/types/courseStat'

export const formatPercentage = (rate: number) => {
  return Number.isNaN(rate) ? '–' : `${rate.toFixed(2)} %`
}

export const getGradeColumns = <T extends { grades: Record<string, number>; rowObfuscated?: boolean }>(
  grades: { key: string; title: string }[]
): ColumnDef<T>[] =>
  grades.map(({ key, title }) => ({
    id: `grades.${key}`,
    accessorFn: row => row.grades[key],
    header: title,
    cell: ctx => (ctx.row.original.rowObfuscated ? <ObfuscatedCell /> : (ctx.getValue() ?? 0)),
  }))

const gradesOrder = {
  0: 0,
  1: 10,
  2: 20,
  3: 30,
  4: 40,
  5: 50,
  'Hyv.': 60,
  I: 0,
  A: 1,
  LUB: 2,
  NSLA: 3,
  CL: 4,
  MCLA: 5,
  ECLA: 6,
  L: 7,
} as const

const getSortedGrades = (grades: string[]) =>
  grades
    .sort((a: string, b: string) => Number(gradesOrder[a] - gradesOrder[b]))
    .map(grade => {
      if (grade === '0') {
        return { key: grade, title: 'Failed' }
      } else if (OTHER_PASSED_GRADES.includes(grade.toLowerCase())) {
        return { key: grade, title: 'Other passed' }
      }

      return { key: grade, title: grade.charAt(0).toUpperCase() + grade.slice(1) }
    })

export const resolveGrades = (stats: FormattedStats[]) => {
  const studentGrades = new Set('0')

  stats.forEach(({ students }) => {
    Object.keys(students.grades).forEach(grade => {
      const parsedGrade = Number(grade) ? Math.round(Number(grade)).toString() : grade

      if (parsedGrade === 'LA') {
        studentGrades.add('LUB')
      } else if (!FAILED_GRADES.includes(parsedGrade.toLowerCase())) {
        studentGrades.add(parsedGrade)
      }
    })
  })

  if (Object.keys(studentGrades).some(grade => NUMERIC_GRADES.includes(grade))) {
    NUMERIC_GRADES.forEach(grade => studentGrades.add(grade))
  }

  return getSortedGrades([...studentGrades])
}
