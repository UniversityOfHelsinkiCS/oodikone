import { getCreditsProduced } from '../providerCredits'
import { isRelevantProgramme } from '../studyProgramme/studyProgrammeHelpers'
import { getProgrammes } from './facultyService'

/**
 * Returns credits produced by the programmes of the faculty but
 * also the credits where the provider is the faculty itself
 */
export const getFacultyCredits = async (facultyCode: string, isAcademicYear: boolean) => {
  const allProgrammes = (await getProgrammes(facultyCode)).data
  const programmes = allProgrammes.filter(({ code }) => isRelevantProgramme(code))
  const facultyCredits = await getCreditsProduced(facultyCode, isAcademicYear)

  const stats = {
    [facultyCode]: facultyCredits,
    codes: [facultyCode],
    programmeNames: {},
    ids: [facultyCode],
  }

  for (const programme of programmes) {
    const programmeCode = programme.code
    const programmeCredits = await getCreditsProduced(programmeCode, isAcademicYear)
    stats[programme.progId] = programmeCredits
    stats.codes.push(programmeCode)
    stats.ids.push(programme.progId)
    stats.programmeNames[programme.progId] = {
      code: programmeCode,
      ...programmes.find(programme => programme.code === programmeCode).name,
    }
  }

  return stats
}
