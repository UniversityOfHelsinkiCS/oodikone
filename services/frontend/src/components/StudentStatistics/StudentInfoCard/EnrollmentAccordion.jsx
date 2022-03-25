import React, { useState } from 'react'
import { Icon, Accordion, Table } from 'semantic-ui-react'
import { array } from 'prop-types'
import _ from 'lodash'

import './studentInfoCard.css'

const enrolmentTypes = {
  1: 'Present',
  2: 'Absent',
  3: 'Passive',
}

const getEnrollmentStatus = (semester, season) => {
  if (semester.name.en.includes('Spring') && season === 'SPRING') {
    return enrolmentTypes[semester.enrollmenttype]
  }
  if (semester.name.en.includes('Autumn') && season === 'FALL') {
    return enrolmentTypes[semester.enrollmenttype]
  }
  return 'Absent'
}

const EnrollmentAccordion = ({ semesterEnrollments }) => {
  const [active, setActive] = useState(false)

  const handleAccordionClick = () => {
    setActive(!active)
  }

  const groupedEnrollments = _.groupBy(semesterEnrollments, 'yearname')

  const sortedKeys = Object.keys(groupedEnrollments).sort((a, b) => {
    return groupedEnrollments[b][0].semestercode - groupedEnrollments[a][0].semestercode
  })

  return (
    <div className={active ? 'enrollmentAccordion' : ''}>
      <Accordion>
        <Accordion.Title active={active} onClick={handleAccordionClick}>
          <Icon name="dropdown" />
          Enrollments
        </Accordion.Title>
        <Accordion.Content active={active}>
          <Table celled>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Semester</Table.HeaderCell>
                <Table.HeaderCell>Autumn</Table.HeaderCell>
                <Table.HeaderCell>Spring</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {sortedKeys.map(key => {
                const semester = groupedEnrollments[key]
                const date = new Date()
                return semester[0].startYear <= date.getFullYear() ? (
                  <Table.Row key={key}>
                    <Table.Cell>{key}</Table.Cell>

                    <Table.Cell>{getEnrollmentStatus(semester[0], 'FALL')}</Table.Cell>

                    <Table.Cell>
                      {semester.length > 1
                        ? getEnrollmentStatus(semester[1], 'SPRING')
                        : getEnrollmentStatus(semester[0], 'SPRING')}
                    </Table.Cell>
                  </Table.Row>
                ) : null
              })}
            </Table.Body>
          </Table>
        </Accordion.Content>
      </Accordion>
    </div>
  )
}

EnrollmentAccordion.propTypes = {
  semesterEnrollments: array.isRequired,
}

export default EnrollmentAccordion
