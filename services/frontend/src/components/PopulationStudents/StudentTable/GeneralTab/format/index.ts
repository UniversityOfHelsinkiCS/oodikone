import { useMemo } from 'react'

import { getHighestGradeOfCourseBetweenRange } from '@/common'
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

import { useGeneratePrimitiveFunctions, StudentBlob, Variant } from '../primitives'
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
}) => {
  const { getTextIn } = useLanguage()
  const { isAdmin } = useGetAuthorizedUserQuery()

  // TODO: Use years correctly
  const { data: semesters, isSuccess: semestersSuccess } = useGetRelevantSemesterData(years.at(0))
  const { data: programmes, isSuccess: programmesSuccess } = useGetProgrammesQuery()

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
  } = useGeneratePrimitiveFunctions(variant)

  const getStudentSemesterEnrollmentContent = getSemesterEnrollmentsContent({
    getTextIn,

    programme: programme ?? '',
    isMastersProgramme,
    allSemesters,
    firstSemester,
    lastSemester,
  })

  const creditDateFilterOptions = useGetCreditDateFilterOptions()
  const creditsSinceDate = creditDateFilterOptions?.startDate ?? new Date(1970, 0, 1)
  const creditsUntilDate = creditDateFilterOptions?.endDate ?? new Date()

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

  const getCourseInformation =
    variant === 'coursePopulation'
      ? ({ courses }: StudentBlob) => {
          if (!from || !to) return { grade: '-', attainmentDate: '', language: '' }

          const validCourses = courses.filter(({ course_code }) => coursecodes.includes(course_code))
          const grade = getHighestGradeOfCourseBetweenRange(validCourses, from, to)
          if (!grade) return { grade: '-', attainmentDate: '', language: '' }

          const { date: attainmentDate, language } = validCourses
            .filter(course => course.grade === grade)
            .sort((a, b) => +new Date(b.date) - +new Date(a.date))
            .pop() ?? { attainmentDate: '', language: '' }

          return { grade, attainmentDate, language }
        }
      : (_: StudentBlob) => ({ grade: null, attainmentDate: null, language: null })

  const getEnrollmentDate =
    variant === 'coursePopulation'
      ? ({ enrollments }: StudentBlob) => {
          if (!fromSemester || !toSemester || !enrollments?.length) return null
          return (
            enrollments
              ?.filter(({ course_code }) => coursecodes.includes(course_code))
              ?.filter(({ semestercode }) => fromSemester <= semestercode && semestercode <= toSemester)
              ?.shift()?.enrollment_date_time ?? null
          )
        }
      : (_: StudentBlob) => null

  const formatStudent = (student: Student): FormattedStudentData => {
    const programmeDetails = getStudentProgrammeDetails(student)

    const studentBlob = {
      ...student,
      ...programmeDetails,
    }

    const { attainmentDate, grade, language } = getCourseInformation(studentBlob)
    const enrollmentDate = getEnrollmentDate(studentBlob)

    return {
      /* EXCEL ONLY */
      email: student.email,
      phoneNumber: student.phoneNumber,

      /* UTIL */
      sisuID: student.sis_person_id,

      /* NAME COLUMNS */
      firstNames: student.firstnames,
      lastName: student.lastname,

      /* BASE COLUMNS */
      studentNumber: student.obfuscated ? 'Hidden' : student.studentNumber,
      creditsTotal: student.credits,
      creditsHops: student.hopsCredits,

      creditsCombinedProg: !!combinedProgramme || showBachelorAndMaster ? getCombinedCredits(studentBlob) : null,
      creditsSince: getCreditsBetween(studentBlob, creditsSinceDate, creditsUntilDate),
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
      startYearAtUniversity: getStartYearAtUniversity(studentBlob),
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
      grade,
      attainmentDate: attainmentDate ? formatDate(attainmentDate, DateFormat.ISO_DATE) : 'No attainment',
      enrollmentDate: enrollmentDate ? formatDate(enrollmentDate, DateFormat.ISO_DATE) : 'No enrollment',
      language,
      tvex: getTVEX(studentBlob),

      /* ADMIN COLUMNS */
      extent: isAdmin ? getExtent(studentBlob) : null,
      updatedAt: isAdmin ? getUpdatedAt(studentBlob) : null,
    }
  }

  return useMemo(() => filteredStudents.map(formatStudent), [programme, filteredStudents])
}
