import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { Progress } from 'semantic-ui-react'
import { func, arrayOf, string, shape } from 'prop-types'

import SearchResultTable from '../SearchResultTable'
import { programmeFilter } from '../../populationFilters'
import { setPopulationFilter, removePopulationFilter } from '../../redux/populationFilters'
import { getNewestProgramme } from '../../common'

const CustomPopulationProgrammeDist = ({
  samples,
  selectedStudents,
  setPopulationFilterDispatch,
  removePopulationFilterDispatch,
  filters,
  studentToTargetCourseDateMap
}) => {
  const [tableRows, setRows] = useState([])
  useEffect(() => {
    const allProgrammes = {}
    const filteredSamples = samples.filter(student => selectedStudents.includes(student.studentNumber))
    filteredSamples.forEach(student => {
      const programme = getNewestProgramme(student.studyrights, student.studentNumber, studentToTargetCourseDateMap)
      if (programme) {
        if (allProgrammes[programme.code]) {
          allProgrammes[programme.code].students.push({ studentnumber: student.studentNumber })
        } else {
          allProgrammes[programme.code] = { programme, students: [] }
          allProgrammes[programme.code].students.push({ studentnumber: student.studentNumber })
        }
      } else {
        if (!allProgrammes['00000']) {
          allProgrammes['00000'] = { programme: { name: 'No programme', code: '' }, students: [] }
        }
        allProgrammes['00000'].students.push({ studentnumber: student.studentnumber })
      }
    })
    const rows = Object.keys(allProgrammes).map(code => [
      `${allProgrammes[code].programme.name}, ${code}`,
      allProgrammes[code].students.length,
      <Progress
        style={{ margin: '0px' }}
        percent={Math.round((allProgrammes[code].students.length / selectedStudents.length) * 100)}
        progress
      />
    ])
    const sortedRows = rows.sort((a, b) => b[1] - a[1])
    setRows(sortedRows)
  }, [selectedStudents])

  const setFilter = row => {
    const splitRow = row[0].split(', ')
    filters.map(filter => removePopulationFilterDispatch(filter.id))
    setPopulationFilterDispatch(
      programmeFilter({ programme: splitRow[1], programmeName: splitRow[0], studentToTargetCourseDateMap })
    )
  }

  const headers = ['Programmes', `Students (all=${selectedStudents.length})`, 'Percentage of population']

  return (
    <SearchResultTable
      headers={headers}
      rows={tableRows}
      selectable
      rowClickFn={(e, row) => setFilter(row)}
      noResultText="placeholder"
    />
  )
}

CustomPopulationProgrammeDist.defaultProps = {
  studentToTargetCourseDateMap: null
}

CustomPopulationProgrammeDist.propTypes = {
  samples: arrayOf(shape({})).isRequired,
  selectedStudents: arrayOf(string).isRequired,
  setPopulationFilterDispatch: func.isRequired,
  removePopulationFilterDispatch: func.isRequired,
  filters: arrayOf(shape({})).isRequired,
  studentToTargetCourseDateMap: shape({})
}

const mapStateToProps = ({ populationFilters }) => {
  return { filters: populationFilters.filters.filter(f => f.type === 'ProgrammeFilter') }
}

export default connect(
  mapStateToProps,
  {
    setPopulationFilterDispatch: setPopulationFilter,
    removePopulationFilterDispatch: removePopulationFilter
  }
)(CustomPopulationProgrammeDist)
