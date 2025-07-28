import { useMemo } from 'react'

import { DegreeProgrammeType, EnrollmentType, type FormattedStudent as Student } from '@oodikone/shared/types'
import { GenderCodeToText } from '@oodikone/shared/types/genderCode'

import { getStudentTotalCredits } from '@/common'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { useStudentNameVisibility } from '@/components/material/StudentNameVisibilityToggle'
import { getCreditDateFilterOptions, getProgrammeDetails, getRelevantSemesterData, getSemesterEnrollmentsContent } from '@/components/PopulationStudents/format/GeneralTab'
import type { FormattedStudentData } from '@/components/PopulationStudents/StudentTable/GeneralTab'
import { joinProgrammes } from '@/components/PopulationStudents/StudentTable/GeneralTab/util'
import { DateFormat } from '@/constants/date'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useGetProgrammesQuery } from '@/redux/populations'
import { formatDate } from '@/util/timeAndDate'

export const useColumns = ({
  showCombinedProgrammeColumns
}): [string[], string[]] => {
  const { isAdmin } = useGetAuthorizedUserQuery()
  const { visible: namesVisible } = useStudentNameVisibility()

  const nameColumns = namesVisible ? [
    'lastName',
    'firstNames',
  ] : []

  const combinedProgrammeColumns = showCombinedProgrammeColumns ? [
    'graduationDateCombinedProg',
    'creditsCombinedProg'
  ] : []

  const adminColumns = isAdmin ? [
    'extent',
    'updatedAt',
  ] : []

  const excelOnlyColumns = ['email', 'phoneNumber']

  return [[
    'studentNumber',
    'creditsTotal',
    'creditsHops',
    'creditsSince',
    'studyTrack',
    'studyRightStart',
    'programmeStart',
    'option',
    'semesterEnrollments',
    'graduationDate',
    'startYearAtUniversity',
    'programmes',
    'programmeStatus',
    'transferredFrom',
    'admissionType',
    'gender',
    'citizenships',
    'curriculumPeriod',
    'mostRecentAttainment',
    'tvex',
    'tags',
    'extent',
    'updatedAt',
    ...nameColumns,
    ...combinedProgrammeColumns,
    ...adminColumns,
  ], excelOnlyColumns]
}

