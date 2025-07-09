import { DateFormat } from '@/constants/date'
import { formatDate } from '@/util/timeAndDate'

import { FormattedStudentData } from '../GeneralTab'

const getStudyRight = (student, programmeCode) => {
  return student.studyRights.find(studyRight => studyRight.studyRightElements.some(element => element.code === programmeCode))
}

const getProgrammeList = ({ studentNumber }) => {
  return []
}

const getExtent = student => ''

const parseTags = tags => {
  const studentTags = tags?.map(studentTag => studentTag.tag.tagname)
  return studentTags.join(', ')
}

const getMostRecentAttainment = (student, programmeCode) => {
  const studyPlan = student.studyplans?.find(plan => plan.programme_code === programmeCode) ?? null
  if (!studyPlan) return ''

  const { included_courses } = studyPlan
  const dates = student.courses
    .filter(course => included_courses.includes(course.course_code) && course.passed === true)
    .map(course => course.date)
  if (!dates.length) return ''
  const latestDate = dates.sort((a, b) => +new Date(b) - +new Date(a))[0]
  return formatDate(latestDate, DateFormat.ISO_DATE)
}

export const formatStudent = (student: any, {
  isAdmin,
  programmeCode,
  getTextIn,
}): FormattedStudentData => {
  const correctStudyRight = getStudyRight(student, programmeCode)
  const programmesList = getProgrammeList(student)

  const result: FormattedStudentData = {
    firstNames: student.firstnames,
    lastName: student.lastname,
    studentNumber: student.obfuscated ? 'Hidden' : student.studentNumber,
    email: student.email,
    phoneNumber: student.phoneNumber,
    sisuID: student.sis_person_id,
    creditsTotal: student.allCredits ?? student.credits,
    creditsHops: 0,
    creditsSince: 0,
    studyTrack: null,
    studyRightStart: formatDate(undefined, DateFormat.ISO_DATE),
    programmeStart: formatDate(undefined, DateFormat.ISO_DATE),
    option: getTextIn(student.option?.name) ?? '',
    semesterEnrollments: {
      exportValue: 0,
      content: null,
    },
    graduationDate: '',
    startYearAtUniversity: '',
    programmes: { programmes: programmesList, exportValue: ';' },
    programmeStatus: '',
    transferredFrom: '',
    admissionType: null,
    gender: student.gender_code,
    citizenships: student.citizenships?.map(getTextIn).sort().join(', ') ?? null,
    curriculumPeriod: student.curriculumVersion,
    mostRecentAttainment: getMostRecentAttainment(student, programmeCode),
    tvex: !!correctStudyRight?.tvex,
    tags: parseTags(student.tags) ?? null,
    extent: isAdmin && getExtent(student),
    updatedAt: isAdmin && formatDate(student.updatedAt, DateFormat.ISO_DATE_DEV),
  }

  return result
}
