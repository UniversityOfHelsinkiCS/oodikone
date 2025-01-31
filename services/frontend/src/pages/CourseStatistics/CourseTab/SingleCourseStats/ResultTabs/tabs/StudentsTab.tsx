import { Tab } from './Tab'
import { StudentsTable } from './tables/StudentsTable'

export const StudentsTab = ({ availableStats, datasets, loading, separate, userHasAccessToAllStats, updateQuery }) => {
  return (
    <Tab
      availableStats={availableStats}
      datasets={datasets}
      initialSettings={{ viewMode: 'STUDENTS', separate, splitDirection: 'row' }}
      loading={loading}
      tableComponent={StudentsTable}
      updateQuery={updateQuery}
      userHasAccessToAllStats={userHasAccessToAllStats}
    />
  )
}
