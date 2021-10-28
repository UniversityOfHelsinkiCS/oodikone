import React from 'react'
import { Divider, Grid, Label } from 'semantic-ui-react'

import StatisticsTable from './StatisticsTable'

const admissionTypes = [
  'Todistusvalinta',
  'Koepisteet',
  'Yhteispisteet',
  'Avoin väylä',
  'Kilpailumenestys',
  'Muu',
  null,
]

const StatisticsTab = ({ allStudents, query }) => {
  if (!allStudents || !allStudents.length || !query) return null

  const { studyRights } = query

  const filterFunction = (student, type) =>
    student.studyrights.some(
      sr => sr.studyright_elements.some(e => e.code === studyRights?.programme) && type === sr.admission_type
    )

  const getStatisticsTable = type => {
    const filteredStudents = allStudents.filter(s => filterFunction(s, type))
    return <StatisticsTable type={type || 'Ei valintatapaa'} filteredStudents={filteredStudents} />
  }

  const admissionTypesAvailable = !allStudents.every(s => filterFunction(s, null))

  return (
    <Grid padded centered>
      <Grid.Row>
        <StatisticsTable type="All students of the population" filteredStudents={allStudents} />
      </Grid.Row>
      {admissionTypesAvailable && (
        <>
          <Divider horizontal>
            By admission type
            <Label style={{ marginLeft: '1rem', marginBottom: '0.5rem' }} color="red">
              NEW!
            </Label>
          </Divider>
          <Grid.Row>{admissionTypes.map(type => getStatisticsTable(type))}</Grid.Row>
        </>
      )}
    </Grid>
  )
}

export default StatisticsTab
