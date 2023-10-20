import React, { useState, useEffect } from 'react'
import { Progress } from 'semantic-ui-react'
import SearchResultTable from '../../SearchResultTable'
import { getNewestProgramme } from '../../../common'
import useLanguage from '../../LanguagePicker/useLanguage'
import useFilters from '../../FilterView/useFilters'
import { isProgrammeSelected, toggleProgrammeSelection } from '../../FilterView/filters/programmes'
import FilterToggleIcon from '../../FilterToggleIcon'

export const CustomPopulationProgrammeDist = ({ students, studentToTargetCourseDateMap, coursecode, studentData }) => {
  const { getTextIn } = useLanguage()

  const [tableRows, setRows] = useState([])

  useEffect(() => {
    if (Object.keys(studentData ?? {}).length === 0) return
    const allProgrammes = {}

    students.forEach(student => {
      let programme = getNewestProgramme(
        student.studyrights,
        student.studentNumber,
        studentToTargetCourseDateMap,
        studentData.elementdetails?.data
      )
      if (programme && programme.code === '00000' && coursecode) {
        const filteredEnrollments = (student.enrollments || [])
          // eslint-disable-next-line camelcase
          .filter(({ course_code }) => coursecode.includes(course_code))
          .sort((a, b) => new Date(b.enrollment_date_time) - new Date(a.enrollment_date_time))
        programme = getNewestProgramme(
          student.studyrights,
          student.studentNumber,
          { [student.studentNumber]: (filteredEnrollments[0] || {}).enrollment_date_time },
          studentData.elementdetails?.data
        )
      }
      if (programme) {
        if (allProgrammes[programme.code]) {
          allProgrammes[programme.code].students.push({ studentnumber: student.studentNumber })
        } else {
          allProgrammes[programme.code] = { programme, students: [] }
          allProgrammes[programme.code].students.push({ studentnumber: student.studentNumber })
        }
      } else {
        if (!allProgrammes['00000']) {
          allProgrammes['00000'] = { programme: { name: { en: 'No programme' } }, students: [] }
        }
        allProgrammes['00000'].students.push({ studentnumber: student.studentnumber })
      }
    })
    const rows = Object.entries(allProgrammes).map(([code, { programme, students: programmeStudents }]) => [
      getTextIn(programme.name),
      code,
      programmeStudents.length,
      <Progress
        value={programmeStudents.length}
        total={students.length}
        progress="percent"
        precision={0}
        style={{ margin: 0 }}
      />,
    ])
    const sortedRows = rows.sort((a, b) => b[2] - a[2])
    setRows(sortedRows)
  }, [students])

  const headers = ['Programme', 'Code', `Students (all=${students.length})`, 'Percentage of population']

  return (
    <SearchResultTable
      headers={headers}
      rows={tableRows}
      selectable
      noResultText="placeholder"
      actionTrigger={row => <ProgrammeFilterToggleCell programme={row[1]} />}
    />
  )
}

const ProgrammeFilterToggleCell = ({ programme }) => {
  const { useFilterSelector, filterDispatch } = useFilters()

  const isActive = useFilterSelector(isProgrammeSelected(programme))

  return (
    <span style={{ display: 'inline-block', marginRight: '0.3em' }}>
      <FilterToggleIcon onClick={() => filterDispatch(toggleProgrammeSelection(programme))} isActive={isActive} />
    </span>
  )
}
