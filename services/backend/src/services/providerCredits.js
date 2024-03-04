const { mapToProviders } = require('../util/utils')
const { defineYear, getCorrectStartDate } = require('./studyprogramme/studyprogrammeHelpers')
const { allTransfers } = require('./studyprogramme')
const { getCreditsForProvider, getTransferredCredits } = require('./studyprogramme/creditGetters')
const { getStudyRights } = require('./studyprogramme/studyrightFinders')
const { getCreditStats, setCreditStats } = require('./analyticsService')
const { getCourseCodesOfProvider } = require('./providers')

/**
 * Rapo-kategoriat 9.2.2024, joiden perusteella tämä koodi on tehty. Numerot täsmäävät vain 2022 alkaen, koska sisu/oodi ero.
  
  'basic'
  Perustutkinto-opiskelijat: niiden opiskelijoiden opintopisteet, joilla on oikeus suorittaa alempi tai 
  ylempi korkeakoulututkinto.

  'incoming-exchange'
  Saapuvat vaihto-opiskelijat: opintosuoritukset, jotka ovat saapuvan kansainvälisen opiskelijan suorittamia. 
  Sisältää kaikki vaihto-opiskelijan opiskeluoikeuden aikana syntyneet opintopisteet.

  'agreement'
  Korkeakoulujen väliset yhteistyöopinnot: opintosuoritukset, jotka on tehty korkeakoulujen väliseen
  yhteistyösopimukseen perustuvalla opiskeluoikeudella.

  'open-uni'
  Avoimen opiskeluoikeus, ei tutkinto-opiskelija: opintosuoritukset, joiden suorituksen luokittelu on 
  "avoimena yliopisto-opintona suoritettu" ja opiskelija ei ole tutkinto-opiskelija tai kansainvälinen vaihto-opiskelija.

  'separate'
  Erillisoikeus: opintosuoritukset, joiden suorituksen luokittelu on "erillisellä opiskeluoikeudella" tai 
  "opettajankoulutuksen erillisellä opiskeluikeudella" suoritettu. Ei sisällä kansainvälisten vaihto-opiskelijoiden suorituksia.

  'transferred'
  Ulkomailta hyväksiluetut opintopisteet: ulkomailta hyväksilutetut opintopisteet.
  Muut hyväksiluetut opintopisteet: kotimaassa suoritetut, hyväksiluetut opintopisteet.

  Possible ambiguities / mistakes:
  Rapo may use createddate instead of attainment_date to determine if student had active studyright.
  This is probably very rare to cause differences, only one such was found in MH60_001

*/

const getCategory = (extent, degreeStudyright) => {
  if ([7, 34].includes(extent)) return 'incoming-exchange' // Saapuvat vaihto-opiskelijat
  if ([9, 31].includes(extent) && !degreeStudyright) return 'open-uni' // Avoimen opiskeluoikeus, ei tutkinto-opiskelija
  if ([14, 16].includes(extent)) return 'agreement' // Korkeakoulujen väliset yhteistyöopinnot
  if ([13, 18, 22, 23, 99].includes(extent)) return 'separate' // Erillisoikeus
  if ([1, 2].includes(extent) || (degreeStudyright && [1, 2].includes(degreeStudyright.extentcode))) return 'basic' // Rapo-kategoria: Perustutkinto-opiskelijat
  return 'other' // TODO: These still happen, but not a lot. Should be investigated which go here and where they should go instead
}

/*
  If credit didn't include studyright (pre-sisu times mostly), try to find out relevant
  other way. First check for same faculty as credit, but if not found, take first
  without (both have to be active when course was completed)
*/
const findRelevantStudyright = (attainmentDate, studyrights) => {
  return studyrights?.find(studyright => {
    const startDate = getCorrectStartDate(studyright)
    if (!studyright.graduated) return new Date(attainmentDate) >= new Date(startDate)
    return (
      new Date(studyright.startdate).getTime() <= new Date(attainmentDate).getTime() &&
      new Date(attainmentDate).getTime() <= new Date(studyright.enddate).getTime()
    )
  })
}

