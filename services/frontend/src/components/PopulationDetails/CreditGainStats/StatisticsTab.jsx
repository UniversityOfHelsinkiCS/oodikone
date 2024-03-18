import React from 'react'
import { Divider, Grid } from 'semantic-ui-react'

import { StatisticsTable } from './StatisticsTable'

const admissionTypes = [
  'Todistusvalinta',
  'Valintakoe',
  'Yhteispisteet',
  'Avoin väylä',
  'Kilpailumenestys',
  'Muu',
  null,
]

export const StatisticsTab = ({ allStudents, query }) => {
  if (!allStudents || !allStudents.length || !query) return null

  const { studyRights } = query

  const filterFunction = (student, type) =>
    student.studyrights.some(
      studyright =>
        studyright.studyright_elements.some(element => element.code === studyRights?.programme) &&
        type === studyright.admission_type
    )

  const getStatisticsTable = type => {
    const filteredStudents = allStudents.filter(s => filterFunction(s, type !== 'Valintakoe' ? type : 'Koepisteet'))
    return (
      <StatisticsTable
        filteredStudents={filteredStudents}
        key={`admissiontype-${type}`}
        type={type || 'Ei valintatapaa'}
      />
    )
  }

  const admissionTypesAvailable = !allStudents.every(s => filterFunction(s, null))

  return (
    <Grid centered padded>
      <Grid.Row>
        <StatisticsTable filteredStudents={allStudents} type="All students of the population" />
      </Grid.Row>
      {admissionTypesAvailable && (
        <>
          <Divider horizontal>By admission type</Divider>
          <Grid.Row>{admissionTypes.map(type => getStatisticsTable(type))}</Grid.Row>
        </>
      )}
    </Grid>
  )
}
