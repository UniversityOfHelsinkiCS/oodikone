import { getAllProgrammesOfStudent, getStudentTotalCredits, getStudyRightStatusText } from '@/common'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { DateFormat } from '@/constants/date'
import { DegreeProgramme } from '@/types/api/faculty'
import { formatDate } from '@/util/timeAndDate'

import { EnrollmentType } from '@oodikone/shared/types'
import type { FormattedStudent as Student, Unarray } from '@oodikone/shared/types'
import { GenderCodeToText } from '@oodikone/shared/types/genderCode'
import type { StudentStudyPlan, StudentStudyRight, StudentStudyRightElement } from '@oodikone/shared/types/studentData'
import { joinProgrammes } from './util'

export type Variant = 'population' | 'coursePopulation' | 'customPopulation' | 'studyGuidanceGroupPopulation'

export type StudentBlob = Student & {
  allProgrammes: ReturnType<typeof getAllProgrammesOfStudent>
  primaryProgramme: Unarray<ReturnType<typeof getAllProgrammesOfStudent>> | undefined
  primaryStudyplan: StudentStudyPlan | undefined
  secondaryStudyplan: StudentStudyPlan | undefined

  relevantStudyRight: StudentStudyRight | undefined
  relevantStudyRightElement: StudentStudyRightElement | undefined
  relevantSecondaryStudyRightElement: StudentStudyRightElement | undefined
}

const nullFunction = (_: StudentBlob) => null

