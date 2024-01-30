/* eslint-disable no-console */
const { getCreditStats } = require('../services/analyticsService')
const { parseCsv } = require('./helpers')
const _ = require('lodash')

const diffs = []
let noDiffCounter = 0

const diff = (rapoData, okData, code, rapoField, okField) => {
  for (const year of Object.keys(okData)) {
    const rapo = rapoData[year]
    const ok = okData[year]
    if (!rapo) {
      if (!ok) console.log(`Year ${year} not in rapo for code ${code}, skipping`)
      continue
    }
    if (ok[okField] === undefined || rapo[rapoField] === undefined) throw new Error('Invalid fields')
    const okValue = Math.round(ok[okField])
    const rapoValue = Math.round(rapo[rapoField])
    const diff = Math.abs(okValue - rapoValue)
    const bigger = Math.max(rapo[rapoField], ok[okField])
    if ((diff > bigger * 0.1 && bigger > 500) || diff > 400) {
      /*const diffStr = `${code} - ${year} - Ok.${okField}: ${okValue
        .toString()
        .padStart(8)} \tRapo.${rapoField}: ${rapoValue.toString().padStart(8)}\tDiff: ${diff}`*/
      const diffStr = `${code}\t${year}\t${rapoValue}\t${okValue}\t${diff}`
      diffs.push({ code, year, diff, diffStr })
    } else {
      noDiffCounter += 1
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
const process = async data => {
  // Define here the fields to diff against each other
  const rapoField = 'openUni'
  const okField = 'nondegree'
  const rapoProgrammeData = formatData(data.slice(1))
  const allProgrammeCodes = [...new Set(Object.keys(rapoProgrammeData))]
  for (const programmeCode of allProgrammeCodes) {
    const okProgrammeData = await getCreditStats(programmeCode, '', 'CALENDAR_YEAR', 'SPECIAL_INCLUDED')
    diff(rapoProgrammeData[programmeCode], parseOkData(okProgrammeData), programmeCode, rapoField, okField)
  }
  const orderedDiffs = _.orderBy(diffs, 'diff', 'asc')
  orderedDiffs.forEach(d => console.log(d.diffStr))
  console.log(`${diffs.length} diffs found with current settings. Numbers with no diff: ${noDiffCounter}`)
  const totalDiff = orderedDiffs.reduce((sum, cur) => cur.diff + sum, 0)
  console.log('Total difference: ', totalDiff)
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
