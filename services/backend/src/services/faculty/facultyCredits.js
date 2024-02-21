const { getCreditsProduced } = require('../providerCredits')
const { getProgrammes } = require('./facultyService')

/* 
  Returns credits produced by the programmes of the faculty but also the credits where the provider is the faculty itself.
*/
const getFacultyCredits = async (facultyCode, isAcademicYear, includeSpecials) => {
  const allProgrammes = (await getProgrammes(facultyCode)).data
  // Filter out old & obsolete codes
  const programmes = allProgrammes.filter(
    ({ code }) =>
      (code.includes('KH') && !code.startsWith('2_KH') && !code.endsWith('_2')) ||
      (code.includes('MH') && !code.startsWith('2_MH') && !code.endsWith('_2')) ||
      /^(T)[0-9]{6}$/.test(code)
  )

  const facultyCredits = await getCreditsProduced(facultyCode, isAcademicYear, includeSpecials)
  const stats = { [facultyCode]: facultyCredits, codes: [facultyCode], programmeNames: {}, ids: [facultyCode] }
  for (const programme of programmes) {
    const programmeCode = programme.code
    const programmeCredits = await getCreditsProduced(programmeCode, isAcademicYear, includeSpecials)
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