export const useGeneratePrimitiveFunctions = (variant: Variant) => {
  const { getTextIn } = useLanguage()

  const variantIsOneOf = (...options: Variant[]): boolean => options.includes(variant)

  const getCreditsBetween = variantIsOneOf('population', 'customPopulation', 'studyGuidanceGroupPopulation')
    ? ({ relevantStudyRightElement, courses }: StudentBlob, startDate: Date | undefined, endDate: Date | undefined) => {
        const sinceDate = startDate ?? new Date(relevantStudyRightElement?.startDate ?? 0)
        const untilDate = endDate ?? new Date()

        return getStudentTotalCredits({
          courses: courses.filter(course => {
            const courseDate = new Date(course.date)
            return sinceDate <= courseDate && courseDate <= untilDate
          }),
        })
      }
    : nullFunction

  const getCombinedCredits = variantIsOneOf('population', 'studyGuidanceGroupPopulation')
    ? ({ secondaryStudyplan }: StudentBlob) => secondaryStudyplan?.completed_credits ?? 0
    : nullFunction

  const getStudyTracks = variantIsOneOf('population', 'customPopulation', 'studyGuidanceGroupPopulation')
    ? ({ relevantStudyRightElement, relevantSecondaryStudyRightElement }: StudentBlob) => {
        return (
          [relevantStudyRightElement, relevantSecondaryStudyRightElement]
            .filter(element => !!element?.studyTrack)
            .map(element => getTextIn(element?.studyTrack?.name))
            .join(', ') || null
        )
      }
    : nullFunction

  const getSemesterEnrollments = variantIsOneOf('population', 'customPopulation', 'studyGuidanceGroupPopulation')
    ? (
        {
          studentNumber,
          relevantStudyRight,
          relevantStudyRightElement,
          relevantSecondaryStudyRightElement,
        }: StudentBlob,
        getStudentSemesterEnrollmentContent: (
          student: { studentNumber: string; studyrightEnd: Date | null; secondStudyrightEnd: Date | null },
          studyright: StudentStudyRight | undefined
        ) => { key: string; onHoverString: string; typeLabel: string; graduationCrown: string }[],
        firstSemester: number,
        lastSemester: number
      ) => ({
        content: getStudentSemesterEnrollmentContent(
          {
            studentNumber,
            studyrightEnd: relevantStudyRightElement?.graduated ? relevantStudyRightElement.endDate : null,
            secondStudyrightEnd: relevantSecondaryStudyRightElement?.graduated
              ? relevantSecondaryStudyRightElement.endDate
              : null,
          },
          relevantStudyRight
        ),
        exportValue: (relevantStudyRight?.semesterEnrollments ?? []).reduce(
          (acc, { type, semester }) =>
            acc + Number(type === EnrollmentType.PRESENT && firstSemester <= semester && semester <= lastSemester),
          0
        ),
      })
    : nullFunction

  const getGraduationDate = variantIsOneOf('population', 'customPopulation', 'studyGuidanceGroupPopulation')
    ? ({ relevantStudyRightElement }: StudentBlob) =>
        relevantStudyRightElement?.graduated ? formatDate(relevantStudyRightElement.endDate, DateFormat.ISO_DATE) : null
    : nullFunction

  const getCombinedGraduationDate = variantIsOneOf('population', 'studyGuidanceGroupPopulation')
    ? ({ relevantSecondaryStudyRightElement }: StudentBlob) =>
        relevantSecondaryStudyRightElement?.graduated
          ? formatDate(relevantSecondaryStudyRightElement.endDate, DateFormat.ISO_DATE)
          : null
    : nullFunction

  const getTransferredFrom = variantIsOneOf('population', 'customPopulation', 'studyGuidanceGroupPopulation')
    ? ({ transferSource }: StudentBlob, programmes: Record<string, DegreeProgramme> | undefined) =>
        getTextIn(programmes?.[transferSource!]?.name) ?? transferSource ?? null
    : nullFunction

  const getStudyRightStart = variantIsOneOf('population', 'customPopulation', 'studyGuidanceGroupPopulation')
    ? ({ relevantStudyRight }: StudentBlob) => formatDate(relevantStudyRight?.startDate, DateFormat.ISO_DATE)
    : nullFunction

  const getProgrammeStart = variantIsOneOf('population', 'customPopulation', 'studyGuidanceGroupPopulation')
    ? ({ relevantStudyRightElement }: StudentBlob) =>
        formatDate(relevantStudyRightElement?.startDate, DateFormat.ISO_DATE)
    : nullFunction

  const getOption = variantIsOneOf('population', 'customPopulation')
    ? ({ option }: StudentBlob) => getTextIn(option) ?? null
    : nullFunction

  const getStartYearAtUniversity = variantIsOneOf(
    'population',
    'coursePopulation',
    'customPopulation',
    'studyGuidanceGroupPopulation'
  )
    ? ({ started }: StudentBlob) => (started ? new Date(started).getFullYear() : null)
    : nullFunction

  const getPrimaryProgramme = variantIsOneOf('customPopulation')
    ? ({ primaryProgramme }: StudentBlob) => getTextIn(primaryProgramme?.name) ?? null
    : nullFunction

  const getProgrammes = variantIsOneOf(
    'population',
    'coursePopulation',
    'customPopulation',
    'studyGuidanceGroupPopulation'
  )
    ? ({ allProgrammes, primaryProgramme }: StudentBlob, includePrimaryProgramme: boolean) => {
        const programmesList = includePrimaryProgramme
          ? allProgrammes
          : allProgrammes.filter(({ code }) => code !== primaryProgramme?.code)

        return {
          programmes: programmesList,
          exportValue: joinProgrammes(programmesList, getTextIn, '; '),
        }
      }
    : nullFunction

  const getProgrammeStatus = variantIsOneOf(
    'population',
    'coursePopulation',
    'customPopulation',
    'studyGuidanceGroupPopulation'
  )
    ? ({ primaryProgramme, relevantStudyRight }: StudentBlob, currentSemesterCode: number | undefined) =>
        getStudyRightStatusText(primaryProgramme, relevantStudyRight, currentSemesterCode)
    : nullFunction

  const getAdmissionType = variantIsOneOf('population', 'customPopulation', 'studyGuidanceGroupPopulation')
    ? ({ relevantStudyRight }: StudentBlob) => {
        const admissionType = relevantStudyRight?.admissionType

        if (admissionType === 'Koepisteet') return 'Valintakoe'
        return admissionType ?? 'Ei valintatapaa'
      }
    : nullFunction

  const getGender = variantIsOneOf('population', 'customPopulation', 'studyGuidanceGroupPopulation')
    ? ({ gender_code }: StudentBlob) => GenderCodeToText[gender_code]
    : nullFunction

  const getCitizenships = variantIsOneOf('population', 'customPopulation', 'studyGuidanceGroupPopulation')
    ? ({ citizenships }: StudentBlob) =>
        citizenships
          ?.map(citizenship => getTextIn(citizenship))
          .sort()
          .join(', ') ?? null
    : nullFunction

  const getCurriculumPeriod = variantIsOneOf('population', 'customPopulation', 'studyGuidanceGroupPopulation')
    ? ({ curriculumVersion }: StudentBlob) => curriculumVersion
    : nullFunction

  const getMostRecentAttainment = variantIsOneOf('population', 'customPopulation', 'studyGuidanceGroupPopulation')
    ? ({ courses: originalCourses, primaryStudyplan }: StudentBlob) => {
        if (!primaryStudyplan) return null

        const courses = originalCourses.filter(
          ({ course_code, passed }) => primaryStudyplan.included_courses.includes(course_code) && passed
        )

        if (!courses.length) return null

        const latestDate = courses
          .map(({ date }) => new Date(date))
          .sort((a, b) => Number(a) - Number(b))
          .pop()

        return formatDate(latestDate, DateFormat.ISO_DATE)
      }
    : nullFunction

  const getTags = variantIsOneOf('population', 'coursePopulation', 'customPopulation', 'studyGuidanceGroupPopulation')
    ? ({ tags }: StudentBlob) => tags?.map(({ tag }) => tag.tagname).join(', ') ?? null
    : nullFunction

  const getTVEX = variantIsOneOf('population', 'coursePopulation', 'customPopulation', 'studyGuidanceGroupPopulation')
    ? ({ relevantStudyRight }: StudentBlob) => !!relevantStudyRight?.tvex
    : nullFunction

  const getExtent = variantIsOneOf('population', 'coursePopulation', 'customPopulation', 'studyGuidanceGroupPopulation')
    ? ({ relevantStudyRight }: StudentBlob) => relevantStudyRight?.extentCode.toString() ?? null
    : nullFunction

  const getUpdatedAt = variantIsOneOf(
    'population',
    'coursePopulation',
    'customPopulation',
    'studyGuidanceGroupPopulation'
  )
    ? ({ updatedAt }: StudentBlob) => formatDate(updatedAt, DateFormat.ISO_DATE_DEV)
    : nullFunction

  return {
    getCreditsBetween,
    getCombinedCredits,
    getStudyRightStart,
    getProgrammeStart,
    getOption,
    getSemesterEnrollments,
    getGraduationDate,
    getCombinedGraduationDate,
    getStartYearAtUniversity,
    getPrimaryProgramme,
    getProgrammes,
    getProgrammeStatus,
    getTransferredFrom,
    getAdmissionType,
    getGender,
    getCitizenships,
    getCurriculumPeriod,
    getStudyTracks,
    getMostRecentAttainment,
    getTags,
    getTVEX,
    getExtent,
    getUpdatedAt,
  }
}
