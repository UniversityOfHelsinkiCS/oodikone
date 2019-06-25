import { arrayOf, number, oneOfType, shape, string, oneOf } from 'prop-types'

export const viewModeNames = {
  CUMULATIVE: 'Cumulative',
  STUDENT: 'Student',
  GRADES: 'Grades'
}

export const getDataObject = (name, data, stack) => ({ name, data, stack })

export const getMaxValueOfSeries = series => Object.values(series).reduce((acc, cur) => {
  const curMax = Math.max(...cur.data.filter(n => !Number.isNaN(n)).map(Math.abs))
  return curMax >= acc ? curMax : acc
}, 0)

export const dataSeriesType = shape({
  name: string,
  code: oneOfType([string, number]),
  stats: arrayOf(shape({}))
})

export const viewModeType = oneOf(Object.values(viewModeNames))

export const THESIS_GRADE_KEYS = ['I', 'A', 'NSLA', 'LUB', 'CL', 'MCLA', 'ECLA', 'L']

export const isThesisGrades = grades => Object.keys(grades)
  .some(k => THESIS_GRADE_KEYS.includes(k))

export const isThesisSeries = series => series && series.some(s => isThesisGrades(s))

export const getThesisGradeSpread = (series) => {
  const thesisGradeAccumulator = {
    L: [],
    ECLA: [],
    MCLA: [],
    CL: [],
    LUB: [],
    NSLA: [],
    A: [],
    I: []
  }
  return series.reduce((acc, cur, i) => {
    const currentEntries = Object.entries(cur)

    currentEntries.forEach(([k, v]) => {
      acc[k].push(v)
    })

    Object.entries(acc)
      .forEach(([k, v]) => {
        if (v.length < i + 1) {
          acc[k].push(0)
        }
      })

    return acc
  }, { ...thesisGradeAccumulator })
}

export const getGradeSpread = (series) => {
  const failedKeys = ['Eisa', 'Hyl.', '0', 'Luop']

  const baseAccumalator = {
    0: [],
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    'Hyv.': []
  }

  return series.reduce((acc, cur, i) => {
    const currentEntries = Object.entries(cur)
    let failed = 0
    currentEntries.forEach(([k, v]) => {
      if (failedKeys.includes(k)) {
        failed += v
      } else {
        acc[k].push(v)
      }
    })
    acc[0].push(failed)
    Object.entries(acc)
      .forEach(([k, v]) => {
        if (v.length < i + 1) {
          acc[k].push(0)
        }
      })

    return acc
  }, { ...baseAccumalator })
}
