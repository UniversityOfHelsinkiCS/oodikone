import PropTypes from 'prop-types'

const {
  number,
  shape,
  string,
  oneOfType
} = PropTypes

export const graphDataType = shape({
  text: string.isRequired,
  value: number.isRequired
})

export const displayableDateType = shape({
  text: string.isRequired,
  value: string.isRequired
})

export const studentDetailsType = shape({
  studentNumber: string.isRequired,
  started: string.isRequired,
  credits: number
})

export const dropdownType = shape({
  key: oneOfType([string, number]).isRequired,
  value: oneOfType([string, number]).isRequired,
  text: string.isRequired
})
