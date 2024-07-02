const { indexOf, orderBy } = require('lodash')

const { getSemestersAndYears } = require('../semesters')
const { defineYear, getStartDate, getStatsBasis, getYearsArray, tableTitles } = require('./studyProgrammeHelpers')
const { getStudyRightsInProgramme } = require('./studyRightFinders')

const getStudyRightElementsWithPhase = (studyRight, phase) =>
  orderBy(
    studyRight.studyRightElements.filter(sre => sre.phase === phase),
    ['startDate'],
    ['asc']
  )

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
    const [firstStudyRightElementWithSamePhase] = getStudyRightElementsWithPhase(studyRight, studyRightElement.phase)

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

const getGraduatedStats = async ({ studyprogramme, years, isAcademicYear, includeAllSpecials }) => {
  const { graphStats, tableStats } = getStatsBasis(years)
  const graduatedStudyRights = await getStudyRightsInProgramme(studyprogramme, true)

  for (const studyRight of graduatedStudyRights) {
    const correctStudyRightElement = studyRight.studyRightElements.find(element => element.code === studyprogramme)
    if (!correctStudyRightElement) continue
    const [firstStudyRightElementWithSamePhase] = getStudyRightElementsWithPhase(
      studyRight,
      correctStudyRightElement.phase
    )
    // This means the student has been transferred from another study programme
    if (firstStudyRightElementWithSamePhase.code !== correctStudyRightElement.code && !includeAllSpecials) {
      continue
    }
    const graduationYear = defineYear(new Date(correctStudyRightElement.endDate), isAcademicYear)
    graphStats[indexOf(years, graduationYear)] += 1
    tableStats[graduationYear] += 1
  }

  return { graphStats, tableStats }
}

const getTransferredStats = async ({ studyprogramme, years, isAcademicYear, combinedProgramme }) => {
  const studyRights = await getStudyRightsInProgramme(studyprogramme, false)
  const secondStudyRights = combinedProgramme ? await getStudyRightsInProgramme(combinedProgramme, false) : []
  const transferredAway = getStatsBasis(years)
  const transferredTo = getStatsBasis(years)

  for (const studyRight of [...studyRights, ...secondStudyRights]) {
    const studyRightElement = studyRight.studyRightElements.find(element => element.code === studyprogramme)
    const studyRightElementsWithSamePhase = getStudyRightElementsWithPhase(studyRight, studyRightElement.phase)
    if (studyRightElementsWithSamePhase.length === 1) continue
    const [firstStudyRightElementWithSamePhase] = studyRightElementsWithSamePhase
    if (
      firstStudyRightElementWithSamePhase.code !== studyRightElement.code &&
      studyRightElement.startDate <= new Date()
    ) {
      const transferYear = defineYear(studyRightElement.startDate, isAcademicYear)
      transferredTo.graphStats[indexOf(years, transferYear)] += 1
      transferredTo.tableStats[transferYear] += 1
    } else if (
      firstStudyRightElementWithSamePhase.code === studyRightElement.code &&
      studyRightElement.endDate <= new Date()
    ) {
      const transferYear = defineYear(studyRightElement.endDate, isAcademicYear)
      transferredAway.graphStats[indexOf(years, transferYear)] += 1
      transferredAway.tableStats[transferYear] += 1
    }
  }

  return { transferredAway, transferredTo }
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
  const queryParameters = { studyprogramme, years, isAcademicYear, includeAllSpecials, combinedProgramme }
  const queryParametersCombinedProg = { studyprogramme: combinedProgramme, years, isAcademicYear, includeAllSpecials }
  const { startedStudying, accepted } = await getStartedStats(queryParameters)
  const { startedStudying: startedStudyingSecondProg, accepted: acceptedSecondProg } =
    await getStartedStats(queryParametersCombinedProg)

  const graduated = await getGraduatedStats(queryParameters)
  const graduatedSecondProg = await getGraduatedStats(queryParametersCombinedProg)
  const { transferredAway, transferredTo } = await getTransferredStats(queryParameters)

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
  getGraduatedStats,
}
