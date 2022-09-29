/*
  Order of the programme keys: KH -> MH -> T -> FI -> K- -> Numbers containing letters at end -> Y- -> Numbers
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

const sortProgrammeKeys = programmeKeys => {
  return programmeKeys.sort((a, b) => {
    if (testKey(a) - testKey(b) === 0) {
      return a.localeCompare(b)
    }
    return testKey(a) - testKey(b)
  })
}

export default sortProgrammeKeys
