import React, { useState } from 'react'
import { Divider, Icon, Grid } from 'semantic-ui-react'

import CreditsGainedTable from './CreditsGainedTable'

const admissionTypes = [
  'Todistusvalinta',
  'Koepisteet',
  'Yhteispisteet',
  'Avoin väylä',
  'Kilpailumenestys',
  'Muu',
  null,
]

const CreditsGainedTab = ({ allStudents, query, creditDateFilterOptions }) => {
  const [show, setShow] = useState(false)
  if (!allStudents || !allStudents.length || !query) return null

  const { studyRights, year } = query

  const filterFunction = (student, type) =>
    student.studyrights.some(
      sr => sr.studyright_elements.some(e => e.code === studyRights?.programme) && type === sr.admission_type
    )

  const getCreditsGainedTable = type => {
    const filteredStudents = allStudents.filter(s => filterFunction(s, type))
    return (
      <CreditsGainedTable
        type={type || 'Ei valintatapaa'}
        filteredStudents={filteredStudents}
        year={year}
        creditDateFilterOptions={creditDateFilterOptions}
      />
    )
  }

  const admissionTypesAvailable = !allStudents.every(s => filterFunction(s, null))

  return (
    <Grid>
      <Grid.Row>
        <Grid.Column width={16} data-cy="credits-gained-main-table">
          <CreditsGainedTable
            type="All students of the class"
            filteredStudents={allStudents}
            year={year}
            creditDateFilterOptions={creditDateFilterOptions}
          />
        </Grid.Column>
      </Grid.Row>
      {admissionTypesAvailable && (
        <Divider
          className="credits-gained-divider"
          horizontal
          style={{ cursor: 'pointer' }}
          onClick={() => setShow(!show)}
        >
          By admission type <Icon name={`angle ${show ? 'down' : 'right'}`} />
        </Divider>
      )}
      {show && <Grid.Row>{admissionTypes.map(type => getCreditsGainedTable(type))}</Grid.Row>}
    </Grid>
  )
}

export default CreditsGainedTab
