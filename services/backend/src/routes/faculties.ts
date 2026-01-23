import { Router } from 'express'

import type { CanError, GenericApplicationError } from '@oodikone/shared/routes'
import type {
  Graduated,
  Name,
  NameWithCode,
  ProgrammeFilter,
  SpecialGroups,
  StatsType,
  Unarray,
  YearType,
} from '@oodikone/shared/types'
import * as auth from '../middleware/auth'
import { getDegreeProgrammesOfFaculty, getFacultyCodeById, ProgrammesOfOrganization } from '../services/faculty/faculty'
import { combineFacultyBasics } from '../services/faculty/facultyBasics'
import { getFacultyCredits } from '../services/faculty/facultyCredits'
import { countGraduationTimes } from '../services/faculty/facultyGraduationTimes'
import { getFacultiesForFacultyList } from '../services/faculty/facultyHelpers'
import {
  getBasicStats,
  setBasicStats,
  getThesisWritersStats,
  setThesisWritersStats,
  getGraduationStats,
  setGraduationStats,
  getFacultyStudentStats,
  setFacultyStudentStats,
  getFacultyProgressStats,
  setFacultyProgressStats,
  type BasicData,
  type ThesisWriterData,
  GraduationData,
} from '../services/faculty/facultyService'
import { combineFacultyStudentProgress } from '../services/faculty/facultyStudentProgress'
import { combineFacultyStudents } from '../services/faculty/facultyStudents'
import { combineFacultyThesisWriters } from '../services/faculty/facultyThesisWriters'
import { updateFacultyOverview, updateFacultyProgressOverview } from '../services/faculty/facultyUpdates'
import { ApplicationError } from '../util/customErrors'

// Faculty uses a lot of tools designed for Degree programme.
// Some of them have been copied here and slightly edited for faculty purpose.

const router = Router()

type GetFacultyListResBody = {
  id: string
  code: string
  name: Name
}[]

router.get<never, GetFacultyListResBody>('/', async (_req, res) => res.json(await getFacultiesForFacultyList()))

type GetStatsParams = { id: string }
type GetStatsReqBody = never
type GetStatsResBody = BasicData
type GetStatsQuery = {
  programme_filter: ProgrammeFilter
  special_groups: SpecialGroups
  year_type: YearType
}

router.get<GetStatsParams, CanError<GetStatsResBody, GenericApplicationError>, GetStatsReqBody, GetStatsQuery>(
  '/:id/basicstats',
  auth.roles(['facultyStatistics']),
  async (req, res) => {
    const { id: facultyId } = req.params
    const { year_type: yearType, programme_filter: programmeFilter, special_groups: specialGroups } = req.query

    const faculty = await getFacultyCodeById(facultyId)
    if (!faculty) throw new ApplicationError(`The organization with the id ${facultyId} was not found.`, 422)

    const data = await getBasicStats(faculty.code, yearType, programmeFilter, specialGroups)
    if (data) return res.json(data)

    const programmes = await getDegreeProgrammesOfFaculty(faculty.code, programmeFilter === 'NEW_DEGREE_PROGRAMMES')
    if (!programmes.length) throw new ApplicationError('Unprocessable request', 422)

    const updatedStats = await combineFacultyBasics(faculty.code, programmes, yearType, specialGroups)

    if (updatedStats) await setBasicStats(updatedStats, yearType, programmeFilter, specialGroups)
    else throw new ApplicationError('No data', 204)

    return res.json(updatedStats)
  }
)

type GetFacultyStatsResBody = ThesisWriterData

