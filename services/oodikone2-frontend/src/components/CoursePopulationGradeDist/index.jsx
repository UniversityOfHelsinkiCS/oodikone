import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { Progress } from 'semantic-ui-react'
import { intersection, orderBy } from 'lodash'
import { shape, func, bool, arrayOf, string, number } from 'prop-types'

import SearchResultTable from '../SearchResultTable'
import { gradeFilter } from '../../populationFilters'
import { setPopulationFilter } from '../../redux/populationFilters'

const CoursePopulationCreditDist = ({
  singleCourseStats,
  yearcodes,
  pending,
  selectedStudents,
  setPopulationFilterDispatch
}) => {
  const [courseGrades, setGrades] = useState([])
  useEffect(() => {
    if (singleCourseStats.statistics) {
      const array = []
      const statisticsInRange = singleCourseStats.statistics.filter(stats => yearcodes.includes(stats.code))
      const grades = statisticsInRange.reduce((res, curr) => {
        const currGrades = curr.students.grades
        Object.entries(currGrades).forEach(([grade, students]) => {
          if (!res[grade]) res[grade] = []
          res[grade].push(...students)
        })
        return res
      }, {})

      Object.keys(grades).forEach(grade => {
        const filteredGrades = intersection(selectedStudents, grades[grade])
        array.push({ grade, amount: filteredGrades.length })
      })
      setGrades(array)
    }
  }, [pending, selectedStudents])
  const setFilter = row => {
    setPopulationFilterDispatch(
      gradeFilter({ grade: row[0], coursecodes: singleCourseStats.alternatives, coursename: singleCourseStats.name })
    )
  }

  const totalAmount = courseGrades.reduce((acc, curr) => acc + curr.amount, 0)

  const sortedCourseGrades = orderBy(
    courseGrades,
    e => {
      if (Number(e.grade)) {
        return `_${e.grade}`
      }
      return e.grade
    },
    ['desc']
  )
  const rows = sortedCourseGrades.map(g => [
    `${g.grade}`,
    g.amount,
    <Progress style={{ margin: '0px' }} percent={Math.round((g.amount / totalAmount) * 100)} progress />
  ])
  const headers = ['Grades', `Students (all=${selectedStudents.length})`, 'Percentage of population']

  return (
    <SearchResultTable
      headers={headers}
      rows={rows}
      selectable
      rowClickFn={(e, row) => setFilter(row)}
      noResultText="no data available"
    />
  )
}

CoursePopulationCreditDist.propTypes = {
  singleCourseStats: shape({}).isRequired,
  yearcodes: arrayOf(number).isRequired,
  pending: bool.isRequired,
  selectedStudents: arrayOf(string).isRequired,
  setPopulationFilterDispatch: func.isRequired
}

const mapStateToProps = ({ singleCourseStats, populationFilters }) => ({
  singleCourseStats: singleCourseStats.stats,
  pending: singleCourseStats.pending,
  filters: populationFilters.filters.filter(f => f.type === 'GradeFilter')
})

export default connect(
  mapStateToProps,
  {
    setPopulationFilterDispatch: setPopulationFilter
  }
)(CoursePopulationCreditDist)