export const format = ({
  programme,
  combinedProgramme,
  showBachelorAndMaster,

  filteredStudents,

  includePrimaryProgramme = false
}) => {
  const { getTextIn } = useLanguage()

  const { isAdmin } = useGetAuthorizedUserQuery()
  const creditDateFilterOptions = getCreditDateFilterOptions()

  const { data: programmes, isSuccess: programmesSuccess } = useGetProgrammesQuery()
  const { data: semesters, isSuccess: semestersSuccess } = getRelevantSemesterData(undefined)

  if (!semestersSuccess) return []
  const { currentSemester, allSemesters, firstSemester, lastSemester } = semesters

  if (!programmesSuccess) return []
  const isMastersProgramme = programmes[programme]?.degreeProgrammeType === DegreeProgrammeType.MASTER

  const studentSemesterEnrollmentContent = getSemesterEnrollmentsContent({
    getTextIn,

    programme,
    isMastersProgramme,
    allSemesters,
    firstSemester,
    lastSemester,
  })

  const studentProgrammeDetails = getProgrammeDetails({
    programme,
    isMastersProgramme,
    combinedProgramme,
    showBachelorAndMaster,
    
    currentSemester,
    year: null,
  })

  const formatStudent = (student: Student): Partial<FormattedStudentData> => {
    const {
      allProgrammes,
      primaryProgramme,
      primaryStudyplan,
      secondaryStudyplan,

      relevantStudyRight,
      relevantStudyRightElement,
      relevantSecondaryStudyRightElement,
    } = studentProgrammeDetails(student)

    const otherProgrammes = allProgrammes.filter(({ code }) => code !== primaryProgramme.code)

    const getCreditsBetween = () => {
      const sinceDate = creditDateFilterOptions.startDate ?? new Date(1970, 0, 1)
      const untilDate = creditDateFilterOptions.endDate ?? new Date()

      if (!sinceDate && !untilDate) return getStudentTotalCredits({
        courses: student.courses
          .filter((course) => new Date(relevantStudyRightElement?.startDate ?? 0).getTime() <= new Date(course.date).getTime())
      })

      return getStudentTotalCredits({ courses: student.courses.filter((course) => sinceDate <= new Date(course.date) && new Date(course.date) <= untilDate) })
    }

    const getStudyTracks = () => [relevantStudyRightElement, relevantSecondaryStudyRightElement]
      .filter(element => !!element?.studyTrack)
      .map(element => getTextIn(element?.studyTrack?.name))
      .join(', ') ?? null

    const getGraduationDate = () => relevantStudyRightElement?.graduated
        ? formatDate(relevantStudyRightElement.endDate, DateFormat.ISO_DATE)
        : null

    // This is so that "Study programmes" column is complete in views that have no associated "primary" programme.      
    const programmesList = includePrimaryProgramme ? allProgrammes : otherProgrammes

    const getStudyRightStatus = () => {
      if (!primaryProgramme) return null
      if (primaryProgramme.graduated) return 'Graduated'
      if (primaryProgramme.cancelled) return 'Cancelled'
      if (primaryProgramme.active) return 'Active'
      return 'Inactive'
    }      

    const getAdmissiontype = () => {
      const admissionType = relevantStudyRight?.admissionType

      if (admissionType === 'Koepisteet') return 'Valintakoe'
      return admissionType ?? 'Ei valintatapaa'
    }

    const getCitizenships = () => student.citizenships?.map(citizenship => getTextIn(citizenship)).sort().join(', ') ?? null

    const getMostRecentAttainment = () => {
      if (!primaryStudyplan) return null

      const courses = student.courses
        .filter(({ course_code, passed }) => primaryStudyplan.included_courses.includes(course_code) && passed)

      if (!courses.length) return null

      const latestDate = courses
        .map(({ date }) => new Date(date))
        .sort((a, b) => Number(a) - Number(b))
        .pop()!

      return formatDate(latestDate, DateFormat.ISO_DATE)
    }

    const getTags = () => student.tags?.map(({ tag }) => tag.tagname).join(', ') ?? null

    const getExtent = () => isAdmin
      ? relevantStudyRight?.extentCode.toString() ?? null
      : null

    const getUpdatedAt = () => isAdmin
      ? formatDate(student.updatedAt, DateFormat.ISO_DATE_DEV)
      : null

    return {
      firstNames: student.firstnames,
      lastName: student.lastname,
      studentNumber: student.obfuscated ? 'Hidden' : student.studentNumber,
      email: student.email,
      phoneNumber: student.phoneNumber,
      sisuID: student.sis_person_id,
      creditsTotal: student.credits,
      creditsHops: student.hopsCredits,
      creditsSince: getCreditsBetween(),
      studyTrack: getStudyTracks(),
      studyRightStart: formatDate(relevantStudyRight?.startDate, DateFormat.ISO_DATE),
      programmeStart: formatDate(relevantStudyRightElement?.startDate, DateFormat.ISO_DATE),
      option: getTextIn(student.option?.name) ?? null,
      semesterEnrollments: {
        content: studentSemesterEnrollmentContent(
          {
            studentNumber: student.studentNumber,
            studyrightEnd: relevantStudyRightElement?.graduated
              ? relevantStudyRightElement.endDate
              : null,
            secondStudyrightEnd: relevantSecondaryStudyRightElement?.graduated
              ? relevantSecondaryStudyRightElement.endDate
              : null,
          },
          relevantStudyRight
        ),
        exportValue: (relevantStudyRight?.semesterEnrollments ?? []).reduce(
          (acc, { type, semester }) => acc + Number(type === EnrollmentType.PRESENT && firstSemester <= semester && semester <= lastSemester), 0
        ),
      },
      graduationDate: getGraduationDate(),
      startYearAtUniversity: student.started
        ? new Date(student.started).getFullYear()
        : null,
      programmes: { programmes: programmesList, exportValue: joinProgrammes(programmesList, getTextIn, '; ') },
      programmeStatus: getStudyRightStatus(),
      transferredFrom: getTextIn(programmes[student.transferSource!]?.name) ?? student.transferSource ?? '',
      admissionType: getAdmissiontype(),
      gender: GenderCodeToText[student.gender_code],
      citizenships: getCitizenships(),
      curriculumPeriod: student.curriculumVersion,
      mostRecentAttainment: getMostRecentAttainment(),
      tvex: !!relevantStudyRight?.tvex,
      tags: getTags(),
      creditsCombinedProg: combinedProgramme || showBachelorAndMaster
        ? secondaryStudyplan?.completed_credits ?? 0
        : null,
      graduationDateCombinedProg: (combinedProgramme || showBachelorAndMaster) && relevantSecondaryStudyRightElement?.graduated
        ? formatDate(relevantSecondaryStudyRightElement.endDate, DateFormat.ISO_DATE)
        : null,
      extent: getExtent(),
      updatedAt: getUpdatedAt(),
    }
  }

  return useMemo(() => filteredStudents.map(formatStudent), [programme, filteredStudents])
}
