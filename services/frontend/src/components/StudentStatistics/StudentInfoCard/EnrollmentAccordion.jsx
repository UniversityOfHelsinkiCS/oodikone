import React, { useState } from 'react'
import { Icon, Accordion } from 'semantic-ui-react'
import { array, func } from 'prop-types'

import './studentInfoCard.css'

const EnrollmentAccordion = ({ semesterEnrollments }) => {
  const [active, setActive] = useState(false)

  const handleAccordionClick = () => {
    setActive(!active)
  }

  const sortedEnrollments = semesterEnrollments.sort((a, b) => b.semestercode - a.semestercode)

  return (
    <div className={active ? 'enrollmentAccordion' : ''}>
      <Accordion>
        <Accordion.Title active={active} onClick={handleAccordionClick}>
          <Icon name="dropdown" />
          Enrollments
        </Accordion.Title>
        <Accordion.Content active={active}>
          {sortedEnrollments.map(enrollment => (
            <p key={enrollment.semestercode} className="enrollmentRow">{`${enrollment.name.en} - ${
              enrollment.enrollmenttype === 1 ? 'Present' : 'Absent'
            }`}</p>
          ))}
        </Accordion.Content>
      </Accordion>
    </div>
  )
}

EnrollmentAccordion.propTypes = {
  semesterEnrollments: array.isRequired,
  sort: func.isRequired,
}

export default EnrollmentAccordion
