const router = require('express').Router()

const { serviceProvider } = require('../config')
const { magicFacultyCode } = require('../config/organizationConstants')
const { getSortedFaculties } = require('../services/faculty/facultyHelpers')
const { getFacultyProgressStats, getGraduationStats } = require('../services/faculty/facultyService')
const { getMedian } = require('../services/studyProgramme/studyProgrammeHelpers')

const degreeNames = ['bachelor', 'bachelorMaster', 'master', 'licentiate', 'doctor']

const getProgrammeNames = faculties => {
  return faculties.reduce((obj, faculty) => {
    const { name, ...rest } = faculty.dataValues
    obj[faculty.code] = { ...rest, ...name }
    return obj
  }, {})
}

router.get('/allprogressstats', async (req, res) => {
  const specialGroups = req.query?.specialsIncluded === 'true' ? 'SPECIAL_INCLUDED' : 'SPECIAL_EXCLUDED'
  const graduated = req.query?.graduated
  const allFaculties = await getSortedFaculties()
  const facultyCodes = allFaculties.map(faculty => faculty.code)
  const codeToData = {}

  for (const facultyCode of facultyCodes) {
    const data = await getFacultyProgressStats(facultyCode, specialGroups, graduated)
    if (!data) {
      return res.status(404).send('Data missing from server: Refreshing faculty data required')
    }
    codeToData[facultyCode] = data
  }

  const universityData = {
    years: codeToData[magicFacultyCode].years,
    yearlyBachelorTitles: codeToData[magicFacultyCode].yearlyBachelorTitles,
    yearlyBcMsTitles: codeToData[magicFacultyCode].yearlyBcMsTitles,
    yearlyMasterTitles: codeToData[magicFacultyCode].yearlyMasterTitles,
    yearlyLicentiateTitles: codeToData[magicFacultyCode].yearlyLicentiateTitles,
    programmeNames: getProgrammeNames(allFaculties),
    bachelorsProgStats: {},
    creditCounts: {
      bachelor: {},
    },
  }

  const unifyProgressStats = progStats => {
    return progStats.reduce(
      (all, prog) => {
        prog.forEach((yearStats, yearIndex) =>
          yearStats.forEach((category, categoryIndex) => {
            all[yearIndex][categoryIndex] += prog[yearIndex][categoryIndex]
          })
        )
        return all
      },
      // eslint-disable-next-line no-unused-vars
      progStats[0].map(year => year.map(_num => 0))
    )
  }

  for (const facultyCode of facultyCodes) {
    const facultyData = codeToData[facultyCode]
    for (const year of universityData.years.slice(1).reverse()) {
      for (const fieldName of degreeNames) {
        if (!facultyData.creditCounts[fieldName] || Object.keys(facultyData.creditCounts[fieldName]).length === 0)
          continue
        if (!universityData.creditCounts[fieldName]) universityData.creditCounts[fieldName] = {}
        if (!universityData.creditCounts[fieldName][year]) universityData.creditCounts[fieldName][year] = []
        universityData.creditCounts[fieldName][year].push(...facultyData.creditCounts[fieldName][year])
      }
      for (const fieldName of [
        'bachelorsProgStats',
        'bcMsProgStats',
        'licentiateProgStats',
        'mastersProgStats',
        'doctoralProgStats',
      ]) {
        if (!universityData[fieldName]) universityData[fieldName] = {}
        if (Object.keys(facultyData[fieldName]).length === 0) continue
        universityData[fieldName][facultyCode] = unifyProgressStats(Object.values(facultyData[fieldName]))
      }
    }
  }

  // Remove ELL bachelor+master progresstats for now, because it is problematic due to different credit limits
  // when expanding the table rows to show 'programme'(faculty) specific progress bars
  delete universityData.bcMsProgStats.H90

  return res.status(200).json(universityData)
})

