import { findStudyRightForClass, getAllProgrammesOfStudent, getStudentTotalCredits } from '@/common'
import { creditDateFilter } from '@/components/FilterView/filters'
import { useFilters } from '@/components/FilterView/useFilters'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { useStudentNameVisibility } from '@/components/material/StudentNameVisibilityToggle'
import { FormattedStudentData } from '@/components/PopulationStudents/StudentTable/GeneralTab'
import { createMaps } from '@/components/PopulationStudents/StudentTable/GeneralTab/columnHelpers/createMaps'
import { getSemestersPresentFunctions } from '@/components/PopulationStudents/StudentTable/GeneralTab/columnHelpers/semestersPresent'
import { joinProgrammes } from '@/components/PopulationStudents/StudentTable/GeneralTab/util'
import { DateFormat } from '@/constants/date'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useGetProgrammesQuery } from '@/redux/populations'
import { useGetSemestersQuery } from '@/redux/semesters'
import { formatDate } from '@/util/timeAndDate'
import { FormattedStudent as Student } from '@oodikone/shared/types'
import { GenderCodeToText } from '@oodikone/shared/types/genderCode'
import { useMemo } from 'react'

export const useColumns = ({
  showCombinedProgrammeColumns
}): [string[], string[]] => {
  const { visible: namesVisible } = useStudentNameVisibility()

  const nameColumns = namesVisible ? [
    'lastName',
    'givenNames',
  ] : []

  const combinedProgrammeColumns = showCombinedProgrammeColumns ? [
    'graduationDateCombinedProg',
    'creditsCombinedProg'
  ] : []

  return [[
    ...nameColumns,
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
    ...combinedProgrammeColumns,
  ], [
    'email',
    'phoneNumber',
  ]]
}

