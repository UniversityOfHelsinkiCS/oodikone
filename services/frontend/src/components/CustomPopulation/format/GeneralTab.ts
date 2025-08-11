import { useMemo } from 'react'

import { getStudentTotalCredits, getStudyRightStatusText } from '@/common'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { useStudentNameVisibility } from '@/components/material/StudentNameVisibilityToggle'
import {
  useGetCreditDateFilterOptions,
  getProgrammeDetails,
  useGetRelevantSemesterData,
  getSemesterEnrollmentsContent,
} from '@/components/PopulationStudents/format/GeneralTab'
import type { FormattedStudentData } from '@/components/PopulationStudents/StudentTable/GeneralTab'
import { joinProgrammes } from '@/components/PopulationStudents/StudentTable/GeneralTab/util'
import { DateFormat } from '@/constants/date'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useGetProgrammesQuery } from '@/redux/populations'
import { formatDate } from '@/util/timeAndDate'
import { DegreeProgrammeType, EnrollmentType, type FormattedStudent as Student } from '@oodikone/shared/types'
import { GenderCodeToText } from '@oodikone/shared/types/genderCode'

export const useColumns = ({ programme }): [string[], string[]] => {
  const { isAdmin } = useGetAuthorizedUserQuery()
  const { visible: namesVisible } = useStudentNameVisibility()

  const nameColumns = namesVisible ? ['lastName', 'firstNames'] : []

  const populationWithProgrammeColumns = programme
    ? ['option', 'transferredFrom', 'semesterEnrollments', 'curriculumPeriod']
    : ['primaryProgramme']

  const adminColumns = isAdmin ? ['extent', 'updatedAt'] : []

  const excelOnlyColumns = ['email', 'phoneNumber']

  return [
    [
      'studentNumber',
      'programmes',
      'creditsTotal',
      'creditsHops',
      'creditsSince',
      'admissionType',
      'startYearAtUniversity',
      'graduationDate',
      'studyRightStart',
      'programmeStart',
      'programmeStatus',
      'studyTrack',
      'gender',
      'citizenships',
      'mostRecentAttainment',
      'tvex',
      'tags',
      ...nameColumns,
      ...populationWithProgrammeColumns,
      ...adminColumns,
    ],
    excelOnlyColumns,
  ]
}

