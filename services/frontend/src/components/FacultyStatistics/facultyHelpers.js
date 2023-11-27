/*
  Order of the programme keys (such as TKT, PSYK) is chosen by "old" code:
  KH -> MH -> T -> FI -> K- -> Numbers containing letters at end -> Y- -> Number
  Take
*/
const regexValuesAll = [
  /^KH/,
  /^MH/,
  /^T/,
  /^LI/,
  /^K-/,
  /^FI/,
  /^00901$/,
  /^00910$/,
  /^\d.*a$/,
  /^Y/,
  /\d$/,
  /^\d.*e$/,
]

const testKey = value => {
  for (let i = 0; i < regexValuesAll.length; i++) {
    if (regexValuesAll[i].test(value)) {
      return i
    }
  }
  return 6
}

export const sortProgrammeKeys = (programmeKeys, faculty) => {
  try {
    return programmeKeys.sort((a, b) => {
      if (a[1].includes(faculty) && !b[1].includes(faculty)) return -1
      if (!a[1].includes(faculty) && b[1].includes(faculty)) return 1
      if (a[1].startsWith('T') && !b[1].includes(faculty) && !b[1].includes('T')) return -1
      if (!a[1].includes(faculty) && b[1].startsWith('T') && !a[1].includes('T')) return 1
      if (a[1].startsWith('LIS') && !b[1].includes(faculty) && !b[1].includes('LIS')) return -1
      if (!a[1].includes(faculty) && b[1].startsWith('LIS') && !a[1].includes('LIS')) return 1
      if (testKey(a[1]) - testKey(b[1]) === 0) {
        return a[0].localeCompare(b[0])
      }
      return testKey(a[1]) - testKey(b[1])
    })
  } catch (e) {
    return programmeKeys
  }
}
