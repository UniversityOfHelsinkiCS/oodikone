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
  Ulkomailta hyväksiluetut opintopisteet: ulkomailta hyväksilutetut opintopisteet.

  'transferred'
  Muut hyväksiluetut opintopisteet: kotimaassa suoritetut, hyväksiluetut opintopisteet.
*/

const getCategory = (extent, hadDegreeStudyright) => {
  if ([1, 2, 3, 4].includes(extent) || hadDegreeStudyright) return 'basic' // Rapo-kategoria: Perustutkinto-opiskelijat
  if (extent === 7 || extent === 34) return 'incoming-exchange' // Saapuvat vaihto-opiskelijat
  if (extent === 9 && !hadDegreeStudyright) return 'open-uni' // Avoimen opiskeluoikeus, ei tutkinto-opiskelija
  if (extent === 14) return 'agreement' // Korkeakoulujen väliset yhteistyöopinnot
  if (extent === 99) return 'separate' // Erillisoikeus
  return 'other'
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

// At the given date, student had SOME degree-studyright.
const isDegreeStudent = (studyrights, date) =>
  studyrights?.some(sr => {
    const rightExtentCode = [1, 2, 3, 4].includes(sr.extentcode)
    const rightDates =
      new Date(sr.startdate).getTime() <= new Date(date).getTime() &&
      new Date(date).getTime() <= new Date(sr.enddate).getTime()
    // it is possible to also check if student had active semester enrollment to the studyright here.
    // However, it is unsure if rapo requires this (seems like maybe not). shouldn't make a huge difference.
    return rightExtentCode && rightDates
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
  const providercode = mapToProviders([providerCode])[0]
  const courses = await getCourseCodesOfProvider(providercode)
  const credits = await getCreditsForProvider(providercode, courses, since)
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

  credits.forEach(({ attainmentDate, studentNumber, credits, studyrightId }) => {
    const relevantStudyright = studyrightId
      ? studyrightIdToStudyrightMap[studyrightId]
      : findRelevantStudyright(attainmentDate, studentNumberToStudyrightsMap[studentNumber])
    const attainmentYear = defineYear(attainmentDate, isAcademicYear)
    const hadDegreeStudyright = isDegreeStudent(studentNumberToStudyrightsMap[studentNumber], attainmentDate)
    const category = relevantStudyright ? getCategory(relevantStudyright.extentcode, hadDegreeStudyright) : 'other'
    if (!stats[attainmentYear]) stats[attainmentYear] = { transferred: 0 }
    stats[attainmentYear].total += credits
    if (!stats[attainmentYear][category]) {
      stats[attainmentYear][category] = 0
    }
    stats[attainmentYear][category] += credits
  })

  const transferredCredits = await getTransferredCredits(providercode, since)

  transferredCredits.forEach(({ attainment_date, credits }) => {
    const attainmentYear = defineYear(attainment_date, isAcademicYear)
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
