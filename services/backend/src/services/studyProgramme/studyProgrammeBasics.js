const { indexOf, orderBy } = require('lodash')

const { getSemestersAndYears } = require('../semesters')
const {
  alltimeEndDate,
  alltimeStartDate,
  defineYear,
  getCorrectStudentnumbers,
  getStartDate,
  getStatsBasis,
  getYearsArray,
  tableTitles,
} = require('./studyProgrammeHelpers')
const { graduatedStudyRights, getStudyRightsInProgramme } = require('./studyRightFinders')
const { transfersAway, transfersTo } = require('.')

const getDateOfFirstSemesterPresent = (semesterEnrollments, semesters, currentSemester, since) => {
  if (!semesterEnrollments) return null
  for (const enrollment of semesterEnrollments) {
    if (enrollment.type !== 1) continue
    const semesterInfo = semesters[enrollment.semester]
    if (semesterInfo.startdate >= since && semesterInfo.semestercode <= currentSemester) return semesterInfo.startdate
  }
  return null
}

const getStartedStats = async ({ studyprogramme, years, isAcademicYear }) => {
  const studyRightsOfProgramme = await getStudyRightsInProgramme(studyprogramme, false)
  const startedStudying = getStatsBasis(years)
  const accepted = getStatsBasis(years)
  const { semesters } = await getSemestersAndYears()
  const { semestercode: currentSemester } = Object.values(semesters).find(semester => semester.enddate >= new Date())

  for (const studyRight of studyRightsOfProgramme) {
    const studyRightElement = studyRight.studyRightElements.find(sre => sre.code === studyprogramme)
    const [firstStudyRightElementWithSamePhase] = orderBy(
      studyRight.studyRightElements.filter(sre => sre.phase === studyRightElement.phase),
      ['startDate'],
      ['asc']
    )
    // This means the student has been transferred from another study programme
    if (firstStudyRightElementWithSamePhase.code !== studyRightElement.code) {
      continue
    }

    const startedInProgramme = new Date(studyRightElement.startDate)
    const startedInProgrammeYear = defineYear(startedInProgramme, isAcademicYear)

    if (startedInProgramme >= new Date()) {
      continue
    }

    accepted.graphStats[indexOf(years, startedInProgrammeYear)] += 1
    accepted.tableStats[startedInProgrammeYear] += 1

    const firstPresentAt = getDateOfFirstSemesterPresent(
      studyRight.semesterEnrollments,
      semesters,
      currentSemester,
      startedInProgramme
    )

    if (!firstPresentAt) {
      continue
    }

    const startYear = defineYear(firstPresentAt, isAcademicYear)
    startedStudying.graphStats[indexOf(years, startYear)] += 1
    startedStudying.tableStats[startYear] += 1
  }
  return { startedStudying, accepted }
}

const getGraduatedStats = async ({ studyprogramme, since, years, isAcademicYear, includeAllSpecials }) => {
  const { graphStats, tableStats } = getStatsBasis(years)
  if (!studyprogramme) return { graphStats, tableStats }
  const studentnumbersOfTheYear = await getCorrectStudentnumbers({
    codes: [studyprogramme],
    startDate: alltimeStartDate,
    endDate: alltimeEndDate,
    includeAllSpecials,
    includeTransferredTo: includeAllSpecials,
  })
  const studyrights = await graduatedStudyRights(studyprogramme, since, studentnumbersOfTheYear)
  studyrights.forEach(({ enddate, studyrightElements }) => {
    // Check that the study right element ending to graduation belong to study programme
    const elements = studyrightElements.filter(
      sre => new Date(sre.enddate).toDateString() === new Date(enddate).toDateString()
    )
    if (elements.length) {
      const graduationYear = defineYear(enddate, isAcademicYear)
      graphStats[indexOf(years, graduationYear)] += 1
      tableStats[graduationYear] += 1
    }
  })

  return { graphStats, tableStats }
}

const getTransferredAwayStats = async ({ studyprogramme, since, years, isAcademicYear, combinedProgramme }) => {
  const studyrights = await transfersAway(studyprogramme, since)
  const secondStudyrights = combinedProgramme ? await transfersAway(combinedProgramme, since) : []
  const { graphStats, tableStats } = getStatsBasis(years)

  studyrights.forEach(({ transferdate }) => {
    const transferYear = defineYear(transferdate, isAcademicYear)
    graphStats[indexOf(years, transferYear)] += 1
    tableStats[transferYear] += 1
  })

  secondStudyrights.forEach(({ transferdate }) => {
    const transferYear = defineYear(transferdate, isAcademicYear)
    graphStats[indexOf(years, transferYear)] += 1
    tableStats[transferYear] += 1
  })

  return { graphStats, tableStats }
}

const getTransferredToStats = async ({ studyprogramme, since, years, isAcademicYear, combinedProgramme }) => {
  const studyrights = await transfersTo(studyprogramme, since)
  const secondStudyrights = combinedProgramme ? await transfersTo(combinedProgramme, since) : []
  const { graphStats, tableStats } = getStatsBasis(years)

  studyrights.forEach(({ transferdate }) => {
    const transferYear = defineYear(transferdate, isAcademicYear)
    graphStats[indexOf(years, transferYear)] += 1
    tableStats[transferYear] += 1
  })

  secondStudyrights.forEach(({ transferdate }) => {
    const transferYear = defineYear(transferdate, isAcademicYear)
    graphStats[indexOf(years, transferYear)] += 1
    tableStats[transferYear] += 1
  })

  return { graphStats, tableStats }
}

