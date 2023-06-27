const mapToProviders = elementDetails => {
  return elementDetails.map(r => {
    const isNumber = str => !Number.isNaN(Number(str))
    if (r.includes('_')) {
      const [left, right] = r.split('_')
      const prefix = [...left].filter(isNumber).join('')
      const suffix = `${left[0]}${right}`
      const providercode = `${prefix}0-${suffix}`
      return providercode
    }
    if (/^(T)[0-9]{6}$/.test(r)) {
      const numbers = r.substring(1)
      return `7${numbers}`
    }
    return r
  })
}

// sort substitutions so that main code is first
const newLetterBasedCode = /^[A-Za-z]/ // new letter based codes come first
const oldNumericCode = /^\d/ // old numeric codes come second
const openUniCode = /^AY?(.+?)(?:en|fi|sv)?$/ // open university codes come last
const openUniCodeA = /A\d/ // open university with just A come last
const digi = /DIGI-A?(.+?)(?:en|fi|sv)?$/ // digi-a goes on top courses goes third
const bscsCode = /BSCS??/

const codeRegexes = [openUniCodeA, openUniCode, bscsCode, oldNumericCode, newLetterBasedCode, digi]

const getSortRank = code => {
  for (let i = 0; i < codeRegexes.length; i++) {
    if (codeRegexes[i].test(code)) {
      return i
    }
  }
  return 3 // if no hit, put before open uni courses
}

const sortMainCode = codeArray => {
  if (!codeArray) return []
  return codeArray.sort(function (x, y) {
    return getSortRank(y) - getSortRank(x)
  })
}

const getDeltaTimeSeconds = (start, end) => Math.round(((end - start) / 1000) * 100) / 100

const loggerData = []

// this customLogger can be used to debug slow routes to see which part takes too long.
const customLogger = {
  start: name => {
    loggerData[name] = [{ msg: 'Started', time: new Date().getTime() }]
  },
  log: (name, msg) => {
    if (!loggerData[name]) return
    loggerData[name].push({ msg, time: new Date().getTime() })
  },
  end: (name, print) => {
    if (!loggerData[name]) return
    if (!print) {
      loggerData[name] = []
      return
    }
    loggerData[name].push({ msg: 'Ended', time: new Date().getTime() })
    loggerData[name].forEach((item, index, arr) =>
      // eslint-disable-next-line no-console
      console.log(
        `customLog: ${name} - ${index === 0 ? 0 : getDeltaTimeSeconds(arr[index - 1].time, item.time)} s - ${item.msg}`
      )
    )
    const arr = loggerData[name]
    // eslint-disable-next-line no-console
    console.log(`customLog: ${name} Total time ${getDeltaTimeSeconds(arr[0].time, arr[arr.length - 1].time)} s`)
    loggerData[name] = []
  },
}

module.exports = {
  mapToProviders,
  sortMainCode,
  getSortRank,
  customLogger,
}
