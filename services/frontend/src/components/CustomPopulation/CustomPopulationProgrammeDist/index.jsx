import moment from 'moment'
import React from 'react'
import { Progress } from 'semantic-ui-react'

import { getNewestProgramme } from '@/common'
import { FilterToggleIcon } from '@/components/common/FilterToggleIcon'
import { isProgrammeSelected, toggleProgrammeSelection } from '@/components/FilterView/filters/programmes'
import { useFilters } from '@/components/FilterView/useFilters'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { useGetSemestersQuery } from '@/redux/semesters'
import { SearchResultTable } from './SearchResultTable'

const formatStudyright = (studyright, date) => {
  if (!studyright) return undefined
  const studyrightElementsDuringCourse =
    studyright?.studyright_elements.filter(
      element =>
        element.element_detail.type === 20 && moment(date).isBetween(element.startdate, element.enddate, 'day', '[]')
    ) || []
  if (studyrightElementsDuringCourse.length === 0) {
    return {
      name: { en: 'No programme at the time of attainment', fi: 'Ei ohjelmaa suorituksen hetkellä' },
      code: '00000',
      facultyCode: '00000',
    }
  }
  const { element_detail: elementDetail, code } = studyrightElementsDuringCourse.sort(
    (a, b) => new Date(b.startdate) - new Date(a.startdate)
  )[0]
  return { name: elementDetail.name, code, facultyCode: studyright.faculty_code }
}

export const findCorrectProgramme = (student, coursecodes, semesters, startDate, endDate) => {
  const yearcode = Object.values(semesters.years || {}).find(
    year => moment(year.startdate).isSame(startDate, 'day') && moment(year.enddate).isSame(endDate, 'day')
  )?.yearcode
  const correctSemesters = Object.values(semesters.semesters || {})
    .filter(sem => sem.yearcode === yearcode)
    .map(sem => sem.semestercode)
  let programme
  const courseAttainment = student.courses.filter(
    a =>
      coursecodes.includes(a.course_code) &&
      moment(a.date).isBetween(startDate, endDate, undefined, '[]') &&
      a.credittypecode !== 7
  )[0]
  const courseEnrollments =
    student.enrollments?.filter(enrollment => coursecodes.includes(enrollment.course_code)) || []
  let studyrightIdOfCourse
  const findStudyrightAssociatedWithCourse = (studyright, date) =>
    studyright.studyright_elements.some(
      element =>
        element.element_detail.type === 20 &&
        moment(date).isBetween(element.startdate, element.enddate, undefined, '[]')
    )

  // First check if there's a studyright associated with the course attainment
  if (courseAttainment) {
    studyrightIdOfCourse = courseAttainment?.studyright_id
    if (!studyrightIdOfCourse) {
      const studyplanStudyrightId = student.studyplans.find(sp =>
        sp.included_courses.some(c => coursecodes.includes(c))
      )?.studyrightid
      if (studyplanStudyrightId) {
        studyrightIdOfCourse = student.studyrights.find(
          studyright => studyright.studyrightid === studyplanStudyrightId
        ).actual_studyrightid
      }
    }
    if (studyrightIdOfCourse) {
      const correctStudyrights = student.studyrights.filter(
        studyright => studyright.actual_studyrightid === studyrightIdOfCourse
      )
      const studyrightAssociatedWithCourse = correctStudyrights.find(studyright =>
        findStudyrightAssociatedWithCourse(studyright, courseAttainment.date)
      )
      programme = formatStudyright(studyrightAssociatedWithCourse, courseAttainment.date)
    }
  }

  // If no studyright associated with the course attainment, check if there's a studyright associated with the course enrollment
  if (!programme) {
    const courseEnrollment = courseEnrollments.find(enrollment => correctSemesters.includes(enrollment.semestercode))
    studyrightIdOfCourse = courseEnrollment?.studyright_id
    if (studyrightIdOfCourse) {
      const correctStudyrights = student.studyrights.filter(
        studyright => studyright.actual_studyrightid === studyrightIdOfCourse
      )
      const studyrightAssociatedWithCourse = correctStudyrights.find(studyright =>
        findStudyrightAssociatedWithCourse(studyright, courseEnrollment.enrollment_date_time)
      )
      programme = formatStudyright(studyrightAssociatedWithCourse, courseEnrollment.enrollment_date_time)
    }
  }
  return programme
}

export const CustomPopulationProgrammeDist = ({
  students,
  studentToTargetCourseDateMap,
  coursecode,
  studentData,
  from,
  to,
}) => {
  const { getTextIn } = useLanguage()
  const { data: semesters } = useGetSemestersQuery()
  if (!semesters) return null
  const allProgrammes = {}

  students.forEach(student => {
    let programme
    if (coursecode) {
      programme = findCorrectProgramme(student, coursecode, semesters, from, to)
    }

    // If no studyright associated with the course attainment or enrollment or there are no courseCodes,
    // (custom population) just get the newest studyright at the time of the course attainment or enrollment
    if (!programme) {
      programme = getNewestProgramme(
        student.studyrights,
        student.studentNumber,
        studentToTargetCourseDateMap,
        studentData.elementdetails?.data
      )
    }
    if (programme && programme.code === '00000' && coursecode) {
      const filteredEnrollments = (student.enrollments || [])
        .filter(({ course_code: courseCode }) => coursecode.includes(courseCode))
        .sort((a, b) => new Date(b.enrollment_date_time) - new Date(a.enrollment_date_time))
      programme = getNewestProgramme(
        student.studyrights,
        student.studentNumber,
        { [student.studentNumber]: (filteredEnrollments[0] || {}).enrollment_date_time },
        studentData.elementdetails?.data
      )
    }
    if (programme) {
      if (!allProgrammes[programme.code]) {
        allProgrammes[programme.code] = { programme, students: 0 }
      }
      allProgrammes[programme.code].students += 1
    } else {
      if (!allProgrammes['00000']) {
        allProgrammes['00000'] = { programme: { name: { en: 'No programme', fi: 'Ei ohjelmaa' } }, students: 0 }
      }
      allProgrammes['00000'].students += 1
    }
  })
  const rows = Object.entries(allProgrammes).map(([code, { programme, students: programmeStudents }]) => [
    getTextIn(programme.name),
    code,
    programmeStudents,
    <Progress
      key={code}
      precision={0}
      progress="percent"
      style={{ margin: 0 }}
      total={students.length}
      value={programmeStudents}
    />,
  ])
  const sortedRows = rows.sort((a, b) => b[2] - a[2])

  const headers = ['Programme', 'Code', `Students (all=${students.length})`, 'Percentage of population']

  return (
    <SearchResultTable
      actionTrigger={row => <ProgrammeFilterToggleCell programme={row[1]} />}
      headers={headers}
      noResultText="placeholder"
      rows={sortedRows}
      selectable
    />
  )
}

const ProgrammeFilterToggleCell = ({ programme }) => {
  const { useFilterSelector, filterDispatch } = useFilters()

  const isActive = useFilterSelector(isProgrammeSelected(programme))

  return (
    <span style={{ display: 'inline-block', marginRight: '0.3em' }}>
      <FilterToggleIcon isActive={isActive} onClick={() => filterDispatch(toggleProgrammeSelection(programme))} />
    </span>
  )
}