router.get<GetStatsParams, CanError<GetFacultyStatsResBody, GenericApplicationError>, GetStatsReqBody, GetStatsQuery>(
  '/:id/thesisstats',
  auth.roles(['facultyStatistics']),
  async (req, res) => {
    const { id: facultyId } = req.params
    const { year_type: yearType, programme_filter: programmeFilter, special_groups: specialGroups } = req.query

    const faculty = await getFacultyCodeById(facultyId)
    if (!faculty) throw new ApplicationError(`The organization with the id ${facultyId} was not found.`, 422)

    const data = await getThesisWritersStats(faculty.code, yearType, programmeFilter, specialGroups)
    if (data) return res.json(data)

    const programmes = await getDegreeProgrammesOfFaculty(faculty.code, programmeFilter === 'NEW_DEGREE_PROGRAMMES')
    if (!programmes.length) throw new ApplicationError('Unprocessable request', 422)

    const updatedStats = await combineFacultyThesisWriters(faculty.code, programmes, yearType, specialGroups)
    if (updatedStats) await setThesisWritersStats(updatedStats, yearType, programmeFilter, specialGroups)
    else throw new ApplicationError('No data', 204)

    return res.json(updatedStats)
  }
)

type GetCreditStatsResBody = {
  codes: string[]
  ids: string[]
  programmeNames: Record<string, NameWithCode>
}
type GetCreditStatsQuery = {
  year_type: YearType
}

router.get<
  GetStatsParams,
  CanError<GetCreditStatsResBody, GenericApplicationError>,
  GetStatsReqBody,
  GetCreditStatsQuery
>('/:id/creditstats', auth.roles(['facultyStatistics']), async (req, res) => {
  const { id: facultyId } = req.params
  const { year_type: yearType } = req.query

  const faculty = await getFacultyCodeById(facultyId)
  if (!faculty) throw new ApplicationError(`The organization with the id ${facultyId} was not found.`, 422)

  return res.json(await getFacultyCredits(faculty.code, yearType === 'ACADEMIC_YEAR'))
})

type GetGraduationStatsResBody = GraduationData
type GetGraduationStatsQuery = {
  programme_filter: ProgrammeFilter
}

router.get<
  GetStatsParams,
  CanError<GetGraduationStatsResBody, GenericApplicationError>,
  GetStatsReqBody,
  GetGraduationStatsQuery
>('/:id/graduationtimes', auth.roles(['facultyStatistics']), async (req, res) => {
  const { id: facultyId } = req.params
  const { programme_filter: programmeFilter } = req.query

  const faculty = await getFacultyCodeById(facultyId)
  if (!faculty) throw new ApplicationError(`The organization with the id ${facultyId} was not found.`, 422)

  const data = await getGraduationStats(faculty.code, programmeFilter)
  if (data) return res.json(data)

  const programmes = await getDegreeProgrammesOfFaculty(faculty.code, programmeFilter === 'NEW_DEGREE_PROGRAMMES')
  if (!programmes.length) throw new ApplicationError('Unprocessable request', 422)

  const updatedStats = await countGraduationTimes(faculty.code, programmes)
  if (updatedStats) await setGraduationStats(updatedStats, programmeFilter)

  return res.json(updatedStats)
})

type GetProgressStatsResBody = {
  bachelorsProgStats: Record<string, number[][]>
  bcMsProgStats: Record<string, number[][]>
  creditCounts: Record<string, Record<string, number[]>>
  doctoralProgStats: Record<string, number[][]>
  id: string
  mastersProgStats: Record<string, number[][]>
  programmeNames: Record<string, NameWithCode>
  yearlyBachelorTitles: string[][]
  yearlyBcMsTitles: string[][]
  yearlyMasterTitles: string[][]
  years: string[]
}

type GetProgressStatsQuery = {
  graduated: Graduated
  special_groups: SpecialGroups
}

router.get<
  GetStatsParams,
  CanError<GetProgressStatsResBody, GenericApplicationError>,
  GetStatsReqBody,
  GetProgressStatsQuery
