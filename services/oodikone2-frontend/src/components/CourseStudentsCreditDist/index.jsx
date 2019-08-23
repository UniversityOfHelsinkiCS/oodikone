import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { Progress } from 'semantic-ui-react'
import { intersection } from 'lodash'
import { shape, func, bool, arrayOf, string } from 'prop-types'

import SearchResultTable from '../SearchResultTable'
import { gradeFilter } from '../../populationFilters'
import { setPopulationFilter } from '../../redux/populationFilters'

const CourseStudentsCreditDist = ({ singleCourseStats, yearcode, pending, selectedStudents, setPopulationFilterDispatch }) => {
  const [courseGrades, setGrades] = useState([])
  useEffect(() => {
    if (singleCourseStats.statistics) {
      const array = []
      const statistics = singleCourseStats.statistics.find(stats => stats.code === Number(yearcode))
      const grades = statistics ? Object.keys(statistics.students.grades) : []
      grades.forEach((grade) => {
        const filteredGrades = intersection(selectedStudents, statistics.students.grades[grade])
        array.push({ grade, amount: filteredGrades.length })
      })
      setGrades(array)
    }
  }, [pending, selectedStudents])
  const setFilter = (row) => {
    setPopulationFilterDispatch(gradeFilter({ grade: Number(row[0]), coursecodes: singleCourseStats.alternatives, coursename: singleCourseStats.name }))
  }

  const rows = courseGrades.map(g => [`${g.grade}`, g.amount, <Progress style={{ margin: '0px' }} percent={Math.round((g.amount / selectedStudents.length) * 100)} progress />])

  const headers = [
    'Grades',
    `Students (all=${selectedStudents.length})`,
    'Percentage of population'
  ]

  return (
    <SearchResultTable
      headers={headers}
      rows={rows}
      selectable
      rowClickFn={(e, row) => setFilter(row)}
      noResultText="placeholder"
    />
  )
}

CourseStudentsCreditDist.propTypes = {
  singleCourseStats: shape({}).isRequired,
  yearcode: string.isRequired,
  pending: bool.isRequired,
  selectedStudents: arrayOf(string).isRequired,
  setPopulationFilterDispatch: func.isRequired
}

const mapStateToProps = ({ singleCourseStats, populationFilters }) => ({
  singleCourseStats: singleCourseStats.stats,
  pending: singleCourseStats.pending,
  filters: populationFilters.filters.filter(f => f.type === 'GradeFilter')
})

export default connect(mapStateToProps, {
  setPopulationFilterDispatch: setPopulationFilter
})(CourseStudentsCreditDist)
