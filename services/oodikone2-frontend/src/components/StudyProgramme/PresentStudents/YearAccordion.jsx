import React from 'react'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { Icon, Accordion, Button } from 'semantic-ui-react'
import { differenceBy } from 'lodash'
import { bool, func, number, arrayOf, shape, string } from 'prop-types'
import { getCustomPopulation } from '../../../redux/populations'

const YearAccordion = ({ active, handleClick, index, years, students }) => {
  const history = useHistory()
  const dispatch = useDispatch()
  const enrolledStudents = students.filter(s => s.enrolled)
  const nonEnrolledStudents = differenceBy(students, enrolledStudents, 'studentNumber')

  const handlePopulationClick = students => {
    history.push('/custompopulation')
    dispatch(getCustomPopulation({ studentnumberlist: Object.values(students).map(s => s.studentNumber) }))
  }

  const renderTotal = (title, students) => {
    const onClick = () => handlePopulationClick(students)
    return (
      <div style={{ margin: '10px 0 10px 0' }}>
        <b>{title}:</b> {students.length}
        <Button style={{ marginLeft: '10px' }} size="tiny" onClick={onClick}>
          Show custom population
        </Button>
      </div>
    )
  }

  return (
    <Accordion fluid styled>
      <Accordion.Title index={index} active={active} onClick={handleClick}>
        <Icon name="dropdown" />
        {years} ({students.length})
      </Accordion.Title>
      <Accordion.Content active={active}>
        {renderTotal('Total students', students)}
        {renderTotal('Enrolled students', enrolledStudents)}
        {renderTotal('Non-enrolled students', nonEnrolledStudents)}
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
