import React from 'react'
import { Grid } from 'semantic-ui-react'

import StatisticsTable from './StatisticsTable'

const admissionTypes = ['Todistusvalinta', 'Koepisteet', 'Yhteispisteet', 'Avoin väylä', 'Kilpailumenestys', 'Muu']

const StatisticsTab = ({ filteredStudents, query }) => {
  if (!filteredStudents || !filteredStudents.length || !query) return null

  const { studyRights } = query

  const filterFunction = (student, type) =>
    student.studyrights.some(
      sr => sr.studyright_elements.some(e => e.code === studyRights?.programme) && type === sr.admission_type
    )

  return (
    <Grid padded centered>
      <Grid.Row>
        <StatisticsTable type="All students" filteredStudents={filteredStudents} />
      </Grid.Row>
      <Grid.Row>
        {admissionTypes.map(type => (
          <StatisticsTable type={type} filteredStudents={filteredStudents.filter(s => filterFunction(s, type))} />
        ))}
      </Grid.Row>
    </Grid>
  )
}

export default StatisticsTab
