import { setBasicStats, setCreditStats, setGraduationStats, setStudyTrackStats } from '../analyticsService'
import { computeCreditsProduced } from '../providerCredits'
import { getBasicStatsForStudytrack } from './studyProgrammeBasics'
import { getGraduationStatsForStudyTrack } from './studyProgrammeGraduations'
import { getStudyRightsInProgramme } from './studyRightFinders'
import { getStudyTrackStatsForStudyProgramme } from './studyTrackStats'

export const updateBasicView = async (code: string, combinedProgramme: string) => {
  const yearOptions = ['CALENDAR_YEAR', 'ACADEMIC_YEAR'] as const
  const specialGroupOptions = ['SPECIAL_INCLUDED', 'SPECIAL_EXCLUDED'] as const

  for (const yearType of yearOptions) {
    for (const specialGroup of specialGroupOptions) {
      const isAcademicYear = yearType === 'ACADEMIC_YEAR'
      const includeAllSpecials = specialGroup === 'SPECIAL_INCLUDED'

      const basicStats = await getBasicStatsForStudytrack({
        studyProgramme: code,
        combinedProgramme,
        settings: { isAcademicYear, includeAllSpecials },
      })
      await setBasicStats(basicStats, yearType, specialGroup)

      const creditStats = await computeCreditsProduced(code, isAcademicYear)
      await setCreditStats(creditStats, isAcademicYear, includeAllSpecials)

      if (combinedProgramme) {
        const creditStats = await computeCreditsProduced(combinedProgramme, isAcademicYear)
        await setCreditStats(creditStats, isAcademicYear, includeAllSpecials)
      }

      const graduationStats = await getGraduationStatsForStudyTrack({
        studyProgramme: code,
        combinedProgramme,
        settings: { isAcademicYear, includeAllSpecials },
      })
      await setGraduationStats(graduationStats, yearType, specialGroup)
    }
  }

  return 'OK'
}

export const updateStudyTrackView = async (code: string, combinedProgramme: string) => {
  const specialGroupOptions = ['SPECIAL_INCLUDED', 'SPECIAL_EXCLUDED'] as const
  const studyRightsOfProgramme = await getStudyRightsInProgramme(code, false, true)

  for (const specialGroup of specialGroupOptions) {
    const stats = await getStudyTrackStatsForStudyProgramme({
      studyProgramme: code,
      combinedProgramme,
      settings: {
        specialGroups: specialGroup === 'SPECIAL_INCLUDED',
      },
      studyRightsOfProgramme,
    })
    await setStudyTrackStats(stats, specialGroup)
  }

  return 'OK'
}
