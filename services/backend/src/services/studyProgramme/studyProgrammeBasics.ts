import { indexOf } from 'lodash'

import { Name, EnrollmentType, SemesterEnrollment } from '@oodikone/shared/types'
import { getSemestersAndYears } from '../semesters'
import {
  defineYear,
  getStartDate,
  getStatsBasis,
  getStudyRightElementsWithPhase,
  getYearsArray,
  hasTransferredFromOrToProgramme,
  tableTitles,
} from './studyProgrammeHelpers'
import { getStudyRightsInProgramme } from './studyRightFinders'

export const getDateOfFirstSemesterPresent = (
  semesterEnrollments: SemesterEnrollment[] | null,
  semesters: {
    [semestercode: string]: { semestercode: number; name: Name; yearcode: number; startdate: Date; enddate: Date }
  },
  currentSemester: number,
  since: Date
) => {
  if (!semesterEnrollments) {
    return null
  }
  for (const enrollment of semesterEnrollments) {
    if (enrollment.type !== EnrollmentType.PRESENT) {
      continue
    }
    const semesterInfo = semesters[enrollment.semester]
    if (
      semesterInfo.startdate <= since &&
      since <= semesterInfo.enddate &&
      semesterInfo.semestercode <= currentSemester
    ) {
      return semesterInfo.startdate
    }
  }
  return null
}

const getStartedStats = async ({
  studyProgramme,
  years,
  isAcademicYear,
}: {
  studyProgramme: string
  years: number[]
  isAcademicYear: boolean
}) => {
  const studyRightsOfProgramme = await getStudyRightsInProgramme(studyProgramme, false)
  const startedStudying = getStatsBasis(years)
  const accepted = getStatsBasis(years)
  const { semesters } = await getSemestersAndYears()
  const { semestercode: currentSemester } = Object.values(semesters).find(semester => semester.enddate >= new Date())!

  for (const studyRight of studyRightsOfProgramme) {
    const studyRightElement = studyRight.studyRightElements.find(element => element.code === studyProgramme)
    if (!studyRightElement) {
      continue
    }

    const [, hasTransferredToProgramme] = hasTransferredFromOrToProgramme(studyRight, studyRightElement)
    if (hasTransferredToProgramme) {
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

export const getGraduatedStats = async ({
  studyProgramme,
  years,
  isAcademicYear,
  includeAllSpecials,
}: {
  studyProgramme: string
  years: number[]
  isAcademicYear: boolean
  includeAllSpecials: boolean
}) => {
  const { graphStats, tableStats } = getStatsBasis(years)
  const graduatedStudyRights = await getStudyRightsInProgramme(studyProgramme, true)

  for (const studyRight of graduatedStudyRights) {
    const correctStudyRightElement = studyRight.studyRightElements.find(element => element.code === studyProgramme)
    if (!correctStudyRightElement) {
      continue
    }

    const hasTransferred = hasTransferredFromOrToProgramme(studyRight, correctStudyRightElement)
    if (!includeAllSpecials && hasTransferred.some(fromOrTo => fromOrTo === true)) {
      continue
    }

    const graduationYear = defineYear(new Date(correctStudyRightElement.endDate), isAcademicYear)
    graphStats[indexOf(years, graduationYear)] += 1
    tableStats[graduationYear] += 1
  }

  return { graphStats, tableStats }
}

const getTransferredStats = async ({
  studyProgramme,
  years,
  isAcademicYear,
  combinedProgramme,
}: {
  studyProgramme: string
  years: number[]
  isAcademicYear: boolean
  combinedProgramme: string
}) => {
  const studyRights = await getStudyRightsInProgramme(studyProgramme, false)
  const secondStudyRights = combinedProgramme ? await getStudyRightsInProgramme(combinedProgramme, false) : []
  const transferredAway = getStatsBasis(years)
  const transferredTo = getStatsBasis(years)

  const calculateTransferredStats = (studyRights, programme: string) => {
    for (const studyRight of studyRights) {
      const studyRightElement = studyRight.studyRightElements.find(element => element.code === programme)
      const studyRightElementsWithSamePhase = getStudyRightElementsWithPhase(studyRight, studyRightElement.phase)
      if (studyRightElementsWithSamePhase.length === 1) {
        continue
      }
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
  }

  calculateTransferredStats(studyRights, studyProgramme)
  calculateTransferredStats(secondStudyRights, combinedProgramme)

  return { transferredAway, transferredTo }
}

type Stats = {
  graphStats: number[]
  tableStats: Record<string, number>
}

const initializeGraphStats = (
  includeAllSpecials: boolean,
  combinedProgramme: string,
  started: Stats,
  startedSecondProg: Stats,
  accepted: Stats,
  acceptedSecondProg: Stats,
  graduated: Stats,
  transferredAway: Stats,
  transferredTo: Stats,
  graduatedSecondProg: Stats
) => {
  const basicTable = [] as Array<{ name: string; data: number[] }>
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
  year: number,
  combinedProgramme: string,
  includeAllSpecials: boolean,
  started: Stats,
  startedSecondProg: Stats,
  accepted: Stats,
  acceptedSecondProg: Stats,
  graduated: Stats,
  graduatedSecondProg: Stats,
  transferredAway: Stats,
  transferredTo: Stats
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

export const getBasicStatsForStudytrack = async ({
  studyProgramme,
  combinedProgramme,
  settings,
}: {
  studyProgramme: string
  combinedProgramme: string
  settings: {
    isAcademicYear: boolean
    includeAllSpecials: boolean
  }
}) => {
  const { includeAllSpecials, isAcademicYear } = settings
  const since = getStartDate(isAcademicYear)
  const years = getYearsArray(since.getFullYear(), isAcademicYear) as number[]
  const queryParameters = { studyProgramme, years, isAcademicYear, includeAllSpecials, combinedProgramme }
  const queryParametersCombinedProg = { studyProgramme: combinedProgramme, years, isAcademicYear, includeAllSpecials }
  const { startedStudying, accepted } = await getStartedStats(queryParameters)
  const { startedStudying: startedStudyingSecondProg, accepted: acceptedSecondProg } =
    await getStartedStats(queryParametersCombinedProg)

  const graduated = await getGraduatedStats(queryParameters)
  const graduatedSecondProg = await getGraduatedStats(queryParametersCombinedProg)
  const { transferredAway, transferredTo } = await getTransferredStats(queryParameters)

  const reversedYears = getYearsArray(since.getFullYear(), isAcademicYear).reverse() as number[]
  const key = includeAllSpecials ? 'SPECIAL_INCLUDED' : 'SPECIAL_EXCLUDED'
  const titles = tableTitles.basics[combinedProgramme ? `${key}_COMBINED_PROGRAMME` : key] as string[]
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
    id: combinedProgramme ? `${studyProgramme}-${combinedProgramme}` : studyProgramme,
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
