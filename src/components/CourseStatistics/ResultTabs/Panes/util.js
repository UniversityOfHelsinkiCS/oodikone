import { arrayOf, number, oneOfType, shape, string, oneOf } from 'prop-types'

export const viewModeNames = {
  CUMULATIVE: 'Cumulative',
  STUDENT: 'Student',
  GRADES: 'Grades'
}

export const graphSeriesTypes = {
  PRIMARY: { name: 'primary', multiplier: 1 },
  COMPARISON: { name: 'comparison', multiplier: -1 }
}

export const getDataObject = (name, data, stack) => ({ name, data, stack })

export const getMaxValueOfSeries = series => Object.values(series).reduce((acc, cur) => {
  const curMax = Math.max(...cur.data.map(Math.abs))
  return curMax >= acc ? curMax : acc
}, 0)

export const dataSeriesType = shape({
  name: string,
  code: oneOfType([string, number]),
  stats: arrayOf(shape({}))
})

export const viewModeType = oneOf(Object.values(viewModeNames))

export const getGradeSpread = (series, multiplier = 1) => {
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
        acc[k].push(v * multiplier)
      }
    })
    acc[0].push(failed * multiplier)
    Object.entries(acc)
      .forEach(([k, v]) => {
        if (v.length < i + 1) {
          acc[k].push(0)
        }
      })

    return acc
  }, { ...baseAccumalator })
}

