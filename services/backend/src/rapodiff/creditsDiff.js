/* eslint-disable no-console */
const { getCreditStats } = require('../services/analyticsService')
const { parseCsv } = require('./helpers')

const diffs = []

const diff = (rapoData, okData, code, field) => {
  for (const year of Object.keys(okData)) {
    const rapo = rapoData[year]
    const ok = okData[year]
    if (!rapo) {
      if (!ok) console.log(`Year ${year} not in rapo for code ${code}, skipping`)
      continue
    }
    const diff = Math.abs(rapo[field] - ok[field])
    const bigger = Math.max(rapo[field], ok[field])
    if ((diff > bigger * 0.1 && bigger > 400) || diff > 100) {
      console.log(`${code} \t ${year}: ${field} diff: ${diff} \tOk: ${ok[field]} \tRapo: ${rapo[field]}`)
      diffs.push({ code, year, diff })
    }
  }
}

const parseOkData = data => {
  return data.tableStats.reduce((obj, cur) => {
    const [year, total, major, nonmajor, nondegree, transferred] = cur
    obj[year] = { total, basic: major, nonmajor, nondegree, transferred }
    return obj
  }, {})
}

// Acual logic in this function
const process = async (data, field = 'total') => {
  const rapoProgrammeData = formatData(data.slice(1))
  const allProgrammeCodes = [...new Set(Object.keys(rapoProgrammeData))]
  for (const programmeCode of allProgrammeCodes) {
    const okProgrammeData = await getCreditStats(programmeCode, '', 'CALENDAR_YEAR', 'SPECIAL_INCLUDED')
    diff(rapoProgrammeData[programmeCode], parseOkData(okProgrammeData), programmeCode, field)
  }
  console.log(`${diffs.length} diffs found.`)
}

const programmeCreditsDiff = async fileName => {
  console.log('Running studyprogramme credits diff')
  await parseCsv(fileName, process)
  console.log('Diff completed.')
}

// Change weird rapo programmecodes to oodikone format, example: 300-M003 => MH30_003
const transformProgrammeCode = oldCode => `${oldCode[4]}H${oldCode.slice(0, 2)}_${oldCode.slice(5, 8)}`

const formatData = data =>
  data.reduce((obj, cur) => {
    const parseNum = str => (str === '' ? 0 : parseInt(str, 10))
    const [year, facultyCode, programmeInfo, basic, exchange, otherUni, openUni, special, total, abroad, other] = cur
    const programmeCode = transformProgrammeCode(programmeInfo.split(' ')[0])
    if (!obj[programmeCode]) obj[programmeCode] = {}
    obj[programmeCode][year] = {
      year,
      facultyCode,
      programmeInfo,
      basic: parseNum(basic),
      exchange: parseNum(exchange),
      otherUni: parseNum(otherUni),
      openUni: parseNum(openUni),
      special: parseNum(special),
      total: parseNum(total),
      abroad: parseNum(abroad),
      other: parseNum(other),
    }
    return obj
  }, {})

module.exports = { programmeCreditsDiff }
