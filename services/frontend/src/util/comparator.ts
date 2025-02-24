/**
 * Returns a sorting function that can be used to sort strings so that Finnish alphabetical order is respected.
 *
 * @param {string} field - The field to sort by (optional: if not given, the function will sort by the strings themselves)
 */
export const createLocaleComparator = (field: string | null = null) => {
  if (!field) {
    return (val1, val2) => val1.localeCompare(val2, 'fi', { sensitivity: 'accent' })
  }
  return (val1, val2) => val1[field]?.localeCompare(val2[field], 'fi', { sensitivity: 'accent' })
}

export const createPinnedFirstComparator = (pinnedProgrammes: string[]) => {
  const localeComparator = createLocaleComparator('code')
  return (programmeA, programmeB) => {
    const pinnedA = pinnedProgrammes.includes(programmeA.code)
    const pinnedB = pinnedProgrammes.includes(programmeB.code)
    if (pinnedA && !pinnedB) {
      return -1
    }
    if (!pinnedA && pinnedB) {
      return 1
    }
    return localeComparator(programmeA, programmeB)
  }
}
