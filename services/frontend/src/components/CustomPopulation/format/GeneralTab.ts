import { findStudyRightForClass, getAllProgrammesOfStudent, getStudentTotalCredits } from '@/common'
import { creditDateFilter } from '@/components/FilterView/filters'
import { useFilters } from '@/components/FilterView/useFilters'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { useStudentNameVisibility } from '@/components/material/StudentNameVisibilityToggle'
import { FormattedStudentData } from '@/components/PopulationStudents/StudentTable/GeneralTab'
import { DateFormat } from '@/constants/date'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useGetSemestersQuery } from '@/redux/semesters'
import { formatDate } from '@/util/timeAndDate'
import { GenderCodeToText } from '@oodikone/shared/types/genderCode'
import { useMemo } from 'react'

export const useColumns = (): [string[], string[]] => {
  const { visible: namesVisible } = useStudentNameVisibility()

  const nameColumns = namesVisible ? [
    'lastName',
    'firstNames',
  ] : []

  return [[
    ...nameColumns,
    'studentNumber',
    'programmes',
    'creditsTotal',

    'primaryProgramme',
    'admissionType',
    'startYearAtUniversity',
    'creditsHops',
    'creditsSince',
    'graduationDate',
    'studyRightStart',
    'programmeStart',
    'programmeStatus',
    'studyTrack',
    'gender',
    'citizenships',
    'mostRecentAttainment',
    'extent',

    'tvex',
    'tags',
    'updatedAt',
  ], [
    'email',
    'phoneNumber',
  ]]
}

export const format = ({
  programme,
  filteredStudents,
}) => {
  const { useFilterSelector } = useFilters()
  const creditDateFilterOptions = useFilterSelector(creditDateFilter.selectors.selectOptions())

  const { isAdmin } = useGetAuthorizedUserQuery()
  const { getTextIn } = useLanguage()

  const { data: semesters, isFetching: semestersFetching, isSuccess: semestersSuccess} = useGetSemestersQuery()

  if (semestersFetching) return null
  if (!semestersSuccess) return null

  const currentSemester = semesters?.currentSemester

  const queryStudyrights = [programme].filter(studyright => !!studyright) as string[]

  const containsStudyTracks: boolean = filteredStudents.some(({ studyRights }) => {
    studyRights?.some(({ studyRightElements }) =>
      studyRightElements.some(element => queryStudyrights.includes(element.code))
    )
  })

  const formatStudent = (student: any): Partial<FormattedStudentData> => {
    const studentProgrammes = getAllProgrammesOfStudent(student.studyRights ?? [], currentSemester.semestercode)

    const primaryProgramme = studentProgrammes.find(({ code }) => code === programme) ?? studentProgrammes[0]

    const relevantStudyRight = findStudyRightForClass(student.studyRights, primaryProgramme?.code, /* year */ null)
    const relevantStudyRightElement = relevantStudyRight?.studyRightElements.find(({ code }) => code === primaryProgramme?.code)

    const relevantStudyplan = student.studyplans?.find(({ programme_code }) => programme_code === primaryProgramme?.code)

    /* ***** */ /* ***** */ /* ***** */
    /* ***** */ /* ***** */ /* ***** */
    /* ***** */ /* ***** */ /* ***** */

    const getCreditsBetween = student => {
      const sinceDate = creditDateFilterOptions.startDate ?? new Date(1970, 0, 1)
      const untilDate = creditDateFilterOptions.endDate ?? new Date()

      if (!sinceDate && !untilDate) return getStudentTotalCredits({
        courses: student.courses
          .filter((course) => new Date(relevantStudyRightElement?.startDate ?? 0).getTime() <= new Date(course.date).getTime())
      })

      return getStudentTotalCredits({ courses: student.courses.filter((course) => sinceDate <= new Date(course.date) && new Date(course.date) <= untilDate) })
    }

    const getStudyTracks = studyRights => {
      const correctStudyRight = studyRights?.find(studyRight =>
        queryStudyrights.some(code => studyRight.studyRightElements.some(element => element.code === code))
      )

      if (!correctStudyRight) return []
      return queryStudyrights
        .map(code => correctStudyRight.studyRightElements.find(element => element.code === code))
        .filter(element => element?.studyTrack)
        .map(element => getTextIn(element.studyTrack.name))
    }

    const graduationDate = relevantStudyRightElement?.graduated
        ? formatDate(relevantStudyRightElement.endDate, DateFormat.ISO_DATE)
        : null

    const getStudyRightStatus = () => {
      if (!primaryProgramme) return null
      if (primaryProgramme.graduated) return 'Graduated'
      if (primaryProgramme.cancelled) return 'Cancelled'
      if (primaryProgramme.active) return 'Active'
      return 'Inactive'
    }      

    const getAdmissiontype = () => {
      const admissionType = relevantStudyRight?.admissionType ?? 'Ei valintatapaa'
      return admissionType !== 'Koepisteet' ? admissionType : 'Valintakoe'
    }

    const getMostRecentAttainment = student => {
      if (!relevantStudyplan) return null

      const dates = student.courses
        .filter(({ course_code, passed }) => relevantStudyplan.included_courses.includes(course_code) && passed)
        .map(({ date }) => +new Date(date))
      if (!dates.length) return null

      const latestDate = Math.max(...dates)
      return formatDate(new Date(latestDate), DateFormat.ISO_DATE)
    }

    const getExtent = student =>
      student.studyRights
        .filter(
          studyRight =>
            studyRight.studyRightElements.filter(element => queryStudyrights.includes(element.code)).length >=
            queryStudyrights.length
        )
        .map(studyRight => studyRight.extentCode)
        .join(', ')

    return {
      firstNames: student.firstnames,
      lastName: student.lastname,
      studentNumber: student.obfuscated ? 'Hidden' : student.studentNumber,
      email: student.email,
      phoneNumber: student.phoneNumber,
      creditsTotal: student.credits,
      creditsHops: student.hopsCredits,
      creditsSince: getCreditsBetween(student),
      admissionType: getAdmissiontype(),
      startYearAtUniversity: student.started
        ? new Date(student.started).getFullYear()
        : null,
      graduationDate,
      studyRightStart: formatDate(relevantStudyRight?.startDate, DateFormat.ISO_DATE),
      programmeStart: formatDate(relevantStudyRightElement?.startDate, DateFormat.ISO_DATE),
      programmeStatus: getStudyRightStatus(),
      studyTrack: containsStudyTracks ? getStudyTracks(student.studyRights).join(', ') : null,
      gender: GenderCodeToText[student.gender_code],
      citizenships: student.citizenships?.map(getTextIn).sort().join(', ') ?? null,
      mostRecentAttainment: getMostRecentAttainment(student),

      tvex: !!relevantStudyRight?.tvex,
      tags: student.tags?.map(({ tag }) => tag.tagname).join(', ') ?? null,

      primaryProgramme: !programme
        ? getTextIn(primaryProgramme?.name) ?? undefined
        : undefined,

      extent: isAdmin
        ? getExtent(student)
        : null,
      updatedAt: isAdmin
        ? formatDate(student.updatedAt, DateFormat.ISO_DATE_DEV)
        : null,
    }
  }

  return useMemo(() => filteredStudents.map(formatStudent), [programme, filteredStudents])
}
