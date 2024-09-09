import { setBasicStats, setCreditStats, setGraduationStats, setStudytrackStats } from '../analyticsService'
import { computeCreditsProduced } from '../providerCredits'
import { getBasicStatsForStudytrack } from './studyProgrammeBasics'
import { getGraduationStatsForStudytrack } from './studyProgrammeGraduations'
import { getStudyRightsInProgramme } from './studyRightFinders'
import { getStudytrackStatsForStudyprogramme } from './studyTrackStats'

export const updateBasicView = async (code: string, combinedProgramme: string) => {
  const yearOptions = ['CALENDAR_YEAR', 'ACADEMIC_YEAR']
  const specialGroupOptions = ['SPECIAL_INCLUDED', 'SPECIAL_EXCLUDED']

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

      const graduationStats = await getGraduationStatsForStudytrack({
        studyProgramme: code,
        combinedProgramme,
        settings: { isAcademicYear, includeAllSpecials },
      })
      await setGraduationStats(graduationStats, yearType, specialGroup)
    }
  }

  return 'OK'
}

export const updateStudytrackView = async (code: string, combinedProgramme: string) => {
  const graduatedOptions = ['GRADUATED_INCLUDED', 'GRADUATED_EXCLUDED']
  const specialGroupOptions = ['SPECIAL_INCLUDED', 'SPECIAL_EXCLUDED']
  const studyRightsOfProgramme = await getStudyRightsInProgramme(code, false, true)

  for (const graduated of graduatedOptions) {
    for (const specialGroup of specialGroupOptions) {
      const stats = await getStudytrackStatsForStudyprogramme({
        studyProgramme: code,
        combinedProgramme,
        settings: {
          specialGroups: specialGroup === 'SPECIAL_INCLUDED',
          graduated: graduated === 'GRADUATED_INCLUDED',
        },
        studyRightsOfProgramme,
      })
      await setStudytrackStats(stats, graduated, specialGroup)
    }
  }

  return 'OK'
}
