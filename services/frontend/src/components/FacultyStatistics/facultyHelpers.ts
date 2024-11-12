import { getCreditCategories } from '@/common'

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
] as const

const testKey = (value: string) => {
  for (let i = 0; i < regexValuesAll.length; i++) {
    if (regexValuesAll[i].test(value)) {
      return i
    }
  }
  return 6
}

export const sortProgrammeKeys = (programmeKeys: string[][], faculty: string) => {
  try {
    return programmeKeys.sort((a, b) => {
      if (a[1].includes(faculty) && !b[1].includes(faculty)) return -1
      if (!a[1].includes(faculty) && b[1].includes(faculty)) return 1
      if (a[1].startsWith('T') && !b[1].includes(faculty) && !b[1].includes('T')) return -1
      if (!a[1].includes(faculty) && b[1].startsWith('T') && !a[1].includes('T')) return 1
      if (a[1].startsWith('LIS') && !b[1].includes(faculty) && !b[1].includes('LIS')) return -1
      if (!a[1].includes(faculty) && b[1].startsWith('LIS') && !a[1].includes('LIS')) return 1
      if (testKey(a[1]) - testKey(b[1]) === 0) return a[0].localeCompare(b[0])
      return testKey(a[1]) - testKey(b[1])
    })
  } catch (error) {
    return programmeKeys
  }
}

const isBetween = (number: number, lowerLimit: number, upperLimit: number) => {
  return (lowerLimit === undefined || number >= lowerLimit) && (upperLimit === undefined || number < upperLimit)
}

export const calculateStats = (
  creditCounts: Record<string, number[]>,
  maximumAmountOfCredits: number,
  minimumAmountOfCredits = 0,
  numberOfCreditCategories = 7
) => {
  const tableStats: Array<Array<number | string>> = []
  if (creditCounts === undefined) {
    return null
  }

  if (Object.keys(creditCounts).length === 0) {
    return null
  }

  const limits = getCreditCategories(
    true,
    'academic-year',
    maximumAmountOfCredits,
    Object.keys(creditCounts),
    numberOfCreditCategories - 1,
    minimumAmountOfCredits
  )
  const tableTitles = ['', 'All']
  for (const limit of limits) {
    if (limit[0] === undefined) tableTitles.push(`< ${limit[1]} credits`)
    else if (limit[1] === undefined) tableTitles.push(`≥ ${limit[0]} credits`)
    else tableTitles.push(`${limit[0]}–${limit[1]} credits`)
  }

  Object.keys(creditCounts).forEach(year => {
    const yearCreditCount = creditCounts[year]
    const yearCounts = [year, yearCreditCount.length]
    tableStats.push(yearCounts)
    for (const limit of limits) {
      yearCounts.push(yearCreditCount.filter(credits => isBetween(credits, limit[0], limit[1])).length)
    }
  })

  const totalCounts: Array<number | string> = ['Total']
  for (let i = 1; i < tableStats[0].length; i++) {
    let columnSum = 0
    for (const stats of tableStats) {
      columnSum += stats[i] as number
    }
    totalCounts.push(columnSum)
  }
  tableStats.push(totalCounts)

  // Calculate statistics for the bar chart (i.e., transpose the tableStats as rows are now columns and vice versa)
  const chartStats: Array<{ data: number[]; name: string }> = []
  for (let i = 2; i < tableStats[0].length; i++) {
    const column: number[] = []
    for (let j = tableStats.length - 1; j >= 0; j--) {
      column.push(tableStats[j][i] as number)
    }
    chartStats.push({ name: tableTitles[i].replace('<', 'Less than').replace('≥', 'At least'), data: column })
  }

  return { tableStats, chartStats, tableTitles }
}
