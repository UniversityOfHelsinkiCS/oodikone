import React from 'react'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { Icon, Accordion, Button, Table } from 'semantic-ui-react'
import { differenceBy } from 'lodash'
import { bool, func, number, arrayOf, shape, string } from 'prop-types'
import { getCustomPopulation } from '../../../redux/populations'
import { getCustomPopulationCoursesByStudentnumbers } from '../../../redux/populationCourses'

const YearAccordion = ({ active, handleClick, index, years, students }) => {
  const history = useHistory()
  const dispatch = useDispatch()
  const enrolledStudents = students.filter(s => s.enrolled)
  const nonEnrolledStudents = differenceBy(students, enrolledStudents, 'studentNumber')

  const handlePopulationClick = students => {
    const studentnumberlist = Object.values(students).map(s => s.studentNumber)
    history.push('/custompopulation')
    dispatch(getCustomPopulation({ studentnumberlist }))
    dispatch(getCustomPopulationCoursesByStudentnumbers({ studentnumberlist }))
  }

  const renderRow = (title, students) => {
    const onClick = () => handlePopulationClick(students)
    return (
      <Table.Row>
        <Table.Cell>
          <b>{title}</b>
        </Table.Cell>
        <Table.Cell>{students.length}</Table.Cell>
        <Table.Cell>
          <Button size="tiny" onClick={onClick}>
            Show custom population
          </Button>
        </Table.Cell>
      </Table.Row>
    )
  }

  return (
    <Accordion fluid styled>
      <Accordion.Title index={index} active={active} onClick={handleClick}>
        <Icon name="dropdown" />
        {years} ({students.length})
      </Accordion.Title>
      <Accordion.Content active={active}>
        <Table collapsing>
          <Table.Header>
            <Table.HeaderCell>Enrolled</Table.HeaderCell>
            <Table.HeaderCell>Total</Table.HeaderCell>
            <Table.HeaderCell></Table.HeaderCell>
          </Table.Header>
          {renderRow('Yes', enrolledStudents)}
          {renderRow('No', nonEnrolledStudents)}
          {renderRow('Any', students)}
        </Table>
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
