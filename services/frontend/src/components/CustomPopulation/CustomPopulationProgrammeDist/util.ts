import dayjs, { extend as dayjsExtend } from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import { getNewestProgrammeOfStudentAt, getSemesterCodeAt } from '@/common'
import { SemestersData } from '@/redux/semesters'
import { CreditTypeCode, FormattedStudent } from '@oodikone/shared/types'

dayjsExtend(isBetween)
dayjsExtend(isSameOrBefore)
dayjsExtend(isSameOrAfter)

// Open university studyrights
export const NO_PROGRAMME = {
  code: '00000',
  name: {
    en: 'No degree programme',
    fi: 'Ei koulutusohjelmaa',
    sv: 'Inget utbildningsprogram',
  },
  facultyCode: '00000',
} as const

/**
 * If course is in a studyplan, the degree programme corresponding to the study plan.
 * If not, the most recent active programme at the time.
 * If neither, "No degree programme".
 */
const handleOpenUniversity = (
  student: FormattedStudent,
  coursecodes: string[],
  semesterCode?: number,
  date?: string
) => {
  const hopsWithCourse = student.studyplans.find(sp => sp.included_courses.some(course => coursecodes.includes(course)))

  if (hopsWithCourse) {
    const correctStudyRight = student.studyRights.find(sr => sr.id === hopsWithCourse.sis_study_right_id)
    if (correctStudyRight) {
      return getNewestProgrammeOfStudentAt([correctStudyRight], semesterCode, false, date) ?? NO_PROGRAMME
    }
  }

  const programme = getNewestProgrammeOfStudentAt(student.studyRights, semesterCode, true, date)
  return programme ?? NO_PROGRAMME
}

/**
 * If attainment/enrollment has associated studyright_id, return the matching studyright by the id from the student's studyrights.
 * If student has no such studyright, it must be an open university studyright.
 *
 * In case of open university:
 * 1. If the course is in the student's HOPS, use the degree programme of that HOPS.
 * 2. If the student had at the time ANY active study right to some degree programme, use that.
 *
 * Only use NO_PROGRAMME when the conditions fail.
 *
 * If making changes make sure they are reflected in the info box(es).
 */
export const findCorrectProgramme = (
  student: FormattedStudent,
  coursecodes: string[],
  semesters: SemestersData['semesters'],
  startDate: Date,
  endDate: Date,
  currentSemester?: number
) => {
  const courseAttainment = student.courses.find(
    attainment =>
      coursecodes.includes(attainment.course_code) &&
      dayjs(attainment.date).isBetween(startDate, endDate, 'date', '[]') &&
      attainment.credittypecode !== CreditTypeCode.IMPROVED
  )
  const attainmentDate = courseAttainment?.date?.toString()

  if (courseAttainment?.studyright_id) {
    const correctStudyRight = student.studyRights?.find(studyRight => studyRight.id === courseAttainment.studyright_id)
    const attainmentSemesterCode = getSemesterCodeAt(semesters, attainmentDate)

    return correctStudyRight
      ? (getNewestProgrammeOfStudentAt([correctStudyRight], attainmentSemesterCode, false, attainmentDate) ??
          NO_PROGRAMME)
      : handleOpenUniversity(student, coursecodes, attainmentSemesterCode, attainmentDate)
  }

  const correctSemesters = Object.values(semesters)
    .filter(
      semester =>
        dayjs(semester.startdate).isSameOrAfter(startDate, 'day') &&
        dayjs(semester.enddate).isSameOrBefore(endDate, 'day')
    )
    .map(semester => semester.semestercode)

  const courseEnrollment = student.enrollments?.find(
    enrollment => coursecodes.includes(enrollment.course_code) && correctSemesters.includes(enrollment.semestercode)
  )

  if (courseEnrollment?.studyright_id) {
    const correctStudyRight = student.studyRights.find(studyRight => studyRight.id === courseEnrollment.studyright_id)
    return correctStudyRight
      ? (getNewestProgrammeOfStudentAt(
          [correctStudyRight],
          courseEnrollment.semestercode,
          false,
          courseEnrollment.enrollment_date_time.toString()
        ) ?? NO_PROGRAMME)
      : handleOpenUniversity(
          student,
          coursecodes,
          courseEnrollment.semestercode,
          courseEnrollment.enrollment_date_time.toString()
        )
  }

  // If course is in studyplan without a studyright associated with the attainment or the enrollment
  // Unclear if this is ever reached
  const correctStudyplan = student.studyplans.find(studyplan =>
    studyplan.included_courses.some(course => coursecodes.includes(course))
  )
  if (correctStudyplan) {
    const correctStudyRight = student.studyRights.find(
      studyRight => studyRight.id === correctStudyplan.sis_study_right_id
    )
    return correctStudyRight
      ? (getNewestProgrammeOfStudentAt(
          [correctStudyRight],
          currentSemester,
          false,
          attainmentDate ?? courseEnrollment?.enrollment_date_time?.toString()
        ) ?? NO_PROGRAMME)
      : handleOpenUniversity(
          student,
          coursecodes,
          currentSemester,
          attainmentDate ?? courseEnrollment?.enrollment_date_time?.toString()
        )
  }

  // Fallback: latest degree programme of the student
  return (
    getNewestProgrammeOfStudentAt(
      student.studyRights,
      currentSemester,
      false,
      attainmentDate ?? courseEnrollment?.enrollment_date_time?.toString()
    ) ?? NO_PROGRAMME
  )
}