>('/:id/progressstats', auth.roles(['facultyStatistics']), async (req, res) => {
  const { id: facultyId } = req.params
  const { special_groups: specialGroups } = req.query

  const faculty = await getFacultyCodeById(facultyId)
  if (!faculty) throw new ApplicationError(`The organization with the id ${facultyId} was not found.`, 422)

  const programmes = await getDegreeProgrammesOfFaculty(faculty.code, true)
  if (!programmes.length) throw new ApplicationError('Unprocessable request', 422)

  const data = await getFacultyProgressStats(faculty.code, specialGroups)
  if (data) return res.json(data)

  const updatedStats = await combineFacultyStudentProgress(faculty.code, programmes, specialGroups)
  if (updatedStats) await setFacultyProgressStats(updatedStats, specialGroups)

  return res.json(updatedStats)
})

export type DegreeProgramme = Pick<
  Unarray<ProgrammesOfOrganization>,
  'code' | 'name' | 'degreeProgrammeType' | 'progId'
>

type GetStudetStatsResBody = {
  id: string
  years: string[]
  facultyTableStats: Record<string, (number | string)[]>
  facultyTableStatsExtra: Record<string, Record<string, Record<string, number>>>
  /**
   * NOTE: programmeStats order is random (not by the year). Make sure to index properly.
   *
   * (Order is based on the order in which studyrights were processed in the backend)
   */
  programmeStats: Record<string, Record<string, (string | number)[]>>
  titles: string[]
  programmeNames: Record<string, DegreeProgramme>
}

router.get<
  GetStatsParams,
  CanError<GetStudetStatsResBody, GenericApplicationError>,
  GetStatsReqBody,
  GetProgressStatsQuery
>('/:id/studentstats', auth.roles(['facultyStatistics']), async (req, res) => {
  const { id: facultyId } = req.params
  const { special_groups: specialGroups } = req.query

  const faculty = await getFacultyCodeById(facultyId)
  if (!faculty) throw new ApplicationError(`The organization with the id ${facultyId} was not found.`, 422)

  const data = await getFacultyStudentStats(faculty.code, specialGroups)
  if (data) return res.json(data)

  const programmes = await getDegreeProgrammesOfFaculty(faculty.code, true)
  if (!programmes.length) throw new ApplicationError('Unprocessable request', 422)

  const updatedStats = await combineFacultyStudents(faculty.code, programmes, specialGroups)
  if (updatedStats) await setFacultyStudentStats(updatedStats, specialGroups)

  return res.json(updatedStats)
})

type GetUpdateBasicViewResBody = never
type GetUpdateBasicViewQuery = {
  stats_type: StatsType
}

router.get<
  GetStatsParams,
  CanError<GetUpdateBasicViewResBody, GenericApplicationError>,
  GetStatsReqBody,
  GetUpdateBasicViewQuery
>('/:id/update_basicview', auth.roles(['facultyStatistics']), async (req, res) => {
  const { id: facultyId } = req.params
  const { stats_type: statsType } = req.query

  const faculty = await getFacultyCodeById(facultyId)
  if (!faculty) throw new ApplicationError(`The organization with the id ${facultyId} was not found.`, 422)

  try {
    await updateFacultyOverview(faculty.code, statsType)
    return res.json()
  } catch (error) {
    throw new ApplicationError(`Failed to update basic stats for faculty ${faculty.code}`, 500)
  }
})

router.get<GetStatsParams, CanError<never, GenericApplicationError>, GetStatsReqBody, GetStatsQuery>(
  '/:id/update_progressview',
  auth.roles(['facultyStatistics']),
  async (req, res) => {
    const { id: facultyId } = req.params

    const faculty = await getFacultyCodeById(facultyId)
    if (!faculty) throw new ApplicationError(`The organization with the id ${facultyId} was not found.`, 422)

    try {
      await updateFacultyProgressOverview(faculty.code)
      return res.json()
    } catch (error) {
      throw new ApplicationError(`Failed to update progress tab stats for faculty ${faculty.code}`, 500)
    }
  }
)

export default router
