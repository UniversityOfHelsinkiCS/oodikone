const mapToProviders = (programmeCodes: string[]) => {
  return programmeCodes.map(r => {
    const isNumber = (str: string) => !Number.isNaN(Number(str))
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

// sort substitutions so that main code is first
const newLetterBasedCode = /^[A-Za-z]/ // new letter based codes come first
const oldNumericCode = /^\d/ // old numeric codes come second
const openUniCode = /^AY?(.+?)(?:en|fi|sv)?$/ // open university codes come last
const openUniCodeA = /A\d/ // open university with just A come last
const digi = /DIGI-A?(.+?)(?:en|fi|sv)?$/ // digi-a goes on top courses goes third
const bscsCode = /BSCS??/

const codeRegexes = [openUniCodeA, openUniCode, bscsCode, oldNumericCode, newLetterBasedCode, digi]

const getSortRank = (code: string) => {
  for (let i = 0; i < codeRegexes.length; i++) {
    if (codeRegexes[i].test(code)) {
      return i
    }
  }
  return 3 // if no hit, put before open uni courses
}

const sortMainCode = (codes: string[] | undefined) => {
  if (!codes) return []
  return codes.sort((x, y) => getSortRank(y) - getSortRank(x))
}

/** Returns a sorting function that can be used to sort strings so that Finnish alphabetical order is respected.
 * @param {string} field - The field to sort by (optional: if not given, the function will sort by the strings themselves)
 */
const createLocaleComparator = (field: string | null = null) => {
  if (!field) return (val1: string, val2: string) => val1.localeCompare(val2, 'fi', { sensitivity: 'accent' })
  return (val1: string, val2: string) => val1[field].localeCompare(val2[field], 'fi', { sensitivity: 'accent' })
}

const getFullStudyProgrammeRights = programmeRights =>
  programmeRights.filter(({ limited }) => !limited).map(({ code }) => code)

// TODO better type for roles
const hasFullAccessToStudentData = (roles: string[]) => roles?.some(role => ['admin', 'fullSisuAccess'].includes(role))

module.exports = {
  mapToProviders,
  sortMainCode,
  getSortRank,
  createLocaleComparator,
  getFullStudyProgrammeRights,
  hasFullAccessToStudentData,
}

export default {}