export const useFormat = ({
  programme,
  filteredStudents,

  includePrimaryProgramme = false,
}) => {
  const { getTextIn } = useLanguage()

  const { isAdmin } = useGetAuthorizedUserQuery()
  const creditDateFilterOptions = useGetCreditDateFilterOptions()

  const { data: programmes, isSuccess: programmesSuccess } = useGetProgrammesQuery()
  const { data: semesters, isSuccess: semestersSuccess } = useGetRelevantSemesterData(undefined)

  const { currentSemester, allSemesters, firstSemester, lastSemester } = semestersSuccess
    ? semesters
    : { currentSemester: null, allSemesters: [], firstSemester: 0, lastSemester: 0 }

  const isMastersProgramme = programmesSuccess
    ? programmes[programme]?.degreeProgrammeType === DegreeProgrammeType.MASTER
    : false

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
    combinedProgramme: undefined,
    showBachelorAndMaster: false,

    currentSemester,
    year: null,
  })

  const formatStudent = (student: Student): Partial<FormattedStudentData> => {
    const {
      allProgrammes,
      primaryProgramme,
      primaryStudyplan,

      relevantStudyRight,
      relevantStudyRightElement,
      relevantSecondaryStudyRightElement,
    } = studentProgrammeDetails(student)

    const otherProgrammes = allProgrammes.filter(({ code }) => code !== primaryProgramme.code)

    const getCreditsBetween = () => {
      const sinceDate = creditDateFilterOptions.startDate ?? new Date(1970, 0, 1)
      const untilDate = creditDateFilterOptions.endDate ?? new Date()

      if (!sinceDate && !untilDate)
        return getStudentTotalCredits({
          courses: student.courses.filter(
            course => new Date(relevantStudyRightElement?.startDate ?? 0).getTime() <= new Date(course.date).getTime()
          ),
        })

      return getStudentTotalCredits({
        courses: student.courses.filter(
          course => sinceDate <= new Date(course.date) && new Date(course.date) <= untilDate
        ),
      })
    }

    const getStudyTracks = () =>
      [relevantStudyRightElement, relevantSecondaryStudyRightElement]
        .filter(element => !!element?.studyTrack)
        .map(element => getTextIn(element?.studyTrack?.name))
        .join(', ') ?? null

    const getGraduationDate = () =>
      relevantStudyRightElement?.graduated ? formatDate(relevantStudyRightElement.endDate, DateFormat.ISO_DATE) : null

    // This is so that "Study programmes" column is complete in views that have no associated "primary" programme.
    const programmesList = includePrimaryProgramme ? allProgrammes : otherProgrammes

    const getAdmissiontype = () => {
      const admissionType = relevantStudyRight?.admissionType

      if (admissionType === 'Koepisteet') return 'Valintakoe'
      return admissionType ?? 'Ei valintatapaa'
    }

    const getCitizenships = () =>
      student.citizenships
        ?.map(citizenship => getTextIn(citizenship))
        .sort()
        .join(', ') ?? null

    const getMostRecentAttainment = () => {
      if (!primaryStudyplan) return null

      const courses = student.courses.filter(
        ({ course_code, passed }) => primaryStudyplan.included_courses.includes(course_code) && passed
      )

      if (!courses.length) return null

      const latestDate = courses
        .map(({ date }) => new Date(date))
        .sort((a, b) => Number(a) - Number(b))
        .pop()!

      return formatDate(latestDate, DateFormat.ISO_DATE)
    }

    const getTags = () => student.tags?.map(({ tag }) => tag.tagname).join(', ') ?? null

    const getExtent = () => (isAdmin ? (relevantStudyRight?.extentCode.toString() ?? null) : null)

    const getUpdatedAt = () => (isAdmin ? formatDate(student.updatedAt, DateFormat.ISO_DATE_DEV) : null)

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
      creditsSince: getCreditsBetween(),
      studyTrack: getStudyTracks(),
      studyRightStart: formatDate(relevantStudyRight?.startDate, DateFormat.ISO_DATE),
      programmeStart: formatDate(relevantStudyRightElement?.startDate, DateFormat.ISO_DATE),
      graduationDate: getGraduationDate(),
      startYearAtUniversity: student.started ? new Date(student.started).getFullYear() : null,
      programmes: { programmes: programmesList, exportValue: joinProgrammes(programmesList, getTextIn, '; ') },
      programmeStatus: getStudyRightStatusText(primaryProgramme, relevantStudyRight, currentSemester?.semestercode),
      admissionType: getAdmissiontype(),
      gender: GenderCodeToText[student.gender_code],
      citizenships: getCitizenships(),
      mostRecentAttainment: getMostRecentAttainment(),
      tvex: !!relevantStudyRight?.tvex,
      tags: getTags(),

      /* CUSTOM POPULATION WITHOUT PROGRAMME */
      primaryProgramme: !programme ? (getTextIn(primaryProgramme?.name) ?? null) : null,
      /* CUSTOM POPULATION WITH PROGRAMME */
      option: programme ? (getTextIn(student.option?.name) ?? null) : null,
      transferredFrom: programme
        ? (getTextIn(programmes?.[student.transferSource!]?.name) ?? student.transferSource ?? null)
        : null,
      semesterEnrollments: programme
        ? {
            content: studentSemesterEnrollmentContent(
              {
                studentNumber: student.studentNumber,
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
          }
        : null,
      curriculumPeriod: programme ? student.curriculumVersion : null,

      /* ADMIN COLUMNS */
      extent: getExtent(),
      updatedAt: getUpdatedAt(),
    }
  }

  return useMemo(() => filteredStudents.map(formatStudent), [programme, filteredStudents, formatStudent])
}
