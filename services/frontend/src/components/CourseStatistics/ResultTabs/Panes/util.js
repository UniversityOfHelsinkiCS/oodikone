import { flatten } from 'lodash'
import { calculatePercentage } from 'common'

const gradesMap = {
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
}

export const getDataObject = (name, data, stack) => ({ name, data, stack })

export const getMaxValueOfSeries = series =>
  Object.values(series).reduce((acc, cur) => {
    const curMax = Math.max(...cur.data.filter(n => !Number.isNaN(n)).map(Math.abs))
    return curMax >= acc ? curMax : acc
  }, 0)

const THESIS_GRADE_KEYS = ['I', 'A', 'NSLA', 'LUB', 'CL', 'MCLA', 'ECLA', 'L']

const sortGrades = (a, b) => gradesMap[a] - gradesMap[b]

export const isThesisGrades = grades => Object.keys(grades).some(k => THESIS_GRADE_KEYS.includes(k))

export const isThesisSeries = series => series && series.some(s => isThesisGrades(s))

export const absoluteToRelative = all => (p, i) => parseFloat(calculatePercentage(p, all[i]).slice(0, -1))

export const resolveGrades = stats => {
  const failedGrades = ['eisa', 'hyl.', 'hyl', '0', 'luop']
  const otherPassedGrades = ['hyv.', 'hyv']

  const allGrades = [
    '0',
    ...flatten(
      stats.map(({ students }) =>
        [...Object.keys(students.grades)].map(grade => {
          const parsedGrade = Number(grade) ? Math.round(Number(grade)).toString() : grade
          if (failedGrades.includes(parsedGrade.toLowerCase())) return '0'
          if (parsedGrade === 'LA') return 'LUB' // merge LA and LUB grades
          return parsedGrade
        })
      )
    ),
  ]

  // If any of grades 1-5 is present, make sure that full the grade scale is present
  if (allGrades.filter(grade => ['1', '2', '3', '4', '5'].includes(grade)).length)
    allGrades.push(...['1', '2', '3', '4', '5'])
  const grades = [...new Set(allGrades)]

  return grades.sort(sortGrades).map(grade => {
    if (grade === '0') return { key: grade, title: 'Failed' }
    if (otherPassedGrades.includes(grade.toLowerCase())) return { key: grade, title: 'Other passed' }
    return { key: grade, title: grade.charAt(0).toUpperCase() + grade.slice(1) }
  })
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

export const getThesisGradeSpread = (series, isRelative) => {
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
  }
  const newSeries = series.reduce(
    (acc, cur, i) => {
      const currentEntries = Object.entries(cur)
      currentEntries.forEach(([k, v]) => {
        const merged = k === 'LA' ? 'LUB' : k
        acc[merged].push(v)
      })

      Object.entries(acc).forEach(([k, v]) => {
        if (v.length < i + 1) {
          acc[k].push(0)
        }
      })

      return acc
    },
    { ...thesisGradeAccumulator }
  )
  const total = Object.keys(newSeries).reduce((acc, curr) => {
    const numOfGrades = newSeries[curr][0]
    return acc + numOfGrades
  }, 0)

  const relative = Object.keys(newSeries).reduce((acc, curr) => {
    acc[curr] = `${Math.round((newSeries[curr][0] / total) * 10000) / 100}%`
    return acc
  }, {})

  return isRelative ? relative : newSeries
}

export const getGradeSpread = (series, isRelative) => {
  const failedKeys = ['eisa', 'hyl.', 'hyl', '0', 'luop']

  const baseAccumalator = {
    0: [],
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    HT: [],
    TT: [],
    'Hyv.': [],
  }

  const newSeries = series.reduce(
    (acc, cur, i) => {
      const currentEntries = Object.entries(cur)
      let failed = 0
      currentEntries.forEach(([k, v]) => {
        if (failedKeys.includes(k.toLowerCase())) {
          failed += v
        } else {
          const parsedGrade = Number(k) ? Math.round(Number(k)) : k
          acc[parsedGrade].push(v)
        }
      })
      acc[0].push(failed)
      Object.entries(acc).forEach(([k, v]) => {
        if (v.length < i + 1) {
          acc[k].push(0)
        }
      })

      return acc
    },
    { ...baseAccumalator }
  )
  const total = Object.keys(newSeries).reduce((acc, curr) => {
    const numOfGrades = newSeries[curr][0]
    return acc + numOfGrades
  }, 0)

  const relative = Object.keys(newSeries).reduce((acc, curr) => {
    acc[curr] = `${Math.round((newSeries[curr][0] / total) * 10000) / 100}%`
    return acc
  }, {})

  return isRelative ? relative : newSeries
}

export const defineCellColor = s => {
  return s.rowObfuscated && { style: { color: 'gray' } }
}
