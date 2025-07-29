import { useMemo } from 'react'

import type { FormattedStudent } from '@oodikone/shared/types'

import { getHighestGradeOfCourseBetweenRange } from '@/common'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { useStudentNameVisibility } from '@/components/material/StudentNameVisibilityToggle'
import { getProgrammeDetails, useGetRelevantSemesterData } from '@/components/PopulationStudents/format/GeneralTab'
import { FormattedStudentData } from '@/components/PopulationStudents/StudentTable/GeneralTab'
import { joinProgrammes } from '@/components/PopulationStudents/StudentTable/GeneralTab/util'
import { DateFormat } from '@/constants/date'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { formatDate } from '@/util/timeAndDate'

export const useColumns = (): [string[], string[]] => {
  const { isAdmin } = useGetAuthorizedUserQuery()
  const { visible: namesVisible } = useStudentNameVisibility()

  const nameColumns = namesVisible ? ['lastName', 'firstNames'] : []

  const adminColumns = isAdmin ? ['extent', 'updatedAt'] : []

  const excelOnlyColumns = ['email', 'phoneNumber']

  return [
    [
      'studentNumber',
      'programmes',
      'creditsTotal',
      'grade',
      'language',
      'attainmentDate',
      'enrollmentDate',
      'startYearAtUniversity',
      'tvex',
      'tags',
      ...nameColumns,
      ...adminColumns,
    ],
    excelOnlyColumns,
  ]
}

export const useFormat = ({
  from,
  to,
  coursecodes,

  filteredStudents,
}) => {
  const { isAdmin } = useGetAuthorizedUserQuery()
  const { getTextIn } = useLanguage()

  const { data: semesters, isSuccess: semestersSuccess } = useGetRelevantSemesterData(undefined)

  if (!semestersSuccess) return []
  const { currentSemester, allSemesters } = semesters

  const studentProgrammeDetails = getProgrammeDetails({
    programme: undefined,
    isMastersProgramme: false,
    combinedProgramme: undefined,
    showBachelorAndMaster: false,

    currentSemester,
    year: null,
  })

  const includePrimaryProgramme = true

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

  const formatStudent = (student: FormattedStudent): Partial<FormattedStudentData> => {
    const {
      allProgrammes,
      primaryProgramme,

      relevantStudyRight,
    } = studentProgrammeDetails(student)

    const otherProgrammes = allProgrammes.filter(({ code }) => code !== primaryProgramme.code)

    const programmesList = includePrimaryProgramme ? allProgrammes : otherProgrammes

    const getCourseInformation = () => {
      const validCourses = student.courses.filter(({ course_code }) => coursecodes.includes(course_code))
      const grade = getHighestGradeOfCourseBetweenRange(validCourses, from, to)
      if (!grade) return { grade: '-', date: '', language: '' }

      const { date: attainmentDate, language } = validCourses
        .filter(course => course.grade === grade)
        .sort((a, b) => +new Date(b.date) - +new Date(a.date))
        .pop() ?? { date: '', language: '' }

      return { grade, attainmentDate, language }
    }

    const getEnrollmentDate = () => {
      if (!fromSemester || !toSemester || !student.enrollments?.length) return null
      return (
        student.enrollments
          ?.filter(({ course_code }) => coursecodes.includes(course_code))
          ?.filter(({ semestercode }) => fromSemester <= semestercode && semestercode <= toSemester)
          ?.shift()?.enrollment_date_time ?? null
      )
    }

    const enrollmentDate = getEnrollmentDate()
    const { attainmentDate, grade, language } = getCourseInformation()

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
      startYearAtUniversity: student.started ? new Date(student.started).getFullYear() : null,
      programmes: { programmes: programmesList, exportValue: joinProgrammes(programmesList, getTextIn, '; ') },
      tvex: !!relevantStudyRight?.tvex,
      tags: student.tags?.map(({ tag }) => tag.tagname).join(', ') ?? null,

      /* COURSE POPULATION SPECIFIC */
      grade,
      language,
      attainmentDate: attainmentDate ? formatDate(attainmentDate, DateFormat.ISO_DATE) : 'No attainment',
      enrollmentDate: enrollmentDate ? formatDate(enrollmentDate, DateFormat.ISO_DATE) : 'No enrollment',

      /* ADMIN COLUMNS */
      updatedAt: isAdmin ? formatDate(student.updatedAt, DateFormat.ISO_DATE_DEV) : null,
    }
  }

  return useMemo(() => filteredStudents.map(formatStudent), [filteredStudents])
}
