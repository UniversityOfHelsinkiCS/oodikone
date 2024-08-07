import { Request, Response, Router } from 'express'

import * as auth from '../middleware/auth'
import { getDegreeProgrammesOfFaculty } from '../services/faculty/faculty'
import { combineFacultyBasics } from '../services/faculty/facultyBasics'
import { getFacultyCredits } from '../services/faculty/facultyCredits'
import { countGraduationTimes } from '../services/faculty/facultyGraduationTimes'
import { getSortedFaculties } from '../services/faculty/facultyHelpers'
import {
  getProgrammes,
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
} from '../services/faculty/facultyService'
import { combineFacultyStudentProgress } from '../services/faculty/facultyStudentProgress'
import { combineFacultyStudents } from '../services/faculty/facultyStudents'
import { combineFacultyThesisWriters } from '../services/faculty/facultyThesisWriters'
import { updateFacultyOverview, updateFacultyProgressOverview } from '../services/faculty/facultyUpdates'
import { Graduated, ProgrammeFilter, SpecialGroups, StatsType, YearType } from '../types'
import logger from '../util/logger'

// Faculty uses a lot of tools designed for Study programme.
// Some of them have been copied here and slightly edited for faculty purpose.

const router = Router()

router.get('/', async (_req: Request, res: Response) => {
  const faculties = await getSortedFaculties()
  res.json(faculties)
})

interface GetStatsRequest extends Request {
  query: {
    programme_filter: ProgrammeFilter
    special_groups: SpecialGroups
    year_type: YearType
  }
}

router.get(
  '/:id/basicstats',
  auth.roles(['facultyStatistics', 'katselmusViewer']),
  async (req: GetStatsRequest, res: Response) => {
    const code = req.params.id
    if (!code) {
      return res.status(422).end()
    }

    const { year_type: yearType, programme_filter: programmeFilter, special_groups: specialGroups } = req.query
    const data = await getBasicStats(code, yearType, programmeFilter, specialGroups)
    if (data) {
      return res.json(data)
    }

    const programmes = await getDegreeProgrammesOfFaculty(code, programmeFilter === 'NEW_STUDY_PROGRAMMES')
    if (!programmes.length) {
      return res.status(422).end()
    }

    // TODO: The types could be handled better. Possible null value is causing issues with TS.
    let updatedStats: any = await combineFacultyBasics(code, programmes, yearType, specialGroups)
    if (updatedStats) {
      updatedStats = await setBasicStats(updatedStats, yearType, programmeFilter, specialGroups)
    }
    return res.json(updatedStats)
  }
)

interface GetCreditStatsRequest extends Request {
  query: {
    year_type: YearType
  }
}

router.get(
  '/:id/creditstats',
  auth.roles(['facultyStatistics', 'katselmusViewer']),
  async (req: GetCreditStatsRequest, res: Response) => {
    const code = req.params.id
    const { year_type: yearType } = req.query
    const stats = await getFacultyCredits(code, yearType === 'ACADEMIC_YEAR')
    return res.json(stats)
  }
)

router.get(
  '/:id/thesisstats',
  auth.roles(['facultyStatistics', 'katselmusViewer']),
  async (req: GetStatsRequest, res: Response) => {
    const code = req.params.id
    if (!code) {
      return res.status(422).end()
    }

    const { year_type: yearType, programme_filter: programmeFilter, special_groups: specialGroups } = req.query
    const data = await getThesisWritersStats(code, yearType, programmeFilter, specialGroups)
    if (data) {
      return res.json(data)
    }

    const programmes = await getDegreeProgrammesOfFaculty(code, programmeFilter === 'NEW_STUDY_PROGRAMMES')
    if (!programmes.length) {
      return res.status(422).end()
    }

    let updatedStats: any = await combineFacultyThesisWriters(code, programmes, yearType, specialGroups)
    if (updatedStats) {
      updatedStats = await setThesisWritersStats(updatedStats, yearType, programmeFilter, specialGroups)
    }
    return res.json(updatedStats)
  }
)