router.get('/allgraduationstats', async (_req, res) => {
  const degreeNames = ['bachelor', 'bcMsCombo', 'master', 'licentiate', 'doctor']
  const allFaculties = await getSortedFaculties()
  const facultyCodes = allFaculties.map(faculty => faculty.code)
  const facultyData = {}
  const timesArrays = [] // keep book of these to null them in the end, large lists not used in frontend
  const programmeFilter = serviceProvider === 'Toska' ? 'NEW_STUDY_PROGRAMMES' : 'ALL_PROGRAMMES'
  for (const facultyCode of facultyCodes) {
    const data = await getGraduationStats(facultyCode, programmeFilter, true)
    if (!data) return res.status(500).json({ message: `Did not find data for ${facultyCode}` })
    facultyData[facultyCode] = data
  }

  const unifyTotals = (facultyData, universityData, isLast) => {
    for (const degree of degreeNames) {
      if (!universityData[degree]) universityData[degree] = []
      if (!facultyData[degree]) continue
      for (const yearStats of facultyData[degree]) {
        const universityStats = universityData[degree]
        const universityYearStats = universityData[degree].find(stats => stats.name === yearStats.name)
        if (!universityYearStats) {
          universityStats.push(yearStats)
        } else {
          universityYearStats.times.push(...yearStats.times)
          timesArrays.push(universityYearStats.times)
          universityYearStats.amount += yearStats.amount
          universityYearStats.statistics.onTime += yearStats.statistics.onTime
          universityYearStats.statistics.yearOver += yearStats.statistics.yearOver
          universityYearStats.statistics.wayOver += yearStats.statistics.wayOver
          if (isLast) {
            universityYearStats.y = getMedian(universityYearStats.times)
          }
        }
      }
    }
  }

  const unifyProgrammeStats = (universityData, facultyData, facultyCode) => {
    for (const degree of degreeNames) {
      if (!facultyData[degree]) continue
      if (!universityData[degree]) universityData[degree] = {}
      for (const yearData of facultyData[degree]) {
        if (!universityData[degree][yearData.name]) {
          universityData[degree][yearData.name] = { programmes: [], data: [] }
        }
        const uniYearStats = universityData[degree][yearData.name]
        if (!uniYearStats.programmes.find(prog => prog === facultyCode)) {
          uniYearStats.programmes.push(facultyCode)
        }
        const uniYearFacultyStats = uniYearStats.data.find(item => item.code === facultyCode)
        const yearDataClone = { ...yearData, times: null, statistics: { ...yearData.statistics } }
        if (!uniYearFacultyStats) {
          uniYearStats.data.push({ ...yearDataClone, name: facultyCode, code: facultyCode })
        } else {
          uniYearFacultyStats.y = yearData.y
          uniYearFacultyStats.amount += yearData.amount
          uniYearFacultyStats.statistics.onTime += yearData.statistics.onTime
          uniYearFacultyStats.statistics.yearOver += yearData.statistics.yearOver
          uniYearFacultyStats.statistics.wayOver += yearData.statistics.wayOver
        }
      }
    }

    return universityData
  }

  const universityData = {
    goals: {
      bachelor: 36,
      bcMsCombo: 60,
      master: 24,
      doctor: 48,
      licentiate: 78,
    },
    programmeNames: getProgrammeNames(allFaculties),
    byGradYear: { medians: {}, programmes: { medians: {} } },
    classSizes: { programmes: {} },
  }

  for (let i = 0; i < facultyCodes.length; i++) {
    const facultyCode = facultyCodes[i]
    const data = facultyData[facultyCode]
    unifyTotals(data.byGradYear.medians, universityData.byGradYear.medians, i === facultyCodes.length - 1)
    unifyProgrammeStats(universityData.byGradYear.programmes.medians, data.byGradYear.medians, facultyCode)
    for (const degree of degreeNames) {
      if (!universityData.classSizes[degree]) {
        universityData.classSizes[degree] = data.classSizes[degree]
      } else {
        Object.entries(data.classSizes[degree]).forEach(([key, value]) => {
          universityData.classSizes[degree][key] += value
        })
      }
    }

    const { programmes, ...rest } = data.classSizes
    universityData.classSizes.programmes[facultyCode] = rest
  }

  // Empty "times" arrays because that's not needed anymore.
  timesArrays.forEach(arr => {
    arr.length = 0
  })

  return res.status(200).json(universityData)
})

module.exports = router
