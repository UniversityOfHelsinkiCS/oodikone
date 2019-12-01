import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { shape, arrayOf, string, number } from 'prop-types'
import { Table, Segment, Header } from 'semantic-ui-react'
import { maxBy, sortBy } from 'lodash'
import { getActiveLanguage } from 'react-localize-redux'

import { getNewestProgramme, getTextIn } from '../../common'

const CoursePopulationProgrammeCredits = ({
  samples,
  selectedStudents,
  codes,
  from,
  to,
  studentToTargetCourseDateMap,
  populationStatistics,
  language
}) => {
  const [programmeCreditsStatistics, setStatistics] = useState({})
  const [totalCredits, setTotalCredits] = useState(0)
  useEffect(() => {
    if (samples && selectedStudents) {
      const programmeCredits = {}
      let tempTotal = 0
      const filteredStudents = samples.filter(student => selectedStudents.includes(student.studentNumber))
      filteredStudents.forEach(student => {
        const courses = student.courses.filter(c => codes.includes(c.course_code))
        const programme = getNewestProgramme(
          student.studyrights,
          student.studentNumber,
          studentToTargetCourseDateMap,
          populationStatistics.elementdetails.data
        )
        if (!programmeCredits[programme.code]) {
          programmeCredits[programme.code] = { name: programme.name, students: [], credits: 0 }
        }
        programmeCredits[programme.code].students.push(student.studentNumber)
        const coursesBetween = []
        courses.forEach(course => {
          if (
            new Date(from).getTime() <= new Date(course.date).getTime() &&
            new Date(course.date).getTime() <= new Date(to).getTime() &&
            course.passed
          ) {
            if (course.grade === 'Hyv.') {
              coursesBetween.push({ grade: course.grade, value: 1, credits: course.credits })
            } else if (!Number(course.grade)) {
              coursesBetween.push({ grade: course.grade, value: 0, credits: course.credits })
            } else {
              coursesBetween.push({ grade: course.grade, value: Number(course.grade), credits: course.credits })
            }
          }
        })
        if (maxBy(coursesBetween, course => course.value)) {
          programmeCredits[programme.code].credits += maxBy(coursesBetween, course => course.value).credits
          tempTotal += maxBy(coursesBetween, course => course.value).credits
        }
      })
      setTotalCredits(tempTotal)
      setStatistics(programmeCredits)
    }
  }, [selectedStudents])

  const tableRows = Object.keys(programmeCreditsStatistics).map(programmeCode => (
    <Table.Row key={programmeCode} value={programmeCreditsStatistics[programmeCode].students.length}>
      <Table.Cell>{getTextIn(programmeCreditsStatistics[programmeCode].name, language)}</Table.Cell>
      <Table.Cell>{programmeCreditsStatistics[programmeCode].students.length}</Table.Cell>
      <Table.Cell>{programmeCreditsStatistics[programmeCode].credits}</Table.Cell>
    </Table.Row>
  ))

  const sortedTableRows = sortBy(tableRows, row => row.props.value).reverse()

  return (
    <Segment>
      <Header>Programme credit gains</Header>
      <Table>
        <Table.Header style={{ backgroundColor: 'whitesmoke' }}>
          <Table.Row>
            <Table.Cell>Programme</Table.Cell>
            <Table.Cell>Amount of students</Table.Cell>
            <Table.Cell>Amount of credits</Table.Cell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {sortedTableRows}
          <Table.Row style={{ backgroundColor: 'ghostwhite' }}>
            <Table.Cell>Total</Table.Cell>
            <Table.Cell>{selectedStudents.length}</Table.Cell>
            <Table.Cell>{totalCredits}</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    </Segment>
  )
}

CoursePopulationProgrammeCredits.defaultProps = {
  studentToTargetCourseDateMap: null
}

CoursePopulationProgrammeCredits.propTypes = {
  selectedStudents: arrayOf(string).isRequired,
  samples: arrayOf(shape({})).isRequired,
  codes: arrayOf(string).isRequired,
  from: number.isRequired,
  to: number.isRequired,
  studentToTargetCourseDateMap: shape({}),
  language: string.isRequired,
  populationStatistics: shape({}).isRequired
}

const mapStateToProps = ({ populations, localize }) => {
  return {
    populationStatistics: populations.data,
    language: getActiveLanguage(localize).code
  }
}

export default connect(
  mapStateToProps,
  null
)(CoursePopulationProgrammeCredits)
