import moment from 'moment'

import { getNewestProgrammeOfStudentAt } from '@/common'
import { useCurrentSemester } from '@/common/hooks'
import { FilterToggleIcon } from '@/components/common/FilterToggleIcon'
import { ProgressBarWithLabel } from '@/components/common/ProgressBarWithLabel'
import { isProgrammeSelected, toggleProgrammeSelection } from '@/components/FilterView/filters/programmes'
import { useFilters } from '@/components/FilterView/useFilters'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { useGetSemestersQuery } from '@/redux/semesters'
import { SearchResultTable } from './SearchResultTable'

export const findCorrectProgramme = (student, coursecodes, semesters, startDate, endDate, currentSemester) => {
  let programme

  const courseAttainment = student.courses.find(
    a =>
      coursecodes.includes(a.course_code) &&
      moment(a.date).isBetween(startDate, endDate, 'date', '[]') &&
      a.credittypecode !== 7
  )

  if (courseAttainment?.studyright_id) {
    const correctStudyRight = student.studyRights.find(studyRight => studyRight.id === courseAttainment.studyright_id)
    if (correctStudyRight) {
      programme = getNewestProgrammeOfStudentAt([correctStudyRight], currentSemester, courseAttainment.date)
    }
    if (programme) return programme
  }

  const correctSemesters = Object.values(semesters.semesters || {})
    .filter(
      semester =>
        moment(semester.startdate).isSameOrAfter(startDate, 'day') &&
        moment(semester.enddate).isSameOrBefore(endDate, 'day')
    )
    .map(semester => semester.semestercode)
  const courseEnrollment = student.enrollments.find(
    enrollment => coursecodes.includes(enrollment.course_code) && correctSemesters.includes(enrollment.semestercode)
  )

  if (courseEnrollment?.studyright_id) {
    const correctStudyRight = student.studyRights.find(studyRight => studyRight.id === courseEnrollment.studyright_id)
    if (correctStudyRight) {
      programme = getNewestProgrammeOfStudentAt(
        [correctStudyRight],
        currentSemester,
        courseEnrollment.enrollment_date_time
      )
    }
    if (programme) return programme
  }

  const correctStudyplan = student.studyplans.find(studyplan =>
    studyplan.included_courses.some(course => coursecodes.includes(course))
  )
  if (correctStudyplan) {
    const correctStudyRight = student.studyRights.find(
      studyRight => studyRight.id === correctStudyplan.sis_study_right_id
    )
    programme = getNewestProgrammeOfStudentAt(
      [correctStudyRight],
      currentSemester,
      courseAttainment?.date ?? courseEnrollment.enrollment_date_time
    )
    if (programme) return programme
  }

  return getNewestProgrammeOfStudentAt(
    student.studyRights,
    currentSemester,
    courseAttainment?.date ?? courseEnrollment?.enrollment_date_time
  )
}

export const CustomPopulationProgrammeDist = ({ students, coursecode, from, to }) => {
  const { getTextIn } = useLanguage()
  const { data: semesters } = useGetSemestersQuery()
  const currentSemester = useCurrentSemester()
  if (!semesters || !currentSemester) return null
  const allProgrammes = {}

  for (const student of students) {
    let programme
    if (coursecode) {
      programme = findCorrectProgramme(student, coursecode, semesters, from, to, currentSemester?.semestercode)
    } else {
      programme = getNewestProgrammeOfStudentAt(student.studyRights, currentSemester?.semestercode)
    }

    if (!programme) {
      programme = { code: '00000', name: { en: 'No programme', fi: 'Ei ohjelmaa' } }
    }

    if (!allProgrammes[programme.code]) {
      allProgrammes[programme.code] = { programme, students: 0 }
    }
    allProgrammes[programme.code].students += 1
  }

  const rows = Object.entries(allProgrammes)
    .map(([code, { programme, students: programmeStudents }]) => [
      getTextIn(programme.name),
      code,
      programmeStudents,
      <ProgressBarWithLabel key={code} total={students.length} value={programmeStudents} />,
    ])
    .sort((a, b) => b[2] - a[2])

  const headers = ['Programme', 'Code', `Students (all=${students.length})`, 'Percentage of population']

  return (
    <SearchResultTable
      actionTrigger={row => <ProgrammeFilterToggleCell programme={row[1]} />}
      headers={headers}
      noResultText="placeholder"
      rows={rows}
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