const initializeGraphStats = (
  includeAllSpecials,
  combinedProgramme,
  started,
  startedSecondProg,
  accepted,
  acceptedSecondProg,
  graduated,
  transferredAway,
  transferredTo,
  graduatedSecondProg
) => {
  const basicTable = []
  if (combinedProgramme) {
    basicTable.push(
      { name: 'Started studying bachelor', data: started.graphStats },
      { name: 'Started studying licentiate', data: startedSecondProg.graphStats },
      { name: 'Accepted bachelor', data: accepted.graphStats },
      { name: 'Accepted licentiate', data: acceptedSecondProg.graphStats },
      { name: 'Graduated bachelor', data: graduated.graphStats },
      { name: 'Graduated licentiate', data: graduatedSecondProg.graphStats }
    )
  } else {
    basicTable.push(
      { name: 'Started studying', data: started.graphStats },
      { name: 'Accepted', data: accepted.graphStats },
      { name: 'Graduated', data: graduated.graphStats }
    )
  }

  if (includeAllSpecials) {
    basicTable.push(
      { name: 'Transferred away', data: transferredAway.graphStats },
      { name: 'Transferred to', data: transferredTo.graphStats }
    )
  }
  return basicTable
}

const initializeTableStats = (
  year,
  combinedProgramme,
  includeAllSpecials,
  started,
  startedSecondProg,
  accepted,
  acceptedSecondProg,
  graduated,
  graduatedSecondProg,
  transferredAway,
  transferredTo
) => {
  if (includeAllSpecials && combinedProgramme) {
    return [
      year,
      started.tableStats[year],
      startedSecondProg.tableStats[year],
      accepted.tableStats[year],
      acceptedSecondProg.tableStats[year],
      graduated.tableStats[year],
      graduatedSecondProg.tableStats[year],
      transferredAway.tableStats[year],
      transferredTo.tableStats[year],
    ]
  }
  if (combinedProgramme) {
    return [
      year,
      started.tableStats[year],
      startedSecondProg.tableStats[year],
      accepted.tableStats[year],
      acceptedSecondProg.tableStats[year],
      graduated.tableStats[year],
      graduatedSecondProg.tableStats[year],
    ]
  }
  if (includeAllSpecials) {
    return [
      year,
      started.tableStats[year],
      accepted.tableStats[year],
      graduated.tableStats[year],
      transferredAway.tableStats[year],
      transferredTo.tableStats[year],
    ]
  }
  return [year, started.tableStats[year], accepted.tableStats[year], graduated.tableStats[year]]
}

const getBasicStatsForStudytrack = async ({ studyprogramme, combinedProgramme, settings }) => {
  const { includeAllSpecials, isAcademicYear } = settings
  const since = getStartDate(studyprogramme, isAcademicYear)
  const years = getYearsArray(since.getFullYear(), isAcademicYear)
  const queryParameters = { studyprogramme, since, years, isAcademicYear, includeAllSpecials, combinedProgramme }
  const queryParametersCombinedProg = {
    studyprogramme: combinedProgramme,
    since,
    years,
    isAcademicYear,
    includeAllSpecials,
  }
  const { startedStudying, accepted } = await getStartedStats(queryParameters)
  const { startedStudying: startedStudyingSecondProg, accepted: acceptedSecondProg } =
    await getStartedStats(queryParametersCombinedProg)

  const graduated = await getGraduatedStats(queryParameters)
  const graduatedSecondProg = await getGraduatedStats(queryParametersCombinedProg)
  const transferredAway = await getTransferredAwayStats(queryParameters)
  const transferredTo = await getTransferredToStats(queryParameters)

  const reversedYears = getYearsArray(since.getFullYear(), isAcademicYear).reverse()
  const key = includeAllSpecials ? 'SPECIAL_INCLUDED' : 'SPECIAL_EXCLUDED'
  const titles = tableTitles.basics[combinedProgramme ? `${key}_COMBINED_PROGRAMME` : key]
  const tableStats = reversedYears.map(year =>
    initializeTableStats(
      year,
      combinedProgramme,
      includeAllSpecials,
      startedStudying,
      startedStudyingSecondProg,
      accepted,
      acceptedSecondProg,
      graduated,
      graduatedSecondProg,
      transferredAway,
      transferredTo
    )
  )

  return {
    id: combinedProgramme ? `${studyprogramme}-${combinedProgramme}` : studyprogramme,
    years,
    graphStats: initializeGraphStats(
      includeAllSpecials,
      combinedProgramme,
      startedStudying,
      startedStudyingSecondProg,
      accepted,
      acceptedSecondProg,
      graduated,
      transferredAway,
      transferredTo,
      graduatedSecondProg
    ),
    tableStats,
    titles,
  }
}

module.exports = {
  getBasicStatsForStudytrack,
}
