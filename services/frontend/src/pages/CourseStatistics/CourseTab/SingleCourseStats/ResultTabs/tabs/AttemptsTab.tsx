import { Tab } from './Tab'
import { AttemptsTable } from './tables/AttemptsTable'

export const AttemptsTab = ({ availableStats, datasets, loading, separate, userHasAccessToAllStats, updateQuery }) => {
  return (
    <Tab
      availableStats={availableStats}
      datasets={datasets}
      initialSettings={{ viewMode: 'ATTEMPTS', separate, splitDirection: 'row' }}
      loading={loading}
      tableComponent={AttemptsTable}
      updateQuery={updateQuery}
      userHasAccessToAllStats={userHasAccessToAllStats}
    />
  )
}
