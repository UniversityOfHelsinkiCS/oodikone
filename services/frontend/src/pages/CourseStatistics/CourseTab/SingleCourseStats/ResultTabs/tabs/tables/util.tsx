import { flatten } from 'lodash'

import { FAILED_GRADES, NUMERIC_GRADES, OTHER_PASSED_GRADES } from '@/constants/grades'
import { FormattedStats } from '@/types/courseStat'
import { ObfuscatedCell } from './ObfuscatedCell'

export const formatPercentage = (rate: number) => {
  return Number.isNaN(rate) ? '–' : `${rate.toFixed(2)} %`
}

export const getGradeColumns = (grades: { key: string; title: string }[]) => {
  return grades.map(({ key, title }) => ({
    id: `students.grades.${key}`,
    accessorFn: row => row.students.grades[key],
    header: title,
    Cell: ({ cell, row }) => (row.original.rowObfuscated ? <ObfuscatedCell /> : cell.getValue() || 0),
  }))
}

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

const sortGrades = (a: string, b: string) => gradesOrder[a] - gradesOrder[b]

const getSortedGrades = (grades: string[]) => {
  return grades.sort(sortGrades).map(grade => {
    if (grade === '0') {
      return { key: grade, title: 'Failed' }
    }
    if (OTHER_PASSED_GRADES.includes(grade.toLowerCase())) {
      return { key: grade, title: 'Other passed' }
    }
    return { key: grade, title: grade.charAt(0).toUpperCase() + grade.slice(1) }
  })
}

export const resolveGrades = (stats: FormattedStats[]) => {
  const allGrades = [
    '0',
    ...flatten(
      stats.map(({ students }) =>
        [...Object.keys(students.grades)].map(grade => {
          const parsedGrade = Number(grade) ? Math.round(Number(grade)).toString() : grade
          if (FAILED_GRADES.includes(parsedGrade.toLowerCase())) {
            return '0'
          }
          if (parsedGrade === 'LA') {
            return 'LUB'
          }
          return parsedGrade
        })
      )
    ),
  ] as string[]
  if (allGrades.filter(grade => NUMERIC_GRADES.includes(grade)).length) {
    allGrades.push(...NUMERIC_GRADES)
  }
  const grades = [...new Set(allGrades)]
  return getSortedGrades(grades)
}
