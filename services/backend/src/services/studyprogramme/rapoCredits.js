const { mapToProviders } = require('../../util/utils')
const { defineYear, getCorrectStartDate } = require('./studyprogrammeHelpers')
const { getCourseCodesForStudyProgramme } = require('.')
const { getCreditsForStudyProgramme, getTransferredCredits } = require('./creditGetters')
const { getStudyRights } = require('./studyrightFinders')
/**
 * Rapo-kategoriat 9.2.2024, joiden perusteella tämä koodi on tehty. Numerot täsmäävät vain 2022 alkaen, koska sisu/oodi ero.
 * 
 * 'basic'
 * Perustutkinto-opiskelijat: niiden opiskelijoiden opintopisteet, joilla on oikeus suorittaa alempi tai 
 * ylempi korkeakoulututkinto.

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
  if ([1, 2, 3, 4].includes(extent) || hadDegreeStudyright) return 'basic-degree' // Rapo-kategoria: Perustutkinto-opiskelijat
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
const findRelevantStudyright = (attainmentDate, studyrights, facultyCode) => {
  const withinFaculty = studyrights.find(studyright => {
    if (studyright.facultyCode !== facultyCode) return false
    const startDate = getCorrectStartDate(studyright)
    if (!studyright.graduated) return new Date(attainmentDate) >= new Date(startDate)
    return new Date(attainmentDate) >= new Date(startDate) && new Date(attainmentDate) <= new Date(studyright.enddate)
  })
  if (withinFaculty) return withinFaculty
  return studyrights.find(studyright => {
    const startDate = getCorrectStartDate(studyright)
    if (!studyright.graduated) return new Date(attainmentDate) >= new Date(startDate)
    return new Date(attainmentDate) >= new Date(startDate) && new Date(attainmentDate) <= new Date(studyright.enddate)
  })
}

// At the given date, student had SOME degree-studyright.
const isDegreeStudent = (studyrights, date) =>
  studyrights?.find(
    sr =>
      [1, 2, 3, 4].includes(sr.extentcode) &&
      new Date(sr.startdate).getTime() <= new Date(date).getTime() &&
      new Date(date).getTime() <= new Date(sr.enddate).getTime()
  )

/* includes all specials, is calendar year, since 2017-01-01 */
const getCreditStatsForRapodiff = async programmeCode => {
  const since = new Date('2017-01-01')
  const providercode = mapToProviders([programmeCode])[0]
  const courses = await getCourseCodesForStudyProgramme(providercode)
  const facultyCode = programmeCode.slice(1, 4)
  const credits = await getCreditsForStudyProgramme(providercode, courses, since)

  const students = [...new Set(credits.map(({ studentNumber }) => studentNumber))]

  let studyrights = await getStudyRights(students)

  const studyrightIdToStudyrightMap = studyrights.reduce((obj, cur) => {
    obj[cur.actual_studyrightid] = cur
    return obj
  }, {})

  const studentNumberToStudyrightsMap = studyrights.reduce((obj, cur) => {
    if (!obj[cur.studentNumber]) obj[cur.studentNumber] = []
    obj[cur.studentNumber].push(cur)
    return obj
  }, {})
  const stats = { ids: {}, total: 0 }
  credits.forEach(({ acualId: id, attainmentDate, studentNumber, credits, studyrightId }) => {
    const relevantStudyright = studyrightId
      ? studyrightIdToStudyrightMap[studyrightId]
      : findRelevantStudyright(attainmentDate, studentNumberToStudyrightsMap[studentNumber], facultyCode)
    if (!relevantStudyright) return
    const attainmentYear = defineYear(attainmentDate, false)
    const hadDegreeStudyright = isDegreeStudent(studentNumberToStudyrightsMap[studentNumber], attainmentDate)
    const category = getCategory(relevantStudyright.extentcode, hadDegreeStudyright)
    if (category === 'open-uni' && credits > 0 && new Date(attainmentDate).getFullYear() === 2022) stats.ids[id] = true
    if (!stats[attainmentYear]) stats[attainmentYear] = { total: 0, transferred: 0 }
    stats[attainmentYear].total += credits
    if (!stats[attainmentYear][category]) {
      stats[attainmentYear][category] = 0
    }
    stats[attainmentYear][category] += credits
  })

  const transferredCredits = await getTransferredCredits(providercode, since)

  transferredCredits.forEach(({ attainment_date, credits }) => {
    const attainmentYear = defineYear(attainment_date, false)
    if (!stats[attainmentYear]) stats[attainmentYear] = { total: 0, transferred: 0 }
    stats[attainmentYear].transferred += credits || 0
    // Transferred not counted in total
  })

  return stats
}

module.exports = {
  getCreditStatsForRapodiff,
}
