import { arrayOf, number, oneOfType, shape, string } from 'prop-types'

const courseDataType = shape({
  id: oneOfType([number, string]),
  category: oneOfType([number, string]),
  passed: oneOfType([number, string]),
  failed: oneOfType([number, string]),
  passrate: oneOfType([number, string]),
})

export const courseDataWithRealisationsType = shape({
  id: oneOfType([number, string]),
  category: oneOfType([number, string]),
  passed: oneOfType([number, string]),
  failed: oneOfType([number, string]),
  passrate: oneOfType([number, string]),
  realisations: arrayOf(courseDataType),
})
