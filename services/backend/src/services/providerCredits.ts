import { EnrollmentType, ExtentCode } from '../types'
import { mapToProviders } from '../util/map'
import { getCreditStats, setCreditStats } from './analyticsService'
import { getCourseCodesOfProvider } from './providers'
import { allTransfers } from './studyProgramme'
import { getCreditsForProvider, getTransferredCredits } from './studyProgramme/creditGetters'
import { defineYear, getCorrectStartDate } from './studyProgramme/studyProgrammeHelpers'
import { getStudyRights } from './studyProgramme/studyRightFinders'

/**
  Rapo-kategoriat 9.2.2024, joiden perusteella tämä koodi on tehty. Numerot täsmäävät vain 2022 alkaen, koska Sisu/Oodi ero.
  
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

const getCategory = (extentCode: number, degreeStudyright: any): string => {
  if ([ExtentCode.EXCHANGE_STUDIES, ExtentCode.EXCHANGE_STUDIES_POSTGRADUATE].includes(extentCode)) {
    return 'incoming-exchange'
  }
  if ([ExtentCode.OPEN_UNIVERSITY_STUDIES, ExtentCode.SUMMER_AND_WINTER_SCHOOL].includes(extentCode)) {
    return 'open-uni'
  }
  if ([ExtentCode.CONTRACT_TRAINING, ExtentCode.STUDIES_FOR_SECONDARY_SCHOOL_STUDENTS].includes(extentCode)) {
    return 'agreement'
  }
  if (
    [
      ExtentCode.NON_DEGREE_PEGAGOGICAL_STUDIES_FOR_TEACHERS,
      ExtentCode.SPECIALIZATION_STUDIES,
      ExtentCode.NON_DEGREE_PROGRAMME_FOR_SPECIAL_EDUCATION_TEACHERS,
      ExtentCode.SPECIALIST_TRAINING_IN_MEDICINE_AND_DENTISTRY,
      ExtentCode.NON_DEGREE_STUDIES,
    ].includes(extentCode)
  ) {
    return 'separate'
  }
  if (
    [ExtentCode.BACHELOR, ExtentCode.MASTER].includes(extentCode) ||
    (degreeStudyright && [ExtentCode.BACHELOR, ExtentCode.MASTER].includes(degreeStudyright.extentcode))
  ) {
    return 'basic'
  }
  return 'other'
}

/*
  If credit didn't include studyright (pre-sisu times mostly), try to find out relevant
  other way. First check for same faculty as credit, but if not found, take first
  without (both have to be active when course was completed)
*/
const findRelevantStudyRight = (attainmentDate: Date, studyRights) => {
  return studyRights?.find(studyRight => {
    const startDate = getCorrectStartDate(studyRight)
    if (!studyRight.graduated) return new Date(attainmentDate) >= new Date(startDate)
    return (
      new Date(studyRight.startdate).getTime() <= new Date(attainmentDate).getTime() &&
      new Date(attainmentDate).getTime() <= new Date(studyRight.enddate).getTime()
    )
  })
}

const getDegreeStudyRight = (studyRights, date: Date, semesterCode: number) => {
  return studyRights?.find(studyright => {
    const rightExtentCodes = [ExtentCode.BACHELOR, ExtentCode.MASTER, ExtentCode.LICENTIATE, ExtentCode.DOCTOR]
    const rightDates =
      new Date(studyright.startdate).getTime() <= new Date(date).getTime() &&
      new Date(date).getTime() <= new Date(studyright.enddate).getTime()
    const enrolled = studyright.semesterEnrollments?.some(
      enrollment => enrollment.semestercode === semesterCode && enrollment.enrollmenttype === EnrollmentType.PRESENT
    )
    return rightExtentCodes.includes(studyright.extentcode) && rightDates && enrolled
  })
}

/* Calculates credits produced by provider (programme or faculty) */
export const computeCreditsProduced = async (
  providerCode: string,
  isAcademicYear: boolean,
  specialIncluded: boolean = true
) => {
  const since = new Date('2017-01-01')
  const rapoFormattedProviderCode = mapToProviders([providerCode])[0]
  const courses = await getCourseCodesOfProvider(rapoFormattedProviderCode)
  const credits = await getCreditsForProvider(rapoFormattedProviderCode, courses, since)

  // This part also adds oikis Vaasa which is provided by a different organization.
  // Unknown if there are other similar cases!
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
  const transfers = (await allTransfers(providerCode, since)).map(transfer => transfer.studyrightid)

  let studyRights = await getStudyRights(students)
  if (!specialIncluded) {
    studyRights = studyRights.filter(studyRight => !transfers.includes(studyRight.studyrightid))
  }

  const studyRightIdToStudyRightMap = studyRights.reduce((obj, cur) => {
    obj[cur.actual_studyrightid] = cur
    return obj
  }, {})

  const studentNumberToStudyRightsMap = studyRights.reduce((obj, cur) => {
    if (!obj[cur.studentNumber]) {
      obj[cur.studentNumber] = []
    }
    obj[cur.studentNumber].push(cur)
    return obj
  }, {})

  const stats = {}

  credits.forEach(({ attainmentDate, studentNumber, credits, studyrightId, semestercode }) => {
    const relevantStudyright = studyrightId
      ? studyRightIdToStudyRightMap[studyrightId]
      : findRelevantStudyRight(attainmentDate, studentNumberToStudyRightsMap[studentNumber])
    const attainmentYear = defineYear(attainmentDate, isAcademicYear)
    const degreeStudyRight = getDegreeStudyRight(
      studentNumberToStudyRightsMap[studentNumber],
      attainmentDate,
      semestercode
    )
    const category = relevantStudyright ? getCategory(relevantStudyright.extentcode, degreeStudyRight) : 'other'
    if (!stats[attainmentYear]) {
      stats[attainmentYear] = { transferred: 0 }
    }
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
  transferredCredits.forEach(({ createdate, credits }) => {
    const attainmentYear = defineYear(createdate, isAcademicYear)
    if (!stats[attainmentYear]) {
      stats[attainmentYear] = { transferred: 0 }
    }
    stats[attainmentYear].transferred += credits || 0
    // Transferred not counted in total
  })

  return { stats, id: providerCode }
}

export const getCreditsProduced = async (
  providerCode: string,
  isAcademicYear: boolean,
  specialIncluded: boolean = true
) => {
  let data = await getCreditStats(providerCode, isAcademicYear, specialIncluded)
  if (data) {
    return data
  }
  data = await computeCreditsProduced(providerCode, isAcademicYear, specialIncluded)
  await setCreditStats(data, isAcademicYear, specialIncluded)
  return data
}