export const format = ({
  programme,
  combinedProgramme,
  showBachelorAndMaster,

  filteredStudents,
}) => {
  const { useFilterSelector } = useFilters()
  const creditDateFilterOptions = useFilterSelector(creditDateFilter.selectors.selectOptions())

  const { isAdmin } = useGetAuthorizedUserQuery()
  const { getTextIn } = useLanguage()

  const { data: programmes, isSuccess: programmesSuccess } = useGetProgrammesQuery()
  const { data: semesters, isSuccess: semestersSuccess} = useGetSemestersQuery()

  if (!programmesSuccess || !semestersSuccess) return null

  const currentSemester = semesters?.currentSemester

  const queryStudyrights = [programme, combinedProgramme].filter(studyright => !!studyright) as string[]

  const isMastersProgramme = programmes[programme]?.degreeProgrammeType === 'urn:code:degree-program-type:masters-degree'
  const shouldShowBachelorAndMaster = showBachelorAndMaster === 'true'

  const semestersToAddToStart = shouldShowBachelorAndMaster && isMastersProgramme ? 6 : 0

  const {
    studentToStudyrightEndMap,
    studentToSecondStudyrightEndMap,
  } = createMaps(
    filteredStudents,
    programme,
    combinedProgramme,
    // year,
    null,
    currentSemester?.semestercode,
    shouldShowBachelorAndMaster
  )

  const { getSemesterEnrollmentsContent, getSemesterEnrollmentsVal } = getSemestersPresentFunctions({
    getTextIn,
    programme,
    studentToStudyrightEndMap,
    studentToSecondStudyrightEndMap,
    // year: firstYearOfThisThing,
    year: null,
    semestersToAddToStart,
  })

  const containsStudyTracks: boolean = filteredStudents.some(({ studyRights }) => {
    studyRights?.some(({ studyRightElements }) =>
      studyRightElements.some(element => queryStudyrights.includes(element.code))
    )
  })

  const formatStudent = (student: Student): FormattedStudentData => {
    const studentProgrammes = getAllProgrammesOfStudent(student.studyRights ?? [], currentSemester)

    const primaryProgramme = studentProgrammes.find(({ code }) => code === programme) ?? studentProgrammes[0]
    const otherProgrammes = studentProgrammes.filter(({ code }) => code !== programme)

    const relevantStudyRight = findStudyRightForClass(student.studyRights, primaryProgramme?.code, /*year*/ null)
    const relevantStudyRightElement = relevantStudyRight?.studyRightElements.find(({ code }) => code === primaryProgramme?.code)

    const relevantStudyplan = student.studyplans?.find(({ programme_code }) => programme_code === primaryProgramme?.code)

    const degreeProgrammeTypeToCheck = !!relevantStudyRightElement && !isMastersProgramme
        ? 'urn:code:degree-program-type:masters-degree'
        : 'urn:code:degree-program-type:bachelors-degree'

    const secondStudyRightElement = (relevantStudyRight?.studyRightElements ?? [])
      .filter(element => {
        if (combinedProgramme) return element.code === combinedProgramme
        if (showBachelorAndMaster && !!relevantStudyRightElement)
          return element.degreeProgrammeType === degreeProgrammeTypeToCheck

        return false
      })
      .toSorted(({ startDate: a }, { startDate: b }) => Number(b < a) * 1 + Number(a < b) * -1)[0]

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

    const studentWithEnrollmentMap = {
      studentNumber: student.studentNumber,
      semesterEnrollmentsMap: programme
        ? relevantStudyRight?.semesterEnrollments?.reduce((enrollments, { type, semester, statutoryAbsence }) => {
            enrollments[semester] = {
              enrollmenttype: type,
              statutoryAbsence: statutoryAbsence ?? false,
            }
            return enrollments
          }, {}) ?? null
        : null,
    }

    const graduationDate = relevantStudyRightElement?.graduated
        ? formatDate(relevantStudyRightElement.endDate, DateFormat.ISO_DATE)
        : null

    // This is so that "Study programmes" column is complete in views that have no associated "primary" programme.      
    const programmesList = otherProgrammes

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

    const getCombinedProgrammeCredits = student =>
      student.studyplans?.find(plan => {
        if (combinedProgramme) return plan.programme_code === combinedProgramme

        const studyRightIdOfProgramme = student.studyRights.find(studyRight => studyRight.studyRightElements?.some(element => element.code === programme))
        return plan.sis_study_right_id === studyRightIdOfProgramme?.id && plan.programme_code !== programme
      })?.completed_credits

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
      sisuID: student.sis_person_id,
      creditsTotal: student.credits,
      creditsHops: student.hopsCredits,
      creditsSince: getCreditsBetween(student),
      studyTrack: containsStudyTracks ? getStudyTracks(student.studyRights).join(', ') : null,
      studyRightStart: formatDate(relevantStudyRight?.startDate, DateFormat.ISO_DATE),
      programmeStart: formatDate(relevantStudyRightElement?.startDate, DateFormat.ISO_DATE),
      option: getTextIn(student.option?.name) ?? null,
      semesterEnrollments: {
        content: getSemesterEnrollmentsContent(studentWithEnrollmentMap),
        exportValue: getSemesterEnrollmentsVal(studentWithEnrollmentMap),
      },
      graduationDate,
      startYearAtUniversity: student.started
        ? new Date(student.started).getFullYear()
        : null,
      programmes: { programmes: programmesList, exportValue: joinProgrammes(programmesList, getTextIn, '; ') },
      programmeStatus: getStudyRightStatus(),
      transferredFrom: getTextIn(programmes[student.transferSource!]?.name) ?? student.transferSource ?? '',
      admissionType: getAdmissiontype(),
      gender: GenderCodeToText[student.gender_code],
      citizenships: student.citizenships?.map(citizenship => getTextIn(citizenship)).sort().join(', ') ?? null,
      curriculumPeriod: student.curriculumVersion,
      mostRecentAttainment: getMostRecentAttainment(student),
      tvex: !!relevantStudyRight?.tvex,
      tags: student.tags?.map(({ tag }) => tag.tagname).join(', ') ?? null,
      creditsCombinedProg: combinedProgramme || shouldShowBachelorAndMaster
        ? getCombinedProgrammeCredits(student) ?? 0
        : null,
      graduationDateCombinedProg: (combinedProgramme || shouldShowBachelorAndMaster) && secondStudyRightElement?.graduated
        ? formatDate(secondStudyRightElement.endDate, DateFormat.ISO_DATE)
        : null,
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
