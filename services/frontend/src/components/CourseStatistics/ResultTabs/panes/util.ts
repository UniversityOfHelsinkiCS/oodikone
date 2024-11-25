import { flatten } from 'lodash'

import { calculatePercentage } from '@/common'

type Series = {
  name: string
  data: number[]
  stack: string
  type: 'column'
}

export const getDataObject = (name: string, data: number[], stack: string): Series => {
  return {
    name,
    data,
    stack,
    type: 'column' as const,
  }
}

export const getMaxValueOfSeries = (series: Series[]) => {
  return Object.values(series).reduce((acc, cur) => {
    const curMax = Math.max(...cur.data.filter(n => !Number.isNaN(n)).map(Math.abs))
    return curMax >= acc ? curMax : acc
  }, 0)
}

const THESIS_GRADES = ['I', 'A', 'NSLA', 'LUB', 'CL', 'MCLA', 'ECLA', 'L']
const SECOND_NATIONAL_LANGUAGE_GRADES = ['TT', 'HT']
const PASS_FAIL_GRADES = ['0', 'Hyv.']
const NUMERIC_GRADES = ['1', '2', '3', '4', '5']

export const isThesisGrades = (grades: Record<string, number>) => {
  return Object.keys(grades).some(grade => THESIS_GRADES.includes(grade))
}

const isThesisSeries = (series: Array<Record<string, number>>) => {
  return series?.some(record => isThesisGrades(record))
}

const isSecondNationalLanguageSeries = (series: Array<Record<string, number>>) => {
  return series?.every(record => {
    const grades = Object.keys(record)
    const hasPassFailGrades = grades.some(grade => PASS_FAIL_GRADES.includes(grade))
    const hasNumericGrades = grades.some(grade => NUMERIC_GRADES.includes(grade))
    const hasSecondNationalLanguageGrades = grades.some(grade => SECOND_NATIONAL_LANGUAGE_GRADES.includes(grade))
    return !hasNumericGrades && hasPassFailGrades && hasSecondNationalLanguageGrades
  })
}

const isPassFailSeries = (series: Array<Record<string, number>>) => {
  return series?.every(record => {
    const grades = Object.keys(record)
    const hasPassFailGrades = grades.some(grade => PASS_FAIL_GRADES.includes(grade))
    const hasNumericGrades = grades.some(grade => NUMERIC_GRADES.includes(grade))
    const hasSecondNationalLanguageGrades = grades.some(grade => SECOND_NATIONAL_LANGUAGE_GRADES.includes(grade))
    return !hasNumericGrades && hasPassFailGrades && !hasSecondNationalLanguageGrades
  })
}

export const getSeriesType = (series: Array<Record<string, number>>) => {
  if (isThesisSeries(series)) {
    return 'thesis'
  }
  if (isSecondNationalLanguageSeries(series)) {
    return 'second-national-language'
  }
  if (isPassFailSeries(series)) {
    return 'pass-fail'
  }
  return 'other'
}

export const absoluteToRelative = (all: number[]) => (p: number, i: number) => {
  return parseFloat(calculatePercentage(p, all[i]).slice(0, -1))
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

const FAILED_GRADES = ['eisa', 'hyl.', 'hyl', '0', 'luop']
const OTHER_PASSED_GRADES = ['hyv.', 'hyv']

const getSortedGrades = (grades: string[]) => {
  return grades.sort(sortGrades).map(grade => {
    if (grade === '0') {
      return { key: grade, title: 'Failed' }
    }
    if (OTHER_PASSED_GRADES.includes(grade.toLowerCase())) {
      return { key: grade, title: 'Other\npassed' }
    }
    return { key: grade, title: grade.charAt(0).toUpperCase() + grade.slice(1) }
  })
}

export const resolveGrades = stats => {
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
    allGrades.push(...['1', '2', '3', '4', '5'])
  }
  const grades = [...new Set(allGrades)]
  return getSortedGrades(grades)
}

export const getSortableColumn = opts => ({
  filterType: 'range',
  cellProps: s => ({
    style: {
      textAlign: 'right',
      color: s.rowObfuscated ? 'gray' : 'inherit',
    },
  }),
  ...opts,
})

const accumulateGrades = (
  series: Array<Record<string, number>>,
  baseAccumulator: Record<string, number[]>,
  getMergedKey: (key: string) => string,
  failedKeys: string[] = []
) => {
  return series.reduce(
    (acc, cur, i) => {
      const currentEntries = Object.entries(cur)
      let failed = 0

      currentEntries.forEach(([k, v]) => {
        const mergedKey = getMergedKey(k)
        if (failedKeys.includes(mergedKey.toLowerCase())) {
          failed += v
        } else {
          acc[mergedKey].push(v)
        }
      })

      if (failed > 0 && acc[0]) {
        acc[0].push(failed)
      }

      Object.entries(acc).forEach(([k, v]) => {
        if (v.length < i + 1) {
          acc[k].push(0)
        }
      })

      return acc
    },
    { ...baseAccumulator } as Record<string, number[]>
  )
}

const calculateTotal = (series: Record<string, number[]>) => {
  return Object.keys(series).reduce((acc, curr) => {
    const numOfGrades = series[curr][0]
    return acc + numOfGrades
  }, 0)
}

const calculateRelative = (series: Record<string, number[]>, total: number) => {
  return Object.keys(series).reduce(
    (acc, curr) => {
      acc[curr] = `${Math.round((series[curr][0] / total) * 10000) / 100}%`
      return acc
    },
    {} as Record<string, string>
  )
}

export const getThesisGradeSpread = (series: Array<Record<string, number>>, isRelative?: boolean) => {
  const thesisGradeAccumulator = {
    L: [],
    ECLA: [],
    MCLA: [],
    CL: [],
    LUB: [],
    NSLA: [],
    A: [],
    I: [],
    0: [],
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    'Hyv.': [],
  } as Record<string, number[]>

  const getMergedKey = (key: string) => (key === 'LA' ? 'LUB' : key)

  const newSeries = accumulateGrades(series, thesisGradeAccumulator, getMergedKey)
  const total = calculateTotal(newSeries)

  return isRelative ? calculateRelative(newSeries, total) : newSeries
}

export const getGradeSpread = (series: Array<Record<string, number>>, isRelative?: boolean) => {
  const gradeAccumulator = {
    0: [],
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    HT: [],
    TT: [],
    'Hyv.': [],
  } as Record<string, number[]>

  const failedKeys = ['eisa', 'hyl.', 'hyl', '0', 'luop']

  const getMergedKey = (key: string) => (Number(key) ? Math.round(Number(key)).toString() : key)

  const newSeries = accumulateGrades(series, gradeAccumulator, getMergedKey, failedKeys)
  const total = calculateTotal(newSeries)

  return isRelative ? calculateRelative(newSeries, total) : newSeries
}

export const defineCellColor = (rowObfuscated: boolean) => {
  return rowObfuscated && { style: { color: 'gray' } }
}
