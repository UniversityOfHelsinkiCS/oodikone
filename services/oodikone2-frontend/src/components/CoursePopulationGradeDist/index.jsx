import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { Progress } from 'semantic-ui-react'
import { intersection } from 'lodash'
import { shape, func, bool, arrayOf, string } from 'prop-types'

import SearchResultTable from '../SearchResultTable'
import { gradeFilter } from '../../populationFilters'
import { setPopulationFilter } from '../../redux/populationFilters'

const CoursePopulationCreditDist = ({ singleCourseStats, yearcode, pending, selectedStudents, setPopulationFilterDispatch }) => {
  const [courseGrades, setGrades] = useState([])
  useEffect(() => {
    if (singleCourseStats.statistics) {
      const array = []
      const statistics = singleCourseStats.statistics.find(stats => stats.code === Number(yearcode))
      const grades = statistics ? Object.keys(statistics.students.grades) : []
      grades.forEach((grade) => {
        const filteredGrades = intersection(selectedStudents, statistics.students.grades[grade])
        if (Number(grade) || grade === '0') {
          array.push({ grade: Number(grade), amount: filteredGrades.length })
        } else {
          array.push({ grade, amount: filteredGrades.length })
        }
      })
      setGrades(array)
    }
  }, [pending, selectedStudents])
  const setFilter = (row) => {
    setPopulationFilterDispatch(gradeFilter({ grade: row[0], coursecodes: singleCourseStats.alternatives, coursename: singleCourseStats.name }))
  }
  const sortedCourseGrades = courseGrades.sort((a, b) => ((typeof Number(b.grade) === 'number') - (typeof Number(a.grade) === 'number')) || (b.grade > a.grade ? 1 : -1))
  const rows = sortedCourseGrades.map(g => [`${g.grade}`, g.amount, <Progress style={{ margin: '0px' }} percent={Math.round((g.amount / selectedStudents.length) * 100)} progress />])
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

CoursePopulationCreditDist.propTypes = {
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
})(CoursePopulationCreditDist)
