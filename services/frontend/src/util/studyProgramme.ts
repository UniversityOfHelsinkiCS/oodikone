export const isNewProgramme = (code: string) => code.includes('KH') || code.includes('MH') || /^(T)[0-9]{6}$/.test(code)

export const getGraduationGraphTitle = (studyProgramme: string, doCombo = false) => {
  if (!studyProgramme) return ''
  if (['MH30_001', 'MH30_003'].includes(studyProgramme)) return 'Licenciate study right'
  if (doCombo && studyProgramme === 'MH90_001') return 'Bachelor + licentiate study right'
  if (doCombo && studyProgramme.includes('MH')) return 'Bachelor + master study right'
  if (studyProgramme.includes('KH')) return 'Bachelor study right'
  if (studyProgramme.includes('MH')) return 'Master study right'
  return 'Doctoral study right'
}
