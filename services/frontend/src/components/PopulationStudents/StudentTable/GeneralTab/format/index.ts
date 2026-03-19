import { useMemo } from 'react'

import { creditDateFilter } from '@/components/FilterView/filters'
import { useFilters } from '@/components/FilterView/useFilters'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { DateFormat } from '@/constants/date'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useGetProgrammesQuery } from '@/redux/populations'
import { formatDate } from '@/util/timeAndDate'
import { DegreeProgrammeType } from '@oodikone/shared/types'
import type { FormattedStudent as Student } from '@oodikone/shared/types/studentData'
import type { FormattedStudentData } from '../index'

import { useGeneratePrimitiveFunctions, Variant } from '../primitives'
import { getProgrammeDetails, getSemesterEnrollmentsContent, useGetRelevantSemesterData } from './util'

const useGetCreditDateFilterOptions = () => {
  const { useFilterSelector } = useFilters()
  return useFilterSelector(creditDateFilter.selectors.selectOptions())
}

/**
 * filteredStudents - student array.
 * includePrimaryProgramme - should primary programme be included in programme list?
 *
 */
export const useFormat = ({
  variant,
  filteredStudents,

  years,

  programme,
  combinedProgramme,

  showBachelorAndMaster,
  includePrimaryProgramme,

  /* COURSE POPULATION specific */
  from,
  to,
  coursecodes,
  relatedProgrammeMap,
}: {
  variant: Variant
  filteredStudents: Student[]

  years: number[]

  programme: string | undefined
  combinedProgramme: string | undefined

  showBachelorAndMaster: boolean
  includePrimaryProgramme: boolean

  /* COURSE POPULATION specific */
  coursecodes: string[]
  from: string | undefined // Date string
  to: string | undefined // Date string
  relatedProgrammeMap?: Map<string, string> // Programme based on time of course attainment/enrollment etc.
}) => {
  const { getTextIn } = useLanguage()
  const { isAdmin } = useGetAuthorizedUserQuery()
  const creditDateFilterOptions = useGetCreditDateFilterOptions()

  // TODO: Use years correctly
  const { data: semesters, isSuccess: semestersSuccess } = useGetRelevantSemesterData(years.at(0))
  const { data, isSuccess: programmesSuccess } = useGetProgrammesQuery()
  const programmes = data?.filteredProgrammes ?? {}

  console.log("Integrated CI test ????")

  const { currentSemester, allSemesters, firstSemester, lastSemester } = semestersSuccess
    ? semesters
    : { currentSemester: null, allSemesters: {}, firstSemester: 0, lastSemester: 0 }

  const isMastersProgramme = programmesSuccess
    ? programmes[programme ?? '']?.degreeProgrammeType === DegreeProgrammeType.MASTER
    : false

  const getStudentProgrammeDetails = getProgrammeDetails({
    programme,
    isMastersProgramme,
    combinedProgramme,
    showBachelorAndMaster,

    currentSemester,
    year: null,
  })

  const {
    getCreditsBetween,
    getAttainmentsBeforeStudyRight,
    getCombinedCredits,
    getStudyRightStart,
    getProgrammeStart,
    getOption,
    getSemesterEnrollments,
    getGraduationDate,
    getStudyTimeMonths,
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
    getCourseInformation,
    getEnrollmentDate,
  } = useGeneratePrimitiveFunctions(variant, allSemesters)

  const getStudentSemesterEnrollmentContent = getSemesterEnrollmentsContent({
    getTextIn,

    programme: programme ?? '',
    isMastersProgramme,
    allSemesters,
    firstSemester,
    lastSemester,
  })

  const fromSemester = from
    ? (Object.values(allSemesters)
      .filter(({ startdate }) => new Date(startdate) <= new Date(from))
      .sort((a, b) => +new Date(b.startdate) - +new Date(a.startdate))
      .shift()?.semestercode ?? null)
    : null

  const toSemester = to
    ? (Object.values(allSemesters)
      .filter(({ enddate }) => new Date(to) <= new Date(enddate))
      .sort((a, b) => +new Date(a.enddate) - +new Date(b.enddate))
      .shift()?.semestercode ?? null)
    : null

  const formatStudent = (student: Student): FormattedStudentData => {
    const programmeDetails = getStudentProgrammeDetails(student)

    const studentBlob = {
      ...student,
      ...programmeDetails,
    }

    const attainmentsBeforeStudyRight = getAttainmentsBeforeStudyRight(studentBlob)
    const courseInformation = getCourseInformation(studentBlob, from, to, coursecodes)
    const enrollmentDate = getEnrollmentDate(studentBlob, fromSemester, toSemester, coursecodes)

    return {
      /* EXCEL ONLY */
      email: student.email,
      secondaryEmail: student.secondaryEmail,
      phoneNumber: student.phoneNumber,

      /* UTIL */
      sisuID: student.sis_person_id,

      /* NAME COLUMNS */
      firstNames: student.firstnames,
      lastName: student.lastname,

      /* BASE COLUMNS */
      studentNumber: student.obfuscated ? 'Hidden' : student.studentNumber,
      creditsTotal: student.credits,
      creditsHops: programmeDetails?.primaryStudyplan?.completed_credits ?? 0,

      creditsCombinedProg: !!combinedProgramme || showBachelorAndMaster ? getCombinedCredits(studentBlob) : null,
      creditsSince: getCreditsBetween(
        studentBlob,
        creditDateFilterOptions?.startDate,
        creditDateFilterOptions?.endDate
      ),
      creditsBeforeStarting: attainmentsBeforeStudyRight?.creditCount ?? 0,
      coursesBeforeStarting: attainmentsBeforeStudyRight?.courseCount ?? 0,

      studyRightStart: getStudyRightStart(studentBlob),
      programmeStart: getProgrammeStart(studentBlob),
      option: getOption(studentBlob),
      semesterEnrollments: getSemesterEnrollments(
        studentBlob,
        getStudentSemesterEnrollmentContent,
        firstSemester,
        lastSemester
      ),
      graduationDate: getGraduationDate(studentBlob),
      graduationDateCombinedProg:
        !!combinedProgramme || showBachelorAndMaster ? getCombinedGraduationDate(studentBlob) : null,
      studyTimeMonths: getStudyTimeMonths(studentBlob),
      startYearAtUniversity: getStartYearAtUniversity(studentBlob),
      associatedProgramme: relatedProgrammeMap?.get(student.studentNumber),
      primaryProgramme: getPrimaryProgramme(studentBlob),
      programmes: getProgrammes(studentBlob, includePrimaryProgramme),
      programmeStatus: getProgrammeStatus(studentBlob, currentSemester?.semestercode),
      transferredFrom: getTransferredFrom(studentBlob, programmes),
      admissionType: getAdmissionType(studentBlob),
      gender: getGender(studentBlob),
      citizenships: getCitizenships(studentBlob),
      curriculumPeriod: getCurriculumPeriod(studentBlob),
      mostRecentAttainment: getMostRecentAttainment(studentBlob),
      tags: getTags(studentBlob),
      studyTrack: getStudyTracks(studentBlob),
      grade: courseInformation?.grade ?? null,
      attainmentDate: courseInformation?.attainmentDate
        ? formatDate(courseInformation.attainmentDate, DateFormat.ISO_DATE)
        : 'No attainment',
      enrollmentDate: enrollmentDate ? formatDate(enrollmentDate, DateFormat.ISO_DATE) : 'No enrollment',
      language: courseInformation?.language ?? null,
      tvex: getTVEX(studentBlob),

      /* ADMIN COLUMNS */
      extent: isAdmin ? getExtent(studentBlob) : null,
      updatedAt: isAdmin ? getUpdatedAt(studentBlob) : null,
    }
  }

  return useMemo(() => filteredStudents.map(formatStudent), [programme, filteredStudents])
}
