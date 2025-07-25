import { findStudyRightForClass, getAllProgrammesOfStudent, getHighestGradeOfCourseBetweenRange } from '@/common'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { useStudentNameVisibility } from '@/components/material/StudentNameVisibilityToggle'
import { FormattedStudentData } from '@/components/PopulationStudents/StudentTable/GeneralTab'
import { joinProgrammes } from '@/components/PopulationStudents/StudentTable/GeneralTab/util'
import { DateFormat } from '@/constants/date'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useGetSemestersQuery } from '@/redux/semesters'
import { formatDate } from '@/util/timeAndDate'
import { FormattedStudent } from '@oodikone/shared/types'
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
    'creditsTotal',
    'grade',
    'startYearAtUniversity',
    'programmes',
    'attainmentDate',
    'enrollmentDate',
    'language',
    'tvex',
    'tags',
    'updatedAt',
  ], [
    'email',
    'phoneNumber',
  ]]
}

export const format = ({
  from,
  to,
  coursecodes,

  filteredStudents,
}) => {
  const { isAdmin } = useGetAuthorizedUserQuery()
  const { getTextIn } = useLanguage()

  const { data: semesters, isSuccess: semestersSuccess} = useGetSemestersQuery()

  if (!semestersSuccess) return null

  const allSemesters = semesters?.semesters
  const currentSemester = semesters?.currentSemester

  const includePrimaryProgramme = true

  const formatStudent = (student: FormattedStudent): Partial<FormattedStudentData> => {
    const studentProgrammes = getAllProgrammesOfStudent(student.studyRights ?? [], currentSemester)

    const primaryProgramme = studentProgrammes[0]
    const otherProgrammes = studentProgrammes.filter(({ code }) => code !== primaryProgramme?.code)

    const relevantStudyRight = findStudyRightForClass(student.studyRights, primaryProgramme?.code, /* year */ null)

    /* ***** */ /* ***** */ /* ***** */
    /* ***** */ /* ***** */ /* ***** */
    /* ***** */ /* ***** */ /* ***** */

    // This is so that "Study programmes" column is complete in views that have no associated "primary" programme.      
    const programmesList = [...(includePrimaryProgramme && primaryProgramme ? [primaryProgramme] : []), ...otherProgrammes]

    const getCourseInformation = student => {
      const courses = student.courses.filter(course => coursecodes.includes(course.course_code))
      // console.log(getHighestGradeOfCourseBetweenRange(courses, from, to))
      const { grade } = getHighestGradeOfCourseBetweenRange(courses, from, to) ?? { grade: undefined }
      if (!grade) return { grade: '-', date: '', language: '' }

      const { date: attainmentDate, language } = courses
        .filter(course => course.grade === grade)
        .sort((a, b) => +new Date(b.date) - +new Date(a.date))
        .pop()

      return { grade, attainmentDate, language }
    }

    const fromSemester = from
      ? Object.values(allSemesters)
          .filter(({ startdate }) => new Date(startdate) <= new Date(from))
          .sort((a, b) => +new Date(b.startdate) - +new Date(a.startdate))[0]?.semestercode
      : null

    const toSemester = to
      ? Object.values(allSemesters)
          .filter(({ enddate }) => new Date(to) <= new Date(enddate))
          .sort((a, b) => +new Date(a.enddate) - +new Date(b.enddate))[0]?.semestercode
      : null

    const getEnrollmentDate = student => {
      if (!fromSemester || !toSemester || student?.enrollments) return null
      const enrollments =
        student.enrollments
          ?.filter(enrollment => coursecodes.includes(enrollment?.course_code))
          ?.filter(enrollment => fromSemester <= enrollment?.semestercode && enrollment?.semestercode <= toSemester) ??
        null
      return enrollments ? (enrollments[0].enrollment_date_time ?? null) : null
    }

    const { attainmentDate, grade, language } = getCourseInformation(student)
    const enrollmentDate = getEnrollmentDate(student)

    return {
      firstNames: student.firstnames,
      lastName: student.lastname,
      studentNumber: student.obfuscated ? 'Hidden' : student.studentNumber,
      email: student.email,
      phoneNumber: student.phoneNumber,
      sisuID: student.sis_person_id,
      creditsTotal: student.credits,
      grade: grade,
      startYearAtUniversity: student.started
        ? new Date(student.started).getFullYear()
        : null,
      programmes: { programmes: programmesList, exportValue: joinProgrammes(programmesList, getTextIn, '; ') },
      attainmentDate: attainmentDate ? formatDate(attainmentDate, DateFormat.ISO_DATE) : 'No attainment',
      enrollmentDate: enrollmentDate ? formatDate(enrollmentDate, DateFormat.ISO_DATE) : 'No enrollment',
      language: language,
      tvex: !!relevantStudyRight?.tvex,
      tags: student.tags?.map(({ tag }) => tag.tagname).join(', ') ?? null,
      updatedAt: isAdmin
        ? formatDate(student.updatedAt, DateFormat.ISO_DATE_DEV)
        : null,
    }
  }

  return useMemo(() => filteredStudents.map(formatStudent), [filteredStudents])
}
