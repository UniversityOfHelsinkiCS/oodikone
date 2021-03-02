const { isEqual } = require('lodash')

const objectDiff = (obj1, obj2, ignoredFields = []) => {
  const diff = Object.keys(obj1).reduce((result, key) => {
    if (!obj2.hasOwnProperty(key)) {
      result.push(key)
    } else if (isEqual(obj1[key], obj2[key])) {
      const resultKeyIndex = result.indexOf(key)
      result.splice(resultKeyIndex, 1)
    }
    return result
  }, Object.keys(obj2))

  return diff.filter(field => !ignoredFields.includes(field))
}

module.exports = {
  objectDiff
}
