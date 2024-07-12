const handleUnderscoreProgrammeCode = (programmeCode: string): string => {
  const [left, right] = programmeCode.split('_')
  const prefix = [...left].filter(char => !Number.isNaN(Number(char))).join('')
  const suffix = `${left[0]}${right}`
  return `${prefix}0-${suffix}`
}

const handleDoctoralProgrammeCode = (programmeCode: string): string => {
  const numbers = programmeCode.substring(1)
  const courseProvider = Number(`7${numbers}`)
  if (courseProvider < 7920111 && courseProvider > 7920102) {
    return `${courseProvider + 1}`
  }
  if (courseProvider === 7920111) {
    return '7920103'
  }
  return `${courseProvider}`
}

export const mapToProviders = (programmeCodes: string[]): string[] => {
  return programmeCodes.map(programmeCode => {
    if (programmeCode.includes('_')) {
      return handleUnderscoreProgrammeCode(programmeCode)
    }
    if (/^(T)[0-9]{6}$/.test(programmeCode)) {
      return handleDoctoralProgrammeCode(programmeCode)
    }
    return programmeCode
  })
}
