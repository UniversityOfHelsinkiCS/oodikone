import { Name } from '../../shared/types'
import { getCreditsProduced } from '../providerCredits'
import { isRelevantProgramme } from '../studyProgramme/studyProgrammeHelpers'
import { getDegreeProgrammesOfFaculty } from './faculty'

/**
 * Returns credits produced by the programmes of the faculty but
 * also the credits where the provider is the faculty itself
 */
export const getFacultyCredits = async (facultyCode: string, isAcademicYear: boolean) => {
  const programmes = (await getDegreeProgrammesOfFaculty(facultyCode, true)).filter(({ code }) =>
    isRelevantProgramme(code)
  )
  const facultyCredits = await getCreditsProduced(facultyCode, isAcademicYear)

  const stats = {
    [facultyCode]: facultyCredits,
    codes: [facultyCode],
    programmeNames: {} as Record<string, { code: string } & Name>,
    ids: [facultyCode],
  }

  for (const { code, progId, name } of programmes) {
    const programmeCredits = await getCreditsProduced(code, isAcademicYear)
    stats[progId] = programmeCredits
    stats.codes.push(code)
    stats.ids.push(progId)
    stats.programmeNames[progId] = {
      code,
      ...name,
    }
  }

  return stats
}
