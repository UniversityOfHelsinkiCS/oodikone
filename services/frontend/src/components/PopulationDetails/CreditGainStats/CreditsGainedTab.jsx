import React, { useState } from 'react'
import { Divider, Icon, Grid } from 'semantic-ui-react'

import { CreditsGainedTable } from './CreditsGainedTable'

const admissionTypes = [
  'Todistusvalinta',
  'Valintakoe',
  'Yhteispisteet',
  'Avoin väylä',
  'Kilpailumenestys',
  'Muu',
  null,
]

export const CreditsGainedTab = ({ allStudents, query, creditDateFilterOptions, programmeGoalTime }) => {
  const [show, setShow] = useState(false)
  if (!allStudents || !allStudents.length || !query) return null

  const { studyRights, year } = query

  const filterFunction = (student, type) => {
    const fixedType = type === 'Valintakoe' ? 'Koepisteet' : type
    return student.studyrights.some(
      studyright =>
        studyright.studyright_elements.some(element => element.code === studyRights?.programme) &&
        fixedType === studyright.admission_type
    )
  }

  const getCreditsGainedTable = type => {
    const filteredStudents = allStudents.filter(s => filterFunction(s, type))
    return (
      <CreditsGainedTable
        creditDateFilterOptions={creditDateFilterOptions}
        filteredStudents={filteredStudents}
        key={`creditsgainedtable-admissiontype-${type}`}
        programmeGoalTime={programmeGoalTime}
        type={type || 'Ei valintatapaa'}
        year={year}
      />
    )
  }

  const admissionTypesAvailable = !allStudents.every(s => filterFunction(s, null))

  return (
    <Grid>
      <Grid.Row>
        <Grid.Column data-cy="credits-gained-main-table" width={16}>
          <CreditsGainedTable
            creditDateFilterOptions={creditDateFilterOptions}
            filteredStudents={allStudents}
            programmeGoalTime={programmeGoalTime}
            type="All students of the class"
            year={year}
          />
        </Grid.Column>
      </Grid.Row>
      {admissionTypesAvailable && (
        <Divider
          className="credits-gained-divider"
          horizontal
          onClick={() => setShow(!show)}
          style={{ cursor: 'pointer', marginBottom: !show && '50px' }}
        >
          By admission type <Icon name={`angle ${show ? 'down' : 'right'}`} />
        </Divider>
      )}
      {show && <Grid.Row>{admissionTypes.map(type => getCreditsGainedTable(type))}</Grid.Row>}
    </Grid>
  )
}
