import React from 'react'
import { Icon, Accordion } from 'semantic-ui-react'
import { differenceBy } from 'lodash'
import { bool, func, number, arrayOf, shape, string } from 'prop-types'

const YearAccordion = ({ active, handleClick, index, years, students }) => {
  const enrolledStudents = students.filter(s => s.enrolled)
  const nonEnrolledStudents = differenceBy(students, enrolledStudents, 'studentNumber')

  return (
    <Accordion fluid styled>
      <Accordion.Title index={index} active={active} onClick={handleClick}>
        <Icon name="dropdown" />
        {years} ({students.length})
      </Accordion.Title>
      <Accordion.Content active={active}>
        <p>
          <b>Total students:</b> {students.length}
        </p>
        <p>
          <b>Enrolled students:</b> {enrolledStudents.length}
        </p>
        <p>
          <b>Non-enrolled students:</b> {nonEnrolledStudents.length}
        </p>
      </Accordion.Content>
    </Accordion>
  )
}

YearAccordion.propTypes = {
  active: bool.isRequired,
  handleClick: func.isRequired,
  index: number.isRequired,
  years: string.isRequired,
  students: arrayOf(shape({})).isRequired
}

export default YearAccordion
