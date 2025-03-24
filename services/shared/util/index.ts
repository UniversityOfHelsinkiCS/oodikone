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

type Ok<T> = {
  data: T
  error: null
}

type Err<E> = {
  data: null
  error: E
}

type Result<T, E = Error> = Ok<T> | Err<E>

/**
 * @returns data, error object with distinct values.
 * This should make it easier to read and write error catching code.
 */
export const tryCatch = async <T, E = Error>(ret: Promise<T> | T): Promise<Result<T, E>> => {
  try {
    const data = await ret
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error as E }
  }
}

export const formatToArray = <T>(param: T | T[]): T[] => {
  return Array.isArray(param) ? param : [param]
}

export const formatQueryParamsToArrays = (query: Record<string, any>, params: string[]) => {
  const result = { ...query }
  params.filter(param => !!result[param]).forEach(param => (result[param] = formatToArray(result[param])))

  return result
}
