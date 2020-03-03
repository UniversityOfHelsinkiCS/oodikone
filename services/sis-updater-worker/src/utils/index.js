const { maxBy } = require('lodash')

const getLatestSnapshot = entities => {
  return maxBy(entities, e => e.modification_ordinal)
}

const isActive = entity => {
  return entity.document_state === 'ACTIVE'
}

const getMinMaxDate = (arr, fMax, fMin) => {
  let maxVal = null
  let max = -Infinity
  let minVal = null
  let min = Infinity

  arr.forEach(i => {
    const ma = fMax(i)
    const mi = fMin(i)

    const maVal = new Date(ma).getTime()
    const miVal = new Date(mi).getTime()
    if (maVal > max) {
      max = maVal
      maxVal = ma
    }
    if (miVal < min) {
      min = miVal
      minVal = mi
    }
  })

  return { max: maxVal, min: minVal }
}

module.exports = {
  getLatestSnapshot,
  isActive,
  getMinMaxDate
}