interface GetGraduationStatsRequest extends Request {
  query: {
    programme_filter: ProgrammeFilter
  }
}

router.get(
  '/:id/graduationtimes',
  auth.roles(['facultyStatistics', 'katselmusViewer']),
  async (req: GetGraduationStatsRequest, res: Response) => {
    const code = req.params.id
    if (!code) {
      return res.status(422).end()
    }

    const { programme_filter: programmeFilter } = req.query
    const data = await getGraduationStats(code, programmeFilter)
    if (data) {
      return res.json(data)
    }

    const programmes = await getDegreeProgrammesOfFaculty(code, programmeFilter === 'NEW_STUDY_PROGRAMMES')
    if (!programmes) {
      return res.status(422).end()
    }

    let updatedStats: any = await countGraduationTimes(code, programmes)
    if (updatedStats) {
      updatedStats = await setGraduationStats(updatedStats, programmeFilter)
    }
    return res.json(updatedStats)
  }
)

interface GetProgressStatsRequest extends Request {
  query: {
    graduated: Graduated
    special_groups: SpecialGroups
  }
}

router.get(
  '/:id/progressstats',
  auth.roles(['facultyStatistics', 'katselmusViewer']),
  async (req: GetProgressStatsRequest, res: Response) => {
    const code = req.params.id
    if (!code) {
      return res.status(422).end()
    }

    const programmes = await getProgrammes(code, 'NEW_STUDY_PROGRAMMES')
    if (!programmes) {
      return res.status(422).end()
    }

    const { graduated, special_groups: specialGroups } = req.query
    const data = await getFacultyProgressStats(code, specialGroups, graduated)
    if (data) {
      return res.json(data)
    }

    let updatedStats: any = await combineFacultyStudentProgress(code, programmes.data, specialGroups, graduated)
    if (updatedStats) {
      updatedStats = await setFacultyProgressStats(updatedStats, specialGroups, graduated)
    }
    return res.json(updatedStats)
  }
)

interface GetStudentStatsRequest extends GetProgressStatsRequest {}

router.get(
  '/:id/studentstats',
  auth.roles(['facultyStatistics', 'katselmusViewer']),
  async (req: GetStudentStatsRequest, res: Response) => {
    const code = req.params.id
    if (!code) {
      return res.status(422).end()
    }

    const { graduated, special_groups: specialGroups } = req.query

    const data = await getFacultyStudentStats(code, specialGroups, graduated)
    if (data) {
      return res.json(data)
    }

    const newProgrammes = await getDegreeProgrammesOfFaculty(code, true)
    if (!newProgrammes.length) {
      return res.status(422).end()
    }

    let updatedStats: any = await combineFacultyStudents(code, newProgrammes, specialGroups, graduated)
    if (updatedStats) {
      updatedStats = await setFacultyStudentStats(updatedStats, specialGroups, graduated)
    }
    return res.json(updatedStats)
  }
)

interface GetUpdateBasicViewRequest extends Request {
  query: {
    stats_type: StatsType
  }
}

router.get(
  '/:id/update_basicview',
  auth.roles(['facultyStatistics', 'katselmusViewer']),
  async (req: GetUpdateBasicViewRequest, res: Response) => {
    const code = req.params.id
    if (!code) {
      return res.status(422).end()
    }
    const { stats_type: statsType } = req.query
    try {
      const result = await updateFacultyOverview(code, statsType)
      return res.json(result)
    } catch (error) {
      const message = `Failed to update basic stats for faculty ${code}`
      logger.error(message, { error })
      return res.status(500).json({ error: message })
    }
  }
)

router.get(
  '/:id/update_progressview',
  auth.roles(['facultyStatistics', 'katselmusViewer']),
  async (req: Request, res: Response) => {
    const code = req.params.id
    if (!code) {
      return res.status(422).end()
    }
    try {
      const result = await updateFacultyProgressOverview(code)
      return res.json(result)
    } catch (error) {
      const message = `Failed to update progress tab stats for faculty ${code}`
      logger.error(message, { error })
      return res.status(500).json({ error: message })
    }
  }
)

export default router
