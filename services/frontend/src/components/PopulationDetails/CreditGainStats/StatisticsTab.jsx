import { Divider, Grid } from 'semantic-ui-react'

import { ADMISSION_TYPES } from '@/common'
import { filter as admissionTypeFilter } from '@/components/FilterView/filters/admissionType'
import { StatisticsTable } from './StatisticsTable'

const admissionTypes = Object.values(ADMISSION_TYPES)

export const StatisticsTab = ({ allStudents, query }) => {
  if (!allStudents || !allStudents.length || !query) return null

  const { studyRights } = query

  const getStatisticsTable = type => {
    const filteredStudents = allStudents.filter(admissionTypeFilter(studyRights?.programme)(type))

    return (
      <StatisticsTable
        filteredStudents={filteredStudents}
        key={`admissiontype-${type}`}
        type={type || 'Ei valintatapaa'}
      />
    )
  }

  const admissionTypesAvailable =
    allStudents.length !== allStudents.filter(admissionTypeFilter(studyRights?.programme)(null)).length

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
