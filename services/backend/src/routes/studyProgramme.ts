import { Request, Response, Router } from 'express'

import {
  getBasicStats,
  setBasicStats,
  getGraduationStats,
  setGraduationStats,
  getStudyTrackStats,
  setStudyTrackStats,
} from '../services/analyticsService'
import { getCreditsProduced } from '../services/providerCredits'
import { getProgrammeName } from '../services/studyProgramme'
import { getBasicStatsForStudytrack } from '../services/studyProgramme/studyProgrammeBasics'
import {
  getStudyProgrammeCoursesForStudyTrack,
  getStudyProgrammeStatsForColorizedCoursesTable,
} from '../services/studyProgramme/studyProgrammeCourses'
import { getGraduationStatsForStudyTrack } from '../services/studyProgramme/studyProgrammeGraduations'
import { updateBasicView, updateStudyTrackView } from '../services/studyProgramme/studyProgrammeUpdates'
import { getStudyRightsInProgramme } from '../services/studyProgramme/studyRightFinders'
import { getStudyTrackStatsForStudyProgramme } from '../services/studyProgramme/studyTrackStats'
import { Graduated, SpecialGroups, YearType } from '../types'
import logger from '../util/logger'
import { logInfoForGrafana } from '../util/logInfoForGrafana'

const router = Router()

interface GetCreditStatsRequest extends Request {
  query: {
    codes: string
    isAcademicYear: string
    includeSpecials: string
  }
}

router.get('/creditstats', async (req: GetCreditStatsRequest, res: Response) => {
  const { codes, isAcademicYear, includeSpecials } = req.query
  const stats = {}
  for (const code of JSON.parse(codes)) {
    stats[code] = await getCreditsProduced(code, isAcademicYear !== 'false', includeSpecials !== 'false')
  }
  return res.json({ stats })
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

  logInfoForGrafana(code, combinedProgramme)
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
    academicyear: string
    combined_programme: string
  }
}

router.get('/:id/coursestats', async (req: GetCourseStatsRequest, res: Response) => {
  const code = req.params.id
  const showByYear = req.query.academicyear
  const combinedProgramme = req.query?.combined_programme
  const date = new Date()
  date.setHours(23, 59, 59, 999)
  logInfoForGrafana(code, combinedProgramme)
  try {
    const data = await getStudyProgrammeCoursesForStudyTrack(date.getTime(), code, showByYear, combinedProgramme)
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
  const { graduated, special_groups: specialGroups, combined_programme: combinedProgramme } = req.query
  if (!code) {
    return res.status(422).end()
  }

  logInfoForGrafana(code, combinedProgramme)
  const data = await getStudyTrackStats(code, combinedProgramme, graduated, specialGroups)
  if (data) {
    return res.json(data)
  }

  const studyRightsOfProgramme = await getStudyRightsInProgramme(code, false, true)
  const updated = await getStudyTrackStatsForStudyProgramme({
    studyProgramme: code,
    combinedProgramme,
    settings: {
      graduated: graduated === 'GRADUATED_INCLUDED',
      specialGroups: specialGroups === 'SPECIAL_INCLUDED',
    },
    studyRightsOfProgramme,
  })
  if (updated) {
    await setStudyTrackStats(updated, graduated, specialGroups)
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

interface GetEvaluationStatsRequest extends Request {
  query: {
    graduated: Graduated
    year_type: YearType
    special_groups: SpecialGroups
  }
}

router.get('/:id/evaluationstats', async (req: GetEvaluationStatsRequest, res: Response) => {
  const code = req.params.id
  const { graduated, year_type: yearType, special_groups: specialGroups } = req.query
  if (!code) {
    return res.status(422).end()
  }
  // Statistics for Tilannekuvalomake view
  const combinedProgramme = ''
  let gradData = await getGraduationStats(code, combinedProgramme, yearType, specialGroups)
  if (!gradData) {
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
      gradData = updatedStats
    }
  }

  let progressData = await getStudyTrackStats(code, combinedProgramme, graduated, specialGroups)
  if (!progressData) {
    const studyRightsOfProgramme = await getStudyRightsInProgramme(code, false, true)
    const updated = await getStudyTrackStatsForStudyProgramme({
      studyProgramme: code,
      combinedProgramme,
      settings: {
        graduated: graduated === 'GRADUATED_INCLUDED',
        specialGroups: specialGroups === 'SPECIAL_INCLUDED',
      },
      studyRightsOfProgramme,
    })
    if (updated) {
      await setStudyTrackStats(updated, graduated, specialGroups)
      progressData = updated
    }
  }

  const programmeName = await getProgrammeName(code)

  delete gradData.tableStats
  delete gradData.graphStats
  delete gradData.titles
  const data = {
    id: code,
    programmeName,
    status: gradData?.status,
    lastUpdated: gradData.lastUpdated,
    graduations: gradData,
    creditCounts: progressData?.creditCounts,
    creditCountsCombo: progressData?.creditCountsCombo,
    years: progressData?.years,
  }

  return res.json(data)
})

export default router
