const { getCreditStats, setCreditStats } = require('./analyticsService')
const { getCreditStatsForStudytrack } = require('./studyprogrammeCredits')

const combineFacultyCredits = async (allCredits, programmes, yearType, specialGroups, counts, years) => {
  for (const prog of programmes) {
    const data = await getProgrammeCredits(prog, yearType, specialGroups)
    if (data) {
      if (!allCredits.lastUpdated || new Date(data.lastUpdated) > new Date(allCredits.lastUpdated))
        allCredits.lastUpdated = data.lastUpdated
      data.tableStats.forEach(row => {
        if (!(row[0] in counts)) {
          counts[row[0]] = row.slice(1)
          years.push(row[0])
        } else {
          counts[row[0]] = row.slice(1).map((value, i) => {
            return counts[row[0]][i] + value
          })
        }
      })
    }
  }
  // save table stats and graph stats
  years.forEach(year => {
    allCredits.tableStats.push([year, ...counts[year]])
  })

  years.sort()
  allCredits.years = years
}

const getProgrammeCredits = async (code, yearType, specialGroups) => {
  const data = await getCreditStats(code, yearType, specialGroups)
  if (data) return data
  const updatedStats = await getCreditStatsForStudytrack({
    studyprogramme: code,
    settings: {
      isAcademicYear: yearType === 'ACADEMIC_YEAR',
      includeAllSpecials: specialGroups === 'SPECIAL_INCLUDED',
    },
  })
  if (updatedStats) await setCreditStats(updatedStats, yearType, specialGroups)
  return updatedStats
}

module.exports = { combineFacultyCredits }
