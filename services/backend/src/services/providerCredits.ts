import { InferAttributes } from 'sequelize'

import { SISStudyRight } from '../models'
import { mapToProviders } from '../shared/util'
import { EnrollmentType, ExtentCode } from '../types'
import { getCreditStats, setCreditStats } from './analyticsService'
import { getCourseCodesOfProvider } from './providers'
import { getCreditsForProvider, getTransferredCredits } from './studyProgramme/creditGetters'
import { defineYear } from './studyProgramme/studyProgrammeHelpers'
import { getSISStudyRightsOfStudents } from './studyProgramme/studyRightFinders'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const assertUnreachable = (x: never) => {
  throw new Error("Didn't expect to get here")
}

const basicDegreeExtentCodes = [ExtentCode.BACHELOR, ExtentCode.MASTER, ExtentCode.BACHELOR_AND_MASTER]

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

// TODO: How should licentiate and doctorate studies be categorized?
const getCategory = (extentCode?: ExtentCode, degreeStudyRightExtentCode?: ExtentCode) => {
  if (degreeStudyRightExtentCode && basicDegreeExtentCodes.includes(degreeStudyRightExtentCode)) {
    return 'basic'
  }
  switch (extentCode) {
    case ExtentCode.OPEN_UNIVERSITY_STUDIES:
    case ExtentCode.SUMMER_AND_WINTER_SCHOOL:
      return 'open-uni'
    case ExtentCode.MASTER:
    case ExtentCode.BACHELOR_AND_MASTER:
    case ExtentCode.BACHELOR:
      return 'basic'
    case ExtentCode.NON_DEGREE_STUDIES:
    case ExtentCode.NON_DEGREE_PEGAGOGICAL_STUDIES_FOR_TEACHERS:
    case ExtentCode.NON_DEGREE_PROGRAMME_FOR_SPECIAL_EDUCATION_TEACHERS:
      return 'separate'
    case ExtentCode.EXCHANGE_STUDIES:
    case ExtentCode.EXCHANGE_STUDIES_POSTGRADUATE:
      return 'incoming-exchange'
    case ExtentCode.CONTRACT_TRAINING:
      return 'agreement'
    case ExtentCode.DOCTOR:
    case ExtentCode.LICENTIATE:
    case ExtentCode.CONTINUING_EDUCATION:
    case ExtentCode.SPECIALIZATION_STUDIES:
    case ExtentCode.SPECIALIST_TRAINING_IN_MEDICINE_AND_DENTISTRY:
    case ExtentCode.STUDIES_FOR_SECONDARY_SCHOOL_STUDENTS:
    case undefined:
      return 'other'
    default:
      return assertUnreachable(extentCode)
  }
}

const getBasicDegreeStudyRight = (
  studyRights: Array<InferAttributes<SISStudyRight>> | undefined,
  date: Date,
  semestercode: number
) => {
  return studyRights?.find(studyRight => {
    const rightDates =
      new Date(studyRight.startDate).getTime() <= new Date(date).getTime() &&
      new Date(date).getTime() <= new Date(studyRight.endDate).getTime()
    const enrolledAsPresent =
      studyRight.semesterEnrollments != null &&
      studyRight.semesterEnrollments.some(
        enrollment => enrollment.semester === semestercode && enrollment.type === EnrollmentType.PRESENT
      )
    return basicDegreeExtentCodes.includes(studyRight.extentCode) && rightDates && enrolledAsPresent
  })
}

/* Calculates credits produced by provider (programme or faculty) */
export const computeCreditsProduced = async (providerCode: string, isAcademicYear: boolean) => {
  const since = new Date('2017-01-01')
  const rapoFormattedProviderCode = mapToProviders([providerCode])[0]
  const courses = await getCourseCodesOfProvider(rapoFormattedProviderCode)
  const credits = await getCreditsForProvider(rapoFormattedProviderCode, courses, since)

  // This part also adds oikis Vaasa which is provided by a different organization.
  // Unknown if there are other similar cases!
  const vaasaCodes = {
    '200-K001': '200-K0012',
    '200-M001': '200-M0012',
  } as const
  const vaasaProvider =
    rapoFormattedProviderCode in vaasaCodes ? vaasaCodes[rapoFormattedProviderCode as keyof typeof vaasaCodes] : null
  if (vaasaProvider) {
    const courses = await getCourseCodesOfProvider(vaasaProvider)
    const vaasaCredits = await getCreditsForProvider(vaasaProvider, courses, since)
    credits.push(...vaasaCredits)
  }

  const students = [...new Set(credits.map(({ studentNumber }) => studentNumber))]

  const studyRights = await getSISStudyRightsOfStudents(students)

  const studyRightIdToStudyRightMap = studyRights.reduce<Record<string, InferAttributes<SISStudyRight>>>((obj, cur) => {
    obj[cur.id] = cur
    return obj
  }, {})

  const studentNumberToStudyRightsMap = studyRights.reduce<Record<string, Array<InferAttributes<SISStudyRight>>>>(
    (obj, cur) => {
      if (!obj[cur.studentNumber]) {
        obj[cur.studentNumber] = []
      }
      obj[cur.studentNumber].push(cur)
      return obj
    },
    {}
  )

  const stats: Record<string, Record<string, number>> = {}

  for (const { attainmentDate, studentNumber, credits: numOfCredits, studyrightId, semestercode } of credits) {
    const studyRightLinkedToAttainment = studyRightIdToStudyRightMap[studyrightId]
    const attainmentYear = defineYear(attainmentDate, isAcademicYear)
    const degreeStudyRight = getBasicDegreeStudyRight(
      studentNumberToStudyRightsMap[studentNumber],
      attainmentDate,
      semestercode
    )

    if (!studyRightLinkedToAttainment && !degreeStudyRight) {
      continue
    }

    const category = getCategory(studyRightLinkedToAttainment?.extentCode, degreeStudyRight?.extentCode)
    stats[attainmentYear] ??= {}
    stats[attainmentYear][category] ??= 0
    stats[attainmentYear][category] += numOfCredits || 0
  }

  const transferredCredits = await getTransferredCredits(rapoFormattedProviderCode, since)
  if (vaasaProvider) {
    const vaasaTransferredCredits = await getTransferredCredits(vaasaProvider, since)
    transferredCredits.push(...vaasaTransferredCredits)
  }
  transferredCredits.forEach(({ createdate, credits }) => {
    const attainmentYear = defineYear(createdate, isAcademicYear)
    stats[attainmentYear] ??= {}
    stats[attainmentYear].transferred ??= 0
    stats[attainmentYear].transferred += credits || 0
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
  data = await computeCreditsProduced(providerCode, isAcademicYear)
  await setCreditStats(data, isAcademicYear, specialIncluded)
  return data
}
