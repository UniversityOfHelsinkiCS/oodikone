const mapToProviders = programmeCodes => {
  return programmeCodes.map(programmeCode => {
    const isNumber = str => !Number.isNaN(Number(str))
    if (programmeCode.includes('_')) {
      const [left, right] = programmeCode.split('_')
      const prefix = [...left].filter(isNumber).join('')
      const suffix = `${left[0]}${right}`
      const providerCode = `${prefix}0-${suffix}`
      return providerCode
    }
    if (/^(T)[0-9]{6}$/.test(programmeCode)) {
      const numbers = programmeCode.substring(1)
      const courseProvider = Number(`7${numbers}`)
      // Fix a bunch of doctoral degrees that got the wrong provider
      if (courseProvider < 7920111 && courseProvider > 7920102) {
        return `${courseProvider + 1}`
      }
      if (courseProvider === 7920111) {
        return '7920103'
      }
      return `${courseProvider}`
    }
    return programmeCode
  })
}

module.exports = { mapToProviders }
