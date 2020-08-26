import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { Progress, Table } from 'semantic-ui-react'
import { intersection, orderBy } from 'lodash'
import { shape, bool, arrayOf, string, number } from 'prop-types'
import { getHighestGradeOfCourseBetweenRange } from '../../../common'
import useGradeFilter from '../../FilterTray/filters/Grade/useGradeFilter'
import ExternalGradeFilterToggle from './ExternalGradeFilterToggle'

const CoursePopulationCreditDist = ({ singleCourseStats, pending, selectedStudents, samples, codes, from, to }) => {
  const [courseGrades, setCourseGrades] = useState([])
  const { setGrades } = useGradeFilter()

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

      setCourseGrades(filteredGradeArray)
      setGrades(grades)
    }
  }, [pending, selectedStudents])

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

  return (
    <Table celled>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell collapsing></Table.HeaderCell>
          <Table.HeaderCell>Grades</Table.HeaderCell>
          <Table.HeaderCell>
            Number of Students
            <br />
            <span style={{ fontWeight: 100 }}>(n={selectedStudents.length})</span>
          </Table.HeaderCell>
          <Table.HeaderCell>Percentage of Population</Table.HeaderCell>
        </Table.Row>
      </Table.Header>

      <Table.Body>
        {sortedCourseGrades.map(grade => (
          <Table.Row key={`grade-table-row-${grade.grade}`}>
            <Table.Cell collapsing>
              <ExternalGradeFilterToggle grade={grade.grade} />
            </Table.Cell>
            <Table.Cell>{grade.grade}</Table.Cell>
            <Table.Cell>{grade.amount}</Table.Cell>
            <Table.Cell>
              {selectedStudents.length && (
                <Progress
                  percent={Math.round((grade.amount / selectedStudents.length) * 100)}
                  progress
                  style={{ margin: 0 }}
                />
              )}
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  )
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
