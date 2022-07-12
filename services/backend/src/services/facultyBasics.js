const { indexOf } = require('lodash')
const { startedStudyrights } = require('./faculty')
const { getGraduatedStats } = require('./studyprogrammeBasics')
const { getStatsBasis, getYearsArray, defineYear } = require('./studyprogrammeHelpers')

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

const filterDuplicateStudyrights = studyrights => {
  // bachelor+master students have two studyrights (separated by two last digits in studyrightid)
  // choose only the earlier started one, so we don't count start of masters as starting in faculty
  let rightsToCount = {}

  studyrights.forEach(right => {
    const id = right.studyrightid.slice(0, -2)
    const start = new Date(right.studystartdate)
    if (id in rightsToCount) {
      if (new Date(rightsToCount[id].studystartdate) > start) {
        rightsToCount[id] = right
      }
    } else {
      rightsToCount[id] = right
    }
  })
  return Object.values(rightsToCount)
}

const combineFacultyBasics = async (allBasics, faculty, programmes, yearType, specialGroups, counts, years) => {
  const isAcademicYear = yearType === 'ACADEMIC_YEAR'
  const includeAllSpecials = specialGroups === 'SPECIAL_INCLUDED'
  const since = isAcademicYear ? new Date('2017-08-01') : new Date('2017-01-01')
  const yearsArray = getYearsArray(since.getFullYear(), isAcademicYear)
  const { graphStats, tableStats } = getStatsBasis(yearsArray)
  const parameters = { since, years: yearsArray, isAcademicYear, includeAllSpecials }

  // started studying
  const studyrights = await startedStudyrights(faculty, since)
  const filteredStudyrights = filterDuplicateStudyrights(studyrights)

  filteredStudyrights.forEach(({ studystartdate }) => {
    const startYear = defineYear(studystartdate, isAcademicYear)
    graphStats[indexOf(yearsArray, startYear)] += 1
    tableStats[startYear] += 1
  })
  allBasics.graphStats.push({ name: 'Started studying', data: graphStats })

  Object.keys(tableStats).forEach(year => {
    counts[year] = [tableStats[year]]
    years.push(year)
  })
  // console.log('**************')
  // console.log(allBasics)
  //console.log('counts at first', counts)
  // Graduated
  // console.log(programmes)
  for (const studyprogramme of programmes) {
    const graduated = await getGraduatedStats({ studyprogramme, ...parameters })
    if (graduated) {
      Object.keys(graduated.tableStats).forEach(year => {
        if (counts[year][1] === undefined) counts[year].push(graduated.tableStats[year])
        else counts[year][1] += graduated.tableStats[year]
      })
      // console.log(studyprogramme)
      // console.log('graduated', graduated)
      // console.log('counts', counts)
    }
  }
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
