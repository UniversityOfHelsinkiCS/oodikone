import { Request, Response, Router } from 'express'

import { Graduated, SpecialGroups, YearType } from '@oodikone/shared/types'
import { CreditStatsPayload } from '@oodikone/shared/types/studyProgramme'
import {
  getBasicStats,
  setBasicStats,
  getGraduationStats,
  setGraduationStats,
  getStudyTrackStats,
  setStudyTrackStats,
} from '../services/analyticsService'
import { getCreditsProduced } from '../services/providerCredits'
import { getBasicStatsForStudytrack } from '../services/studyProgramme/studyProgrammeBasics'
import {
  getStudyProgrammeCoursesForStudyTrack,
  getStudyProgrammeStatsForColorizedCoursesTable,
} from '../services/studyProgramme/studyProgrammeCourses'
import { getGraduationStatsForStudyTrack } from '../services/studyProgramme/studyProgrammeGraduations'
import { updateBasicView, updateStudyTrackView } from '../services/studyProgramme/studyProgrammeUpdates'
import { getStudyRightsInProgramme, getStudyTracksForProgramme } from '../services/studyProgramme/studyRightFinders'
import { getStudyTrackStatsForStudyProgramme } from '../services/studyProgramme/studyTrackStats'
import logger from '../util/logger'
import { logInfoForGrafana } from '../util/logInfoForGrafana'

const router = Router()

interface GetCreditStatsRequest extends Request {
  query: {
    codes: string
    specialGroups: SpecialGroups
    yearType: YearType
  }
}

router.get('/creditstats', async (req: GetCreditStatsRequest, res: Response) => {
  const { codes, specialGroups, yearType } = req.query
  const stats: CreditStatsPayload = {}
  for (const code of JSON.parse(codes)) {
    stats[code] = await getCreditsProduced(code, yearType === 'ACADEMIC_YEAR', specialGroups === 'SPECIAL_INCLUDED')
  }
  return res.json(stats)
})

interface GetStatsRequest extends Request {
  query: {
    year_type: YearType
    special_groups: SpecialGroups
    combined_programme: string
  }
}

router.get('/:id/basicstats', async (req: GetStatsRequest, res: Response) => {
  const code = req.params.id
  const { year_type: yearType, special_groups: specialGroups, combined_programme: combinedProgramme } = req.query
  if (!code) {
    return res.status(422).end()
  }

  void logInfoForGrafana(code, combinedProgramme)
  const data = await getBasicStats(code, combinedProgramme, yearType, specialGroups)
  if (data) {
    return res.json(data)
  }

  const updatedStats = await getBasicStatsForStudytrack({
    studyProgramme: code,
    combinedProgramme,
    settings: {
      isAcademicYear: yearType === 'ACADEMIC_YEAR',
      includeAllSpecials: specialGroups === 'SPECIAL_INCLUDED',
    },
  })
  if (updatedStats) {
    await setBasicStats(updatedStats, yearType, specialGroups)
  }
  return res.json(updatedStats)
})

router.get('/:id/graduationstats', async (req: GetStatsRequest, res: Response) => {
  const code = req.params.id
  const { year_type: yearType, special_groups: specialGroups, combined_programme: combinedProgramme } = req.query
  if (!code) {
    return res.status(422).end()
  }

  const data = await getGraduationStats(code, combinedProgramme, yearType, specialGroups)
  if (data) {
    return res.json(data)
  }

  const updatedStats = await getGraduationStatsForStudyTrack({
    studyProgramme: code,
    combinedProgramme,
    settings: {
      isAcademicYear: yearType === 'ACADEMIC_YEAR',
      includeAllSpecials: specialGroups === 'SPECIAL_INCLUDED',
    },
  })
  if (updatedStats) {
    await setGraduationStats(updatedStats, yearType, specialGroups)
  }

  return res.json(updatedStats)
})

interface GetCourseStatsRequest extends Request {
  query: {
    combinedProgramme: string
    yearType: YearType
  }
}

router.get('/:id/coursestats', async (req: GetCourseStatsRequest, res: Response) => {
  const code = req.params.id
  const { combinedProgramme, yearType } = req.query
  const date = new Date()
  date.setHours(23, 59, 59, 999)
  void logInfoForGrafana(code, combinedProgramme)
  try {
    const data = await getStudyProgrammeCoursesForStudyTrack(date.getTime(), code, yearType, combinedProgramme)
    return res.json(data)
  } catch (error) {
    logger.error({ message: `Failed to get code ${code} programme courses stats`, meta: `${error}` })
  }
})

interface GetStudyTrackStatsRequest extends Request {
  query: {
    graduated: Graduated
    special_groups: SpecialGroups
    combined_programme: string
  }
}

router.get('/:id/studytrackstats', async (req: GetStudyTrackStatsRequest, res: Response) => {
  const code = req.params.id
  const { special_groups: specialGroups, combined_programme: combinedProgramme } = req.query
  if (!code) {
    return res.status(422).end()
  }

  void logInfoForGrafana(code, combinedProgramme)
  const data = await getStudyTrackStats(code, combinedProgramme, specialGroups)
  if (data) {
    return res.json(data)
  }

  const studyRightsOfProgramme = await getStudyRightsInProgramme(code, false, true)
  const updated = await getStudyTrackStatsForStudyProgramme({
    studyProgramme: code,
    combinedProgramme,
    settings: {
      specialGroups: specialGroups === 'SPECIAL_INCLUDED',
    },
    studyRightsOfProgramme,
  })
  if (updated) {
    await setStudyTrackStats(updated, specialGroups)
  }
  return res.json(updated)
})

router.get('/:id/colorizedtablecoursestats', async (req: Request, res: Response) => {
  const code = req.params.id
  try {
    const data = await getStudyProgrammeStatsForColorizedCoursesTable(code)
    return res.json(data)
  } catch (error) {
    logger.error({ message: `Failed to get code ${code} colorized table course stats`, meta: `${error}` })
  }
})

router.get('/:id/studytracks', async (req: Request, res: Response) => {
  const code = req.params.id
  if (!code) {
    return res.status(422).end()
  }
  try {
    const data = await getStudyTracksForProgramme(code)
    return res.json(data)
  } catch (error) {
    logger.error({ message: `Failed to get study tracks for degree programme ${code}`, meta: `${error}` })
  }
})

interface GetUpdateViewRequest extends Request {
  query: {
    combined_programme: string
  }
}

router.get('/:id/update_basicview', async (req: GetUpdateViewRequest, res: Response) => {
  const code = req.params.id
  const combinedProgramme = req.query?.combined_programme
  if (!code) {
    return res.status(400).json({ error: 'Missing code' })
  }
  try {
    const result = await updateBasicView(code, combinedProgramme)
    return res.json(result)
  } catch (error) {
    const message = `Failed to update basic stats for programme ${code}${combinedProgramme ? `+${combinedProgramme}` : ''}`
    logger.error(message, { error })
    return res.status(500).json({ error: message })
  }
})

router.get('/:id/update_studytrackview', async (req: GetUpdateViewRequest, res: Response) => {
  const code = req.params.id
  const combinedProgramme = req.query?.combined_programme
  if (!code) {
    return res.status(400).json({ error: 'Missing code' })
  }
  try {
    const result = await updateStudyTrackView(code, combinedProgramme)
    return res.json(result)
  } catch (error) {
    const message = `Failed to update study track stats for programme ${code}${combinedProgramme ? `+${combinedProgramme}` : ''}`
    logger.error(message, { error })
    return res.status(500).json({ error: message })
  }
})

export default router
