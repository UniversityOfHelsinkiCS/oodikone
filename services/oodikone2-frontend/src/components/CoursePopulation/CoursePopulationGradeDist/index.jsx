import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { Progress } from 'semantic-ui-react'
import { intersection, orderBy } from 'lodash'
import { shape, bool, arrayOf, string, number } from 'prop-types'
import SearchResultTable from '../../SearchResultTable'
import { getHighestGradeOfCourseBetweenRange } from '../../../common'

const CoursePopulationCreditDist = ({ singleCourseStats, pending, selectedStudents, samples, codes, from, to }) => {
  const [courseGrades, setGrades] = useState([])
  useEffect(() => {
    if (samples && singleCourseStats.alternatives) {
      const filteredGradeArray = []

      const grades = {}
      samples.forEach(student => {
        const courses = student.courses.filter(c => codes.includes(c.course_code))
        const highestGrade = getHighestGradeOfCourseBetweenRange(courses, from, to)
        if (highestGrade) {
          if (!grades[highestGrade.grade]) {
            grades[highestGrade.grade] = []
          }
          grades[highestGrade.grade].push(student.studentNumber)
        }
      })
      Object.keys(grades).forEach(grade => {
        const filteredGrades = intersection(selectedStudents, grades[grade])
        filteredGradeArray.push({ grade, amount: filteredGrades.length })
      })
      setGrades(filteredGradeArray)
    }
  }, [pending, selectedStudents])

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

  return <SearchResultTable headers={headers} rows={rows} selectable noResultText="no data available" />
}

CoursePopulationCreditDist.propTypes = {
  singleCourseStats: shape({}).isRequired,
  pending: bool.isRequired,
  selectedStudents: arrayOf(string).isRequired,
  samples: arrayOf(shape({})).isRequired,
  codes: arrayOf(string).isRequired,
  from: number.isRequired,
  to: number.isRequired
}

const mapStateToProps = ({ singleCourseStats }) => ({
  singleCourseStats: singleCourseStats.stats,
  pending: singleCourseStats.pending
})

export default connect(mapStateToProps)(CoursePopulationCreditDist)
