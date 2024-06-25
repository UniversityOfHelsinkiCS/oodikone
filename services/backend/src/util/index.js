const mapToProviders = programmeCodes => {
  return programmeCodes.map(r => {
    const isNumber = str => !Number.isNaN(Number(str))
    if (r.includes('_')) {
      const [left, right] = r.split('_')
      const prefix = [...left].filter(isNumber).join('')
      const suffix = `${left[0]}${right}`
      const providercode = `${prefix}0-${suffix}`
      return providercode
    }
    if (/^(T)[0-9]{6}$/.test(r)) {
      const numbers = r.substring(1)
      const courseProvider = `7${numbers}`
      const asNum = Number(courseProvider)
      // God-awful hack to fix a bunch of doctoral degrees
      // that got the wrong provider
      if (asNum < 7920111 && asNum > 7920102) {
        return `${asNum + 1}`
      }
      if (asNum === 7920111) {
        return '7920103'
      }
      return `${asNum}`
    }
    return r
  })
}

/** Returns a sorting function that can be used to sort strings so that Finnish alphabetical order is respected.
 * @param {string} field - The field to sort by (optional: if not given, the function will sort by the strings themselves)
 */
const createLocaleComparator = (field = null) => {
  if (!field) return (val1, val2) => val1.localeCompare(val2, 'fi', { sensitivity: 'accent' })
  return (val1, val2) => val1[field].localeCompare(val2[field], 'fi', { sensitivity: 'accent' })
}

const getFullStudyProgrammeRights = programmeRights =>
  programmeRights.filter(({ limited }) => !limited).map(({ code }) => code)

const hasFullAccessToStudentData = roles => roles?.some(role => ['admin', 'fullSisuAccess'].includes(role))

const splitByEmptySpace = str => str.split(/\s+/g)

const validateParamLength = (param, minLength) => param && param.trim().length >= minLength

module.exports = {
  createLocaleComparator,
  getFullStudyProgrammeRights,
  hasFullAccessToStudentData,
  mapToProviders,
  splitByEmptySpace,
  validateParamLength,
}
