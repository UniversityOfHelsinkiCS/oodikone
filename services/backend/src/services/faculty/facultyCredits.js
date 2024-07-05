const { getCreditsProduced } = require('../providerCredits')
const { isRelevantProgramme } = require('../studyProgramme/studyProgrammeHelpers')
const { getProgrammes } = require('./facultyService')

/** Returns credits produced by the programmes of the faculty but also the credits where the provider is the faculty itself. */
const getFacultyCredits = async (facultyCode, isAcademicYear) => {
  const allProgrammes = (await getProgrammes(facultyCode)).data
  const programmes = allProgrammes.filter(({ code }) => isRelevantProgramme(code))
  const facultyCredits = await getCreditsProduced(facultyCode, isAcademicYear)

  const stats = { [facultyCode]: facultyCredits, codes: [facultyCode], programmeNames: {}, ids: [facultyCode] }
  for (const programme of programmes) {
    const programmeCode = programme.code
    const programmeCredits = await getCreditsProduced(programmeCode, isAcademicYear)
    stats[programme.progId] = programmeCredits
    stats.codes.push(programmeCode)
    stats.ids.push(programme.progId)
    stats.programmeNames[programme.progId] = {
      code: programmeCode,
      ...programmes.find(p => p.code === programmeCode).name,
    }
  }

  return stats
}

module.exports = {
  getFacultyCredits,
}
