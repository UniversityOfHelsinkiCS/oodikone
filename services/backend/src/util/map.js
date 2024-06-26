const getNestedProperty = (obj, path) => {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj)
}

const mapObject = (obj, schema) => {
  return Object.keys(schema).reduce((acc, key) => {
    acc[key] = getNestedProperty(obj, schema[key])
    return acc
  }, {})
}

const handleUnderscoreProgrammeCode = programmeCode => {
  const [left, right] = programmeCode.split('_')
  const prefix = [...left].filter(char => !Number.isNaN(Number(char))).join('')
  const suffix = `${left[0]}${right}`
  return `${prefix}0-${suffix}`
}

const handleDoctoralProgrammeCode = programmeCode => {
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

const mapToProviders = programmeCodes => {
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

module.exports = {
  mapObject,
  mapToProviders,
}
