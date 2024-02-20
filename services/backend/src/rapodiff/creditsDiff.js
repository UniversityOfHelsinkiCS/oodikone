/* eslint-disable no-console */
const { getCreditStatsForRapodiff } = require('../services/providerCredits')
const { parseCsv } = require('./helpers')
const _ = require('lodash')

const diffs = []
let noDiffCounter = 0

const diff = (rapoData, okData, code) => {
  for (const year of Object.keys(okData)) {
    if (year !== '2022' && year !== '2023') continue
    const rapo = rapoData[year]
    const ok = okData[year]
    if (!rapo) {
      if (!ok) console.log(`Year ${year} not in rapo for code ${code}, skipping`)
      continue
    }
    for (const field of ['basic', 'incoming-exchange', 'open-uni', 'agreement', 'separate', 'other']) {
      const okValue = Math.round(ok[field] || 0)
      const rapoValue = Math.round(rapo[field] || 0)
      const diff = Math.abs(okValue - rapoValue)
      const diffStr = `${field.padEnd(10, ' ')} ${year} ${code.padEnd(
        10,
        ' '
      )} Difference: ${diff} Rapo: ${rapoValue} Oodikone: ${okValue}`
      diffs.push({ field, diff, okValue, rapoValue, code, year, diffStr })
    }
  }
}
let counter = 0
// Acual logic in this function
const process = async data => {
  // Define here the fields to diff against each other. Must be an array, multiple fields will be summed
  const rapoProgrammeData = formatData(data.slice(1))
  const allProgrammeCodes = [...new Set(Object.keys(rapoProgrammeData))]
  for (const programmeCode of allProgrammeCodes) {
    const okProgrammeData = await getCreditStatsForRapodiff(programmeCode, '', 'CALENDAR_YEAR', 'SPECIAL_INCLUDED')
    counter++
    if (counter % 5 === 0) {
      console.log(`Done ${Math.round((counter / allProgrammeCodes.length) * 100)} %`)
    }
    diff(rapoProgrammeData[programmeCode], okProgrammeData, programmeCode)
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

const processIds = async (rawData, code) => {
  const data = rawData.slice(1)
  console.log('amount of rapo credits: ', data.length)
  const rapoData = data
    .map(row => ({
      id: row[4],
      credits: row[5],
      type: row[6],
      incl: row[7],
    }))
    .filter(row => row.type === '2' && row.incl === '0')
  const rapoIds = rapoData.map(row => row.id)
  const stats = await getCreditStatsForRapodiff(code)
  if (!stats.ids) {
    console.log(stats)
    console.log('Edit getCreditStats code so that it saves a list of the relevant ids you want to compare.')
    return
  }
  const okIds = stats.ids
  const notInOk = rapoIds.filter(id => id && !okIds[id.slice(11)]).map(str => str.slice(11))
  const rapoIdMap = rapoIds.reduce((obj, cur) => {
    obj[cur] = true
    return obj
  }, {})
  const notInRapo = Object.keys(okIds).filter(id => !rapoIdMap[`ATTAINMENT-${id}`])
  console.log('\n In rapo, but not in OK: ', notInOk.length)
  console.dir(notInOk)
  console.log('\n In OK, but not in Rapo: ', notInRapo.length)
  console.dir(notInRapo)
  delete stats.ids
  console.log(stats['2022'])
  const rapoCredits = rapoData.reduce((sum, cur) => parseInt(sum, 10) + parseInt(cur.credits, 10), 0)
  console.log('rapoCredits: ', rapoCredits)
}

const testNewCalc = async code => {
  await parseCsv('credits.csv', async data => processIds(data, code))
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
      'incoming-exchange': parseNum(exchange),
      agreement: parseNum(otherUni),
      'open-uni': parseNum(openUni),
      separate: parseNum(special),
      total: parseNum(total),
      abroad: parseNum(abroad),
      other: parseNum(other),
    }
    return obj
  }, {})

module.exports = { programmeCreditsDiff, testNewCalc }
