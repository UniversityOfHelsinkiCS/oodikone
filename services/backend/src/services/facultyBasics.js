const { indexOf } = require('lodash')
const { startedStudyrights } = require('./faculty')
const { getStatsBasis, getYearsArray, defineYear } = require('./studyprogrammeHelpers')

const combineFacultyBasics = async (allBasics, faculty, programmes, yearType, specialGroups, counts, years) => {
  // count students who started their studyright per year
  const isAcademicYear = yearType === 'ACADEMIC_YEAR'
  const since = isAcademicYear ? new Date('2017-08-01') : new Date('2017-01-01')
  const yearsArray = getYearsArray(since.getFullYear(), isAcademicYear)
  const { graphStats, tableStats } = getStatsBasis(yearsArray)

  // started studying
  const studyrights = await startedStudyrights(faculty, since)
  //console.log(studyrights)

  studyrights.forEach(({ studystartdate }) => {
    const startYear = defineYear(studystartdate, isAcademicYear)
    graphStats[indexOf(yearsArray, startYear)] += 1
    tableStats[startYear] += 1
  })
  // console.log(graphStats)
  // console.log(tableStats)
  allBasics.graphStats.push({ name: 'Started studying', data: graphStats })

  Object.keys(tableStats).forEach(year => {
    counts[year] = [tableStats[year]]
    years.push(year)
  })
  // console.log('**************')
  // console.log(allBasics)
  // console.log(counts)

  // for (const prog of programmes) {
  //   const data = await getProgrammeBasics(prog, yearType, specialGroups)
  //   if (data) {
  //     if (!allBasics.lastUpdated || new Date(data.lastUpdated) > new Date(allBasics.lastUpdated))
  //       allBasics.lastUpdated = data.lastUpdated

  //     data.tableStats.forEach(row => {
  //       if (!(row[0] in counts)) {
  //         counts[row[0]] = row.slice(1)
  //         years.push(row[0])
  //       } else {
  //         counts[row[0]] = row.slice(1).map((value, i) => {
  //           return counts[row[0]][i] + value
  //         })
  //       }
  //     })
  //   }
  // }
  // // save table stats and graph stats
  // years.forEach(year => {
  //   allBasics.tableStats.push([year, ...counts[year]])
  // })

  // years.sort()
  // allBasics.years = years
}

module.exports = { combineFacultyBasics }

// const combineFacultyBasics = async (allBasics, programmes, yearType, specialGroups, counts, years) => {
//   console.log(counts)
//   for (const prog of programmes) {
//     const data = await getProgrammeBasics(prog, yearType, specialGroups)
//     if (data) {
//       if (!allBasics.lastUpdated || new Date(data.lastUpdated) > new Date(allBasics.lastUpdated))
//         allBasics.lastUpdated = data.lastUpdated

//       data.tableStats.forEach(row => {
//         if (!(row[0] in counts)) {
//           counts[row[0]] = row.slice(1)
//           years.push(row[0])
//         } else {
//           counts[row[0]] = row.slice(1).map((value, i) => {
//             return counts[row[0]][i] + value
//           })
//         }
//       })
//     }
//   }
//   // save table stats and graph stats
//   years.forEach(year => {
//     allBasics.tableStats.push([year, ...counts[year]])
//   })

//   years.sort()
//   allBasics.years = years
// }

// const getProgrammeBasics = async (code, yearType, specialGroups) => {
//   const data = await getBasicStats(code, yearType, specialGroups)
//   if (data) return data

//   const updated = await getBasicStatsForStudytrack({
//     studyprogramme: code,
//     settings: {
//       isAcademicYear: yearType === 'ACADEMIC_YEAR',
//       includeAllSpecials: specialGroups === 'SPECIAL_INCLUDED',
//     },
//   })
//   if (updated) await setBasicStats(updated, yearType, specialGroups)
//   return updated
// }
