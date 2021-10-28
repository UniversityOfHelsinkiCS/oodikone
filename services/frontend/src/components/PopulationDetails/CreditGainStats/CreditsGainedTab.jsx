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

const CreditsGainedTab = ({ allStudents, query }) => {
  const [show, setShow] = useState(false)
  if (!allStudents || !allStudents.length || !query) return null

  const { studyRights } = query

  const filterFunction = (student, type) =>
    student.studyrights.some(
      sr => sr.studyright_elements.some(e => e.code === studyRights?.programme) && type === sr.admission_type
    )

  const getCreditsGainedTable = type => {
    const filteredStudents = allStudents.filter(s => filterFunction(s, type))
    if (filteredStudents.length === allStudents.length) return null
    return <CreditsGainedTable type={type || 'Ei valintatapaa'} filteredStudents={filteredStudents} />
  }

  return (
    <Grid padded>
      <Grid.Row>
        <Grid.Column width={16}>
          <CreditsGainedTable type="All students of the population" filteredStudents={allStudents} />
        </Grid.Column>
      </Grid.Row>
      <Divider style={{ cursor: 'pointer' }} onClick={() => setShow(!show)} horizontal>
        By admission type <Icon name={`angle ${show ? 'down' : 'right'}`} />
      </Divider>
      {show && <Grid.Row>{admissionTypes.map(type => getCreditsGainedTable(type))}</Grid.Row>}
    </Grid>
  )
}

export default CreditsGainedTab
