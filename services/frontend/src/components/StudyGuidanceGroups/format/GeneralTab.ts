import { useMemo } from 'react'

import { DegreeProgrammeType, EnrollmentType, type FormattedStudent as Student } from '@oodikone/shared/types'
import { GenderCodeToText } from '@oodikone/shared/types/genderCode'

import { getStudentTotalCredits } from '@/common'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { useStudentNameVisibility } from '@/components/material/StudentNameVisibilityToggle'
import {
  getCreditDateFilterOptions,
  getProgrammeDetails,
  getRelevantSemesterData,
  getSemesterEnrollmentsContent,
} from '@/components/PopulationStudents/format/GeneralTab'
import type { FormattedStudentData } from '@/components/PopulationStudents/StudentTable/GeneralTab'
import { joinProgrammes } from '@/components/PopulationStudents/StudentTable/GeneralTab/util'
import { DateFormat } from '@/constants/date'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useGetProgrammesQuery } from '@/redux/populations'
import { formatDate } from '@/util/timeAndDate'

export const useColumns = ({ group }): [string[], string[]] => {
  const { isAdmin } = useGetAuthorizedUserQuery()
  const { visible: namesVisible } = useStudentNameVisibility()

  const [programme, combinedProgramme] = group?.tags?.studyProgramme?.split('+') ?? []
  const year = group?.tags?.year

  const nameColumns = namesVisible ? ['lastName', 'firstNames'] : []

  const groupWithProgrammeColumns = programme
    ? [
        'citizenships',
        'programmeStatus',
        'creditsHops',
        'curriculumPeriod',
        'graduationDate',
        'gender',
        'mostRecentAttainment',
        'semesterEnrollments',
      ]
    : []

  const groupWithCombinedProgrammeColumns =
    !!programme && !!combinedProgramme ? ['graduationDateCombinedProg', 'creditsCombinedProg'] : []

  const groupWithYearColumns =
    !!programme && !!year ? ['admissionType', 'studyRightStart', 'programmeStart', 'studyTrack', 'transferredFrom'] : []

  const adminColumns = isAdmin ? ['extent', 'updatedAt'] : []

  const excelOnlyColumns = ['email', 'phoneNumber']

  return [
    [
      ...nameColumns,
      'studentNumber',
      'programmes',
      'creditsTotal',
      'creditsSince',
      'startYearAtUniversity',
      'tvex',
      'tags',
      ...groupWithProgrammeColumns,
      ...groupWithCombinedProgrammeColumns,
      ...groupWithYearColumns,
      ...adminColumns,
    ],
    excelOnlyColumns,
  ]
}

export const useFormat = ({
  group,

  filteredStudents,
  includePrimaryProgramme = true,
}) => {
  const [programme, combinedProgramme] = group?.tags?.studyProgramme?.split('+') ?? []
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
    showBachelorAndMaster: false,

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
      creditsSince: getCreditsBetween(),
      startYearAtUniversity: student.started ? new Date(student.started).getFullYear() : null,
      programmes: { programmes: programmesList, exportValue: joinProgrammes(programmesList, getTextIn, '; ') },
      tvex: !!relevantStudyRight?.tvex,
      tags: getTags(),

      /* STUDY GROUP POPULATION WITH PROGRAMME */
      citizenships: getCitizenships(),
      programmeStatus: getStudyRightStatus(),
      creditsHops: student.hopsCredits,
      curriculumPeriod: student.curriculumVersion,
      graduationDate: getGraduationDate(),
      gender: GenderCodeToText[student.gender_code],
      mostRecentAttainment: getMostRecentAttainment(),
      semesterEnrollments: {
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
      },

      /* STUDY GROUP POPULATION WITH COMBINED PROGRAMME */
      creditsCombinedProg: combinedProgramme ? (secondaryStudyplan?.completed_credits ?? 0) : null,
      graduationDateCombinedProg:
        combinedProgramme && relevantSecondaryStudyRightElement?.graduated
          ? formatDate(relevantSecondaryStudyRightElement.endDate, DateFormat.ISO_DATE)
          : null,

      /* STUDY GROUP POPULATION WITH YEAR */
      admissionType: getAdmissiontype(),
      studyRightStart: formatDate(relevantStudyRight?.startDate, DateFormat.ISO_DATE),
      programmeStart: formatDate(relevantStudyRightElement?.startDate, DateFormat.ISO_DATE),
      studyTrack: getStudyTracks(),
      transferredFrom: getTextIn(programmes[student.transferSource!]?.name) ?? student.transferSource ?? '',

      /* ADMIN COLUMNS */
      extent: getExtent(),
      updatedAt: getUpdatedAt(),
    }
  }

  return useMemo(() => filteredStudents.map(formatStudent), [programme, filteredStudents])
}
