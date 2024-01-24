/* eslint-disable no-console */
const { getCreditStats } = require('../services/analyticsService')
const { parseCsv } = require('./helpers')

const diff = (rapoData, okData, code) => {
  for (const year of Object.keys(okData)) {
    const rapo = rapoData[year]
    const ok = okData[year]
    const diff = Math.abs(rapo.total - ok.total)
    if (diff > 100) {
      console.log(`${code} - ${year}: Total diff: ${diff}\nOk: ${ok.total} Rapo: ${rapo.total}`)
    }
  }
}

const parseOkData = data => {
  return data.tableStats.reduce((obj, cur) => {
    const [year, major, nonmajor, nondegree, transferred] = cur
    obj[year] = { major, nonmajor, nondegree, transferred }
    return obj
  }, {})
}

// Acual logic in this function
const process = async data => {
  const rapoProgrammeData = formatData(data)
  const allProgrammeCodes = [...new Set(Object.keys(rapoProgrammeData))]
  for (const programmeCode of allProgrammeCodes) {
    const okProgrammeData = await getCreditStats(programmeCode, null, '')
    diff(rapoProgrammeData[programmeCode], parseOkData(okProgrammeData), programmeCode)
  }
}

const programmeCreditsDiff = async fileName => {
  console.log('Running studyprogramme credits diff')
  await parseCsv(fileName, process)
}

// Change weird rapo programmecodes to oodikone format, example: 300-M003 => MH30_003
const transformProgrammeCode = oldCode => `H${oldCode.slice(1, 3)}_${oldCode.slice(5, 8)}`

const formatData = data =>
  data.reduce((obj, cur) => {
    const [year, facultyCode, programmeInfo, basic, exchange, otherUni, openUni, special, total, abroad, other] = cur
    const programmeCode = transformProgrammeCode(programmeInfo.split(' ')[0])
    if (!obj[programmeCode]) obj[programmeCode] = []
    obj[programmeCode].push({
      year,
      facultyCode,
      programmeInfo,
      basic,
      exchange,
      otherUni,
      openUni,
      special,
      total,
      abroad,
      other,
    })
    return obj
  }, {})

module.exports = { programmeCreditsDiff }
