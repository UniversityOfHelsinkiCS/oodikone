const { orderBy } = require('lodash')

// dbConnections must be imported to avoid Sequelize errors even if it's not used

// eslint-disable-next-line no-unused-vars
const { dbConnections } = require('../database/connection')
const { computeCreditsProduced } = require('../services/providerCredits')
const { parseCsv, printProgressBar } = require('./helpers')

const diffs = []
let noDiffCounter = 0

// Change weird rapo programmecodes to oodikone format, example: 300-M003 => MH30_003
const transformProgrammeCode = oldCode => `${oldCode[4]}H${oldCode.slice(0, 2)}_${oldCode.slice(5, 8)}`

const formatData = data =>
  data.reduce((obj, cur) => {
    const parseNum = str => (str === '' ? 0 : parseFloat(str.replace(',', '.')))
    const [
      year,
      facultyCode,
      programmeInfo,
      basic,
      exchange,
      otherUni,
      openUni,
      special,
      total,
      transferredFromAbroad,
      otherTransferred,
    ] = cur
    const programmeCode = transformProgrammeCode(programmeInfo.split(' ')[0])
    if (!obj[programmeCode]) obj[programmeCode] = {}
    obj[programmeCode][year] = {
      year: parseNum(year),
      facultyCode,
      programmeInfo,
      basic: parseNum(basic),
      'incoming-exchange': parseNum(exchange),
      agreement: parseNum(otherUni),
      'open-uni': parseNum(openUni),
      separate: parseNum(special),
      total: parseNum(total),
      transferred: parseNum(transferredFromAbroad) + parseNum(otherTransferred),
    }
    return obj
  }, {})

const diff = (rapoData, okData, code) => {
  for (const year of Object.keys(okData)) {
    if (year !== '2022' && year !== '2023') continue
    const rapo = rapoData[year]
    const ok = okData[year]
    if (!rapo) {
      if (!ok) console.log(`Year ${year} not in rapo for code ${code}, skipping`)
      continue
    }
    for (const field of ['basic', 'incoming-exchange', 'open-uni', 'agreement', 'separate', 'transferred']) {
      const okValue = Math.round(ok[field] || 0)
      const rapoValue = Math.round(rapo[field] || 0)
      const diff = Math.abs(okValue - rapoValue)
      if (diff === 0) {
        noDiffCounter++
        continue
      }
      const percentage = rapoValue !== 0 ? Number(((diff / rapoValue) * 100).toFixed(2)) : 100
      diffs.push({ field, year, code, okValue, rapoValue, diff, 'diff %': percentage })
    }
  }
}

const processProgrammes = async data => {
  let programmeCounter = 0
  const rapoProgrammeData = formatData(data.slice(1))
  const allProgrammeCodes = [...new Set(Object.keys(rapoProgrammeData))]
  for (const programmeCode of allProgrammeCodes) {
    const okProgrammeData = await computeCreditsProduced(programmeCode, false, true)
    diff(rapoProgrammeData[programmeCode], okProgrammeData.stats, programmeCode)
    printProgressBar(allProgrammeCodes.length, ++programmeCounter)
  }
  const fieldToSortBy = 'diff' // 'diff %'
  const orderedDiffs = orderBy(diffs, fieldToSortBy, 'asc')
  console.table(orderedDiffs)
  console.log(`${diffs.length} diffs found with current settings. Numbers with no diff: ${noDiffCounter}`)
  const totalDiff = orderedDiffs.reduce((sum, cur) => cur.diff + sum, 0)
  console.log('Total difference: ', totalDiff)
}

const programmeCreditsDiff = async fileName => {
  console.log('Running studyprogramme credits diff')
  await parseCsv(fileName, processProgrammes)
  console.log('Diff completed.')
}

/* 
separate
Suoritus on erillisellä opiskeluoikeudella opettajankoulutuksen opintoja suorittavan opiskelijan suorittama
Suoritus on erillisellä opiskeluoikeudella opiskelevan suorittama

agreement
Suoritus on korkeakoulujen välisillä yhteistyösopimuksilla opiskelevan suorittama


open-uni
Suoritus on avoimessa korkeakouluopetuksessa suoritettu

incoming-exchange
Suoritus on tulevan kansainvälisen vaihto-opiskelijan suorittama

basic
perustutkinto-opiskelija = 1
ja
Tuntematon
tai (ehkä):
Suoritus on kotimainen harjoittelujakso
?? Opintosuoritus on täydennyskoulutuksessa suoritettu ??

other
perustutkinto-opiskelija = 0 && tuntematon

*/

const getCategory = (typeName, isBasic, hyvaksiluettu) => {
  if (hyvaksiluettu) return 'transferred' // ?? unsure
  if (isBasic || ['Suoritus on kotimainen harjoittelujakso', 'Tuntematon'].includes(typeName)) return 'basic'
  if (typeName === 'Suoritus on avoimessa korkeakouluopetuksessa suoritettu') return 'open-uni'
  if (typeName === 'Suoritus on tulevan kansainvälisen vaihto-opiskelijan suorittama') return 'incoming-exchange'
  if (typeName.startsWith('Suoritus on erillisellä opiskeluoikeudella')) return 'separate'
  if (typeName === 'Suoritus on korkeakoulujen välisillä yhteistyösopimuksilla opiskelevan suorittama')
    return 'agreement'
  return 'other'
}

const processIds = async (rawData, code, field) => {
  const data = rawData.slice(0, 21628) // 11476 = KTM viimeinen
  const rapoData = data
    .map(row => ({
      id: row[0].slice(11),
      type: getCategory(row[1], row[3] === '1', row[6] === '1'),
      typeCode: row[8],
      isModule: row[9] !== '0',
      credits: parseFloat(row[10]),
      included: row[4] === '1',
    }))
    .filter(course => !course.isModule && (field === 'transferred' || course.included))
  const rapoIds = rapoData.filter(course => course.credits > 0 && course.type === field).map(row => row.id)
  const rapoCredits = rapoData.reduce(
    (stats, cur) => {
      stats[cur.type] += cur.credits
      return stats
    },
    {
      transferred: 0,
      total: '_',
      basic: 0,
      'open-uni': 0,
      separate: 0,
      'incoming-exchange': 0,
      agreement: 0,
      other: 0,
    }
  )
  const stats = await computeCreditsProduced(code, false, true, field)
  if (!stats.stats.ids) {
    console.log({ rapoCredits })
    console.log('Edit getCreditsProduced code so that it saves a list of the relevant ids you want to compare.')
    return
  }
  const okIdMap = stats.stats.ids
  const rapoIdMap = rapoIds.reduce((obj, cur) => {
    obj[cur] = true
    return obj
  }, {})
  const onlyInRapo = Object.keys(rapoIdMap).filter(id => !okIdMap[id])
  const onlyInOk = Object.keys(okIdMap).filter(id => !rapoIdMap[id])
  console.log('\n onlyInRapo: ', onlyInRapo.length)
  console.dir(onlyInRapo.slice(0, 30))
  console.log('\n onlyInOk: ', onlyInOk.length)
  console.dir(onlyInOk.slice(0, 30))
  delete stats.ids
  console.log(stats.stats['2022'])
  console.log('rapoCredits: ', rapoCredits)
}

const testNewCalc = async (fileName, code, field) => {
  await parseCsv(fileName, async data => processIds(data, code, field))
}

module.exports = { programmeCreditsDiff, testNewCalc }
