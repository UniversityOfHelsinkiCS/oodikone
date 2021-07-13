import React from 'react'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { Icon, Accordion, Button, Table, Modal } from 'semantic-ui-react'
import { differenceBy } from 'lodash'
import { bool, func, number, arrayOf, shape, string } from 'prop-types'
import { getCustomPopulation } from '../../../redux/populations'
import { getCustomPopulationCoursesByStudentnumbers } from '../../../redux/populationCourses'

const YearAccordion = ({ active, handleClick, index, years, students, bold }) => {
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

    if (students.length > 500) {
      return (
        <Table.Row>
          <Table.Cell>
            <b>{title}</b>
          </Table.Cell>
          <Table.Cell>{students.length}</Table.Cell>
          <Table.Cell>
            <Modal
              trigger={<Button>Show combined population</Button>}
              header={`Are you sure you want to see a population of ${students.length} students?`}
              actions={[
                'Cancel',
                {
                  key: 'fetch',
                  content: 'Show population',
                  positive: true,
                  onClick: () => onClick(),
                },
              ]}
            />
          </Table.Cell>
        </Table.Row>
      )
    }
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
      <Accordion.Title style={{ color: `${bold ? 'black' : ''}` }} index={index} active={active} onClick={handleClick}>
        <Icon name="dropdown" />
        {years} ({students.length})
      </Accordion.Title>
      <Accordion.Content active={active}>
        <Table collapsing>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Enrollment</Table.HeaderCell>
              <Table.HeaderCell>Total</Table.HeaderCell>
              <Table.HeaderCell />
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {renderRow('Attending', enrolledStudents)}
            {renderRow('Non-attending', nonEnrolledStudents)}
            {renderRow('All', students)}
          </Table.Body>
        </Table>
      </Accordion.Content>
    </Accordion>
  )
}

YearAccordion.defaultProps = {
  bold: false,
}

YearAccordion.propTypes = {
  active: bool.isRequired,
  handleClick: func.isRequired,
  index: number.isRequired,
  years: string.isRequired,
  students: arrayOf(shape({})).isRequired,
  bold: bool,
}

export default YearAccordion
