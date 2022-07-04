import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { Progress } from 'semantic-ui-react'
import { arrayOf, string, shape } from 'prop-types'
import SearchResultTable from '../../SearchResultTable'
import { getNewestProgramme, getTextIn } from '../../../common'
import useLanguage from '../../LanguagePicker/useLanguage'
import useFilters from '../../FilterView/useFilters'
import { isProgrammeSelected, toggleProgrammeSelection } from '../../FilterView/filters/programmes'
import FilterToggleIcon from '../../FilterToggleIcon'

const CustomPopulationProgrammeDist = ({
  samples,
  selectedStudents,
  studentToTargetCourseDateMap,
  populationStatistics,
  coursecode,
}) => {
  const { language } = useLanguage()

  const [tableRows, setRows] = useState([])

  useEffect(() => {
    if (Object.keys(populationStatistics).length > 0) {
      const allProgrammes = {}
      const filteredSamples = samples.filter(student => selectedStudents.includes(student.studentNumber))

      filteredSamples.forEach(student => {
        let programme = getNewestProgramme(
          student.studyrights,
          student.studentNumber,
          studentToTargetCourseDateMap,
          populationStatistics.elementdetails.data
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
            populationStatistics.elementdetails.data
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
      const rows = Object.entries(allProgrammes).map(([code, { programme, students }]) => [
        getTextIn(programme.name, language),
        code,
        students.length,
        <Progress
          style={{ margin: '0px' }}
          percent={Math.round((students.length / selectedStudents.length) * 100)}
          progress
        />,
      ])
      const sortedRows = rows.sort((a, b) => b[2] - a[2])
      setRows(sortedRows)
    }
  }, [selectedStudents])

  const headers = ['Programme', 'Code', `Students (all=${selectedStudents.length})`, 'Percentage of population']

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

CustomPopulationProgrammeDist.defaultProps = {
  studentToTargetCourseDateMap: null,
}

CustomPopulationProgrammeDist.propTypes = {
  samples: arrayOf(shape({})).isRequired,
  selectedStudents: arrayOf(string).isRequired,
  studentToTargetCourseDateMap: shape({}),
  populationStatistics: shape({}).isRequired,
}

const mapStateToProps = ({ populations }) => {
  return {
    populationStatistics: populations.data,
  }
}

export default connect(mapStateToProps)(CustomPopulationProgrammeDist)
