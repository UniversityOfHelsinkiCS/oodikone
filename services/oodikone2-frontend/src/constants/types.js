import PropTypes from 'prop-types'

const {
  number,
  shape,
  string,
  oneOfType,
  arrayOf
} = PropTypes

export const graphDataType = shape({
  name: string.isRequired,
  data: [number.isRequired]
})

export const displayableDateType = shape({
  text: string.isRequired,
  value: string.isRequired
})

export const studentDetailsType = shape({
  studentNumber: string.isRequired,
  started: string,
  credits: number
})

export const dropdownType = shape({
  key: oneOfType([string, number]).isRequired,
  value: oneOfType([string, number]).isRequired,
  text: shape({}).isRequired
})

export const courseDataType = shape({
  id: oneOfType([number, string]),
  category: oneOfType([number, string]),
  passed: oneOfType([number, string]),
  failed: oneOfType([number, string]),
  passrate: oneOfType([number, string])
})

export const courseDataWithRealisationsType = shape({
  id: oneOfType([number, string]),
  category: oneOfType([number, string]),
  passed: oneOfType([number, string]),
  failed: oneOfType([number, string]),
  passrate: oneOfType([number, string]),
  realisations: arrayOf(courseDataType)
})
