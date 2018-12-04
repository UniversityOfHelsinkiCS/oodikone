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

