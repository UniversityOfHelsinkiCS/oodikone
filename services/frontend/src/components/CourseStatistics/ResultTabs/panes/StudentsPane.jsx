import React from 'react'
import { StudentsTable } from './tables/StudentsTable'
import { Pane } from './Pane'

export const StudentsPane = ({ availableStats, datasets, separate, userHasAccessToAllStats, updateQuery }) => {
  return (
    <Pane
      availableStats={availableStats}
      datasets={datasets}
      initialSettings={{ viewMode: 'STUDENTS', separate, splitDirection: 'row' }}
      tableComponent={StudentsTable}
      userHasAccessToAllStats={userHasAccessToAllStats}
      updateQuery={updateQuery}
    />
  )
}
