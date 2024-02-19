import React, { useState } from 'react'
import { PassRateChart } from '../charts/PassRateChart'
import { PassRateChartSettings } from '../settings/PassRateChartSettings'
import { TableSettings } from '../settings/TableSettings'
import { PaneContent } from './PaneContent'

/**
 * A generalized pane component that is used on the Students and the Attempts tabs.
 * Contains settings and table for the corresponding tab and the pass rate chart.
 *
 * @param tableComponent Should be either StudentsTable or AttemptsTable
 */
export const Pane = ({
  availableStats,
  datasets,
  initialSettings,
  tableComponent: Table,
  userHasAccessToAllStats,
  updateQuery,
}) => {
  const [settings, setSettings] = useState(initialSettings)

  const setSplitDirection = splitDirection => {
    setSettings({ ...settings, splitDirection })
  }

  const toggleSeparate = separate => {
    setSettings({ ...settings, separate })
    updateQuery(separate)
  }

  const halfWidth = datasets.filter(dataset => dataset).length > 1 && settings.splitDirection === 'row'
  const styleContainer = { display: 'flex', flexDirection: settings.splitDirection, justifyContent: 'space-between' }
  const styleData = { flexGrow: 1, flexBasis: 1, maxWidth: halfWidth ? '49%' : '100%' }

  return (
    <PaneContent>
      <div style={{ marginBottom: '1em' }}>
        <TableSettings
          availableStats={availableStats}
          datasets={datasets}
          onChange={setSettings}
          onSeparateChange={toggleSeparate}
          setSplitDirection={setSplitDirection}
          value={settings}
        />
      </div>
      <div style={styleContainer}>
        {datasets
          .filter(i => i)
          .map(data => (
            <div key={data.name} style={styleData}>
              <Table data={data} settings={settings} userHasAccessToAllStats={userHasAccessToAllStats} />
            </div>
          ))}
      </div>
      <PassRateChartSettings onChange={setSettings} value={settings} />
      <div style={styleContainer}>
        {datasets
          .filter(i => i)
          .map(data => (
            <div key={data.name} style={styleData}>
              <PassRateChart data={data} settings={settings} userHasAccessToAllStats={userHasAccessToAllStats} />
            </div>
          ))}
      </div>
    </PaneContent>
  )
}
