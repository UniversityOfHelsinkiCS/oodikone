const handleUnderscoreProgrammeCode = (programmeCode: string) => {
  const [left, right] = programmeCode.split('_')
  const prefix = [...left].filter(char => !Number.isNaN(Number(char))).join('')
  const suffix = `${left[0]}${right}`
  return `${prefix}0-${suffix}`
}

const handleDoctoralProgrammeCode = (programmeCode: string) => {
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

const programmeCodeToProviderCode = (programmeCode: string) => {
  if (programmeCode.includes('_')) {
    return handleUnderscoreProgrammeCode(programmeCode)
  }
  if (/^(T)[0-9]{6}$/.test(programmeCode)) {
    return handleDoctoralProgrammeCode(programmeCode)
  }
  return programmeCode
}

export const mapToProviders = (programmeCodes: string[]) => {
  return programmeCodes.map(programmeCodeToProviderCode)
}

export const formatToArray = <T>(param: T | T[]): T[] => {
  return Array.isArray(param) ? param : [param]
}

export const formatQueryParamsToArrays = (query: Record<string, any>, params: string[]) => {
  const result = { ...query }
  params.filter(param => !!result[param]).forEach(param => (result[param] = formatToArray(result[param])))

  return result
}
