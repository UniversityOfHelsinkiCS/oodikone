import { useSelector } from 'react-redux'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { ISO_DATE_FORMAT } from '@/constants/date'
import { useCurrentSemester } from '@/hooks/currentSemester'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useGetProgrammesQuery } from '@/redux/populations'
import { reformatDate } from '@/util/timeAndDate'
import { createMaps } from '../columnHelpers/createMaps'

import { GeneralTab } from './GeneralTab'

export type FormattedStudentData = {
  firstNames: string
  lastName: string
  studentNumber: string
  totalCredits: number
  hopsCredits: number
  creditsSinceStart: number
  studyRightStart: string // date
  programmeStart: string
  master: string
  semestersPresent: any // placeholder
  graduationDate: string
  startYearAtUniversity: number | string
  otherProgrammes: string[]
  transferredFrom: string
  admissionType: string
  gender: string
  citizenships: string[]
  curriculumPeriod: string
  mostRecentAttainment: string
  tags: any
  priority?: string
  extent?: string
  updatedAt?: string
}

export const GeneralTabContainer = ({ filteredStudents, customPopulationProgramme, group, year, variant }) => {
  // undefined, population
  // console.log(studyGuidanceGroup, variant)
  const { getTextIn } = useLanguage()
  const { isAdmin } = useGetAuthorizedUserQuery()
  // console.log("variant", variant)
  const currentSemester = useCurrentSemester()
  const selectedColumns: string[] = []
  const { data: programmes = {} } = useGetProgrammesQuery()

  // Data only used to return null? is filteredstudents also null in that case rendering this useless
  // @ts-expect-error fix type to not be unknown..
  const { data: populationStatistics, query } = useSelector(({ populations }) => populations)
  if (!populationStatistics) return null

  const studyGuidanceGroupProgrammes = group?.tags?.studyProgramme?.includes('+')
    ? group?.tags?.studyProgramme.split('+')
    : [group?.tags?.studyProgramme]
  const programmeCode = query?.studyRights?.programme || studyGuidanceGroupProgrammes[0] || customPopulationProgramme

  const getTransferredFrom = (student: any) =>
    getTextIn(programmes[student.transferSource]?.name) ?? student.transferSource

  const showBachelorAndMaster = query?.showBachelorAndMaster === 'true'

  const getStudyRight = student =>
    student.studyRights.find(studyRight =>
      studyRight.studyRightElements.some(element => element.code === programmeCode)
    )

  const createSemesterEnrollmentsMap = student => {
    const semesterEnrollments = getStudyRight(student)?.semesterEnrollments

    if (!semesterEnrollments) return null

    return semesterEnrollments.reduce((enrollments, { type, semester, statutoryAbsence }) => {
      enrollments[semester] = {
        enrollmenttype: type,
        statutoryAbsence: statutoryAbsence ?? false,
      }
      return enrollments
    }, {})
  }
  const selectedStudentNumbers = filteredStudents.map(student => student.studentNumber)
  const students = filteredStudents.reduce((acc, student) => {
    acc[student.studentNumber] = selectedColumns.includes('semesterEnrollments')
      ? { ...student, semesterEnrollmentsMap: programmeCode != null ? createSemesterEnrollmentsMap(student) : null }
      : student
    return acc
  }, {})

  const combinedProgrammeCode = query?.studyRights?.combinedProgramme
    ? query.studyRights.combinedProgramme
    : studyGuidanceGroupProgrammes.length > 1
      ? studyGuidanceGroupProgrammes[1]
      : ''

  const shouldShowAdmissionType = parseInt(query?.year, 10) >= 2020 || parseInt(group?.tags?.year, 10) >= 2020
  const getAdmissiontype = student => {
    const studyRight = getStudyRight(student)
    const admissionType = studyRight?.admissionType ?? 'Ei valintatapaa'
    return admissionType !== 'Koepisteet' ? admissionType : 'Valintakoe'
  }

  const getGender = genderCode => {
    const genders = {
      0: 'Unknown',
      1: 'Male',
      2: 'Female',
      3: 'Other',
    }
    return genders[genderCode]
  }
  const getMostRecentAttainment = student => {
    const studyPlan = student.studyplans.find(plan => plan.programme_code === programmeCode)
    if (!studyPlan) return ''

    const { included_courses } = studyPlan
    const dates = student.courses
      .filter(course => included_courses.includes(course.course_code) && course.passed === true)
      .map(course => course.date)
    if (!dates.length) return ''
    const latestDate = dates.sort((a, b) => +new Date(b) - +new Date(a))[0]
    return reformatDate(latestDate, ISO_DATE_FORMAT)
  }
  const parseTags = tags => {
    const studentTags = tags.map(tag => tag.tag.tagname)
    return studentTags.join(', ')
  }

  const getStartingYear = ({ started }) => (started ? new Date(started).getFullYear() : '')

  const getGraduationDate = ({ studentNumber }) =>
    studentToStudyrightEndMap[studentNumber]
      ? reformatDate(studentToStudyrightEndMap[studentNumber], ISO_DATE_FORMAT)
      : ''

  const {
    studentToStudyrightStartMap,
    studentToStudyrightEndMap,
    studentToProgrammeStartMap,
    // studentToSecondStudyrightEndMap,
    studentToOtherProgrammesMap,
  } = createMaps({
    students,
    selectedStudents: selectedStudentNumbers,
    programmeCode,
    combinedProgrammeCode,
    year,
    getTextIn,
    currentSemester: currentSemester?.semestercode,
    showBachelorAndMaster,
  })

  // console.log(filteredStudents)
  const formatStudent = (student: any): FormattedStudentData => {
    return {
      firstNames: student.firstnames,
      lastName: student.lastname,
      studentNumber: student.studentNumber,
      totalCredits: student.allCredits,
      hopsCredits: student.hopsCredits,
      creditsSinceStart: 0,
      studyRightStart: reformatDate(studentToStudyrightStartMap[student.studentNumber], ISO_DATE_FORMAT),
      programmeStart: reformatDate(studentToProgrammeStartMap[student.studentNumber], ISO_DATE_FORMAT),
      master: (student.option ? getTextIn(student.option.name) : '') ?? '', // TODO: fix, consider also bsc vs masters
      semestersPresent: 'placeholder', // TODO: implement
      graduationDate: getGraduationDate(student),
      startYearAtUniversity: getStartingYear(student),
      otherProgrammes: studentToOtherProgrammesMap[student.studentNumber]?.programmes.map(programme =>
        getTextIn(programme.name)
      ),
      transferredFrom: student.transferredStudyRight ?? getTransferredFrom(student),
      admissionType: shouldShowAdmissionType && getAdmissiontype(student),
      gender: getGender(student.gender_code),
      citizenships: student.citizenships.map(getTextIn).sort(),
      curriculumPeriod: student.curriculumVersion,
      mostRecentAttainment: getMostRecentAttainment(student),
      tags: parseTags(student.tags),
    }
  }
  const formattedData = filteredStudents.map(student => formatStudent(student))
  // console.log(formattedData)
  return <GeneralTab formattedData={formattedData} showAdminColumns={isAdmin} variant={variant} />
}
