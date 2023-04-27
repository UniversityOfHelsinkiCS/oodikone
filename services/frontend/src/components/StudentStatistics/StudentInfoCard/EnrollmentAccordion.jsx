import React, { useState } from 'react'
import { Icon, Accordion, Table, Popup } from 'semantic-ui-react'
import { array } from 'prop-types'
import _ from 'lodash'

import './studentInfoCard.css'

const enrolmentTypes = {
  1: { text: 'Present', className: 'label-present' },
  2: { text: 'Absent', className: 'label-absent' },
  3: { text: 'Inactive', className: 'label-passive' },
  STATUTORY: { text: 'Absent, statutory', className: 'label-absent-statutory' },
}

const helpTexts = {
  1: '',
  2: 'The registration has been done and the student is not attending to the study term.',
  3: 'The registration has not been done and the student is counted as inactive.',
  STATUTORY: 'This absence is statutory e.g. parental leave or military service',
}
const curDate = new Date()

const renderSemester = ({ enrollmenttype, statutoryAbsence }) => {
  const { text, className } = statutoryAbsence ? enrolmentTypes.STATUTORY : enrolmentTypes[enrollmenttype]
  const helpText = helpTexts[enrollmenttype] + (statutoryAbsence ? ` ${helpTexts.STATUTORY}` : '')
  return (
    <div className="enrollment-container">
      {text}
      <div className={`enrollment-label ${className}`}> </div>
      {enrollmenttype > 1 ? (
        <Popup content={helpText} trigger={<Icon className="help-icon" name="question circle outline" />} />
      ) : null}
    </div>
  )
}

const getEnrollmentStatus = (semester, season) => {
  if (semester.name.en.includes('Spring') && season === 'SPRING') {
    return renderSemester(semester)
  }
  if (semester.name.en.includes('Autumn') && season === 'FALL') {
    return renderSemester(semester)
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

  if (curDate < new Date(curDate.getFullYear(), 7, 1)) {
    sortedKeys.shift()
  }

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
                return semester[0].startYear <= curDate.getFullYear() ? (
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
