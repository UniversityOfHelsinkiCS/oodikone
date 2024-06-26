/** Returns a sorting function that can be used to sort strings so that Finnish alphabetical order is respected.
 * @param {string} field - The field to sort by (optional: if not given, the function will sort by the strings themselves)
 */
const createLocaleComparator = (field = null) => {
  if (!field) {
    return (val1, val2) => val1.localeCompare(val2, 'fi', { sensitivity: 'accent' })
  }
  return (val1, val2) => val1[field].localeCompare(val2[field], 'fi', { sensitivity: 'accent' })
}

const getFullStudyProgrammeRights = programmeRights => {
  return programmeRights.filter(({ limited }) => !limited).map(({ code }) => code)
}

const hasFullAccessToStudentData = roles => roles?.some(role => ['admin', 'fullSisuAccess'].includes(role))

const splitByEmptySpace = str => str.split(/\s+/g)

const validateParamLength = (param, minLength) => param && param.trim().length >= minLength

module.exports = {
  createLocaleComparator,
  getFullStudyProgrammeRights,
  hasFullAccessToStudentData,
  splitByEmptySpace,
  validateParamLength,
}