const getDegreeStudyright = (studyrights, date, semestercode) =>
  studyrights?.find(sr => {
    const rightExtentCode = [1, 2, 3, 4].includes(sr.extentcode)
    const rightDates =
      new Date(sr.startdate).getTime() <= new Date(date).getTime() &&
      new Date(date).getTime() <= new Date(sr.enddate).getTime()
    const enrolled = sr.semesterEnrollments?.some(e => e.semestercode === semestercode && e.enrollmenttype === 1)
    return rightExtentCode && rightDates && enrolled
  })

const getCreditsProduced = async (provider, isAcademicYear, specialIncluded = true) => {
  let data = await getCreditStats(provider, isAcademicYear, specialIncluded)
  if (data) return data
  data = await computeCreditsProduced(provider, isAcademicYear, specialIncluded)
  await setCreditStats(data, isAcademicYear, specialIncluded)
  return data
}

/* Calculates credits produced by provider (programme or faculty) */
const computeCreditsProduced = async (providerCode, isAcademicYear, specialIncluded = true) => {
  const since = new Date('2017-01-01')
  const rapoFormattedProviderCode = mapToProviders([providerCode])[0]
  const courses = await getCourseCodesOfProvider(rapoFormattedProviderCode)
  const credits = await getCreditsForProvider(rapoFormattedProviderCode, courses, since)

  // This part also adds oikis vaasa which is provided by different organization.
  // Uknown if there are other similar cases!
  const vaasaCodes = {
    '200-K001': '200-K0012',
    '200-M001': '200-M0012',
  }
  const vaasaProvider = vaasaCodes[rapoFormattedProviderCode]
  if (vaasaProvider) {
    const courses = await getCourseCodesOfProvider(vaasaProvider)
    const vaasaCredits = await getCreditsForProvider(vaasaProvider, courses, since)
    credits.push(...vaasaCredits)
  }

  const students = [...new Set(credits.map(({ studentNumber }) => studentNumber))]

  const transfers = (await allTransfers(providerCode, since)).map(t => t.studyrightid)

  let studyrights = await getStudyRights(students)
  if (!specialIncluded) {
    studyrights = studyrights.filter(s => !transfers.includes(s.studyrightid))
  }

  const studyrightIdToStudyrightMap = studyrights.reduce((obj, cur) => {
    obj[cur.actual_studyrightid] = cur
    return obj
  }, {})

  const studentNumberToStudyrightsMap = studyrights.reduce((obj, cur) => {
    if (!obj[cur.studentNumber]) obj[cur.studentNumber] = []
    obj[cur.studentNumber].push(cur)
    return obj
  }, {})

  const stats = {}

  credits.forEach(({ attainmentDate, studentNumber, credits, studyrightId, semestercode }) => {
    const relevantStudyright = studyrightId
      ? studyrightIdToStudyrightMap[studyrightId]
      : findRelevantStudyright(attainmentDate, studentNumberToStudyrightsMap[studentNumber])
    const attainmentYear = defineYear(attainmentDate, isAcademicYear)
    const degreeStudyright = getDegreeStudyright(
      studentNumberToStudyrightsMap[studentNumber],
      attainmentDate,
      semestercode
    )
    const category = relevantStudyright ? getCategory(relevantStudyright.extentcode, degreeStudyright) : 'other'
    if (!stats[attainmentYear]) stats[attainmentYear] = { transferred: 0 }
    stats[attainmentYear].total += credits
    if (!stats[attainmentYear][category]) {
      stats[attainmentYear][category] = 0
    }
    stats[attainmentYear][category] += credits
  })

  const transferredCredits = await getTransferredCredits(rapoFormattedProviderCode, since)
  if (vaasaProvider) {
    const vaasaTransferredCredits = await getTransferredCredits(vaasaProvider, since)
    transferredCredits.push(...vaasaTransferredCredits)
  }
  transferredCredits.forEach(({ attainmentDate, credits }) => {
    // Notice: Rapo uses "createdate"-column of credit to determine the year. This wasn't what we want for OK.
    const attainmentYear = defineYear(attainmentDate, isAcademicYear)
    if (!stats[attainmentYear]) stats[attainmentYear] = { transferred: 0 }
    stats[attainmentYear].transferred += credits || 0
    // Transferred not counted in total
  })

  return { stats, id: providerCode }
}

module.exports = {
  getCreditsProduced,
  computeCreditsProduced,
}
