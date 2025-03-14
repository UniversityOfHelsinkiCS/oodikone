export const getGraduationGraphTitle = (programmeCode: string, doCombo = false) => {
  if (!programmeCode) return ''
  if (['MH30_001', 'MH30_003'].includes(programmeCode)) return 'Licenciate study right'
  if (doCombo && programmeCode === 'MH90_001') return 'Bachelor + licentiate study right'
  if (doCombo && programmeCode.includes('MH')) return 'Bachelor + master study right'
  if (programmeCode.includes('KH')) return 'Bachelor study right'
  if (programmeCode.includes('MH')) return 'Master study right'
  return 'Doctoral study right'
}

export const isNewProgramme = (programmeCode: string) => {
  return programmeCode.includes('KH') || programmeCode.includes('MH') || /^(T)[0-9]{6}$/.test(programmeCode)
}

export const isMedicalProgramme = (programmeCode: string) => {
  return ['KH90_001', 'MH30_001', 'MH30_003'].includes(programmeCode)
}

export const isBachelorOrLicentiateProgramme = (programmeCode: string) => {
  return programmeCode.includes('KH') || ['MH30_001', 'MH30_003'].includes(programmeCode)
}
