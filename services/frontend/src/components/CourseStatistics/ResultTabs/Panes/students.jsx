import React, { useState } from 'react'
import { PassRateChart } from './Charts/passRate'
import { StudentsTable } from './Tables/students'
import { StudentsTableSettings } from './Settings/students'
import { PassRateSettings } from './Settings/passRate'
import { DirectionToggle } from './DirectionToggle'
import { PaneContent } from './PaneContent'

export const StudentsPane = ({ availableStats, datasets, separate, userHasAccessToAllStats, updateQuery }) => {
  const [settings, setSettings] = useState({ viewMode: 'STUDENTS', showDetails: false, separate })
  const [splitDirection, setSplitDirection] = useState('row')

  const toggleSeparate = separate => {
    setSettings({ ...settings, separate })
    updateQuery(separate)
  }

  const halfWidth = datasets.filter(dataset => dataset).length > 1 && splitDirection === 'row'

  return (
    <PaneContent>
      <div style={{ display: 'flex', marginBottom: '2em' }}>
        <StudentsTableSettings
          availableStats={availableStats}
          onChange={setSettings}
          onSeparateChange={toggleSeparate}
          value={settings}
        />
        <div style={{ flexGrow: 1 }} />
        <DirectionToggle datasets={datasets} setSplitDirection={setSplitDirection} splitDirection={splitDirection} />
      </div>
      <div style={{ display: 'flex', flexDirection: splitDirection, gap: '2em' }}>
        {datasets
          .filter(i => i)
          .map(data => (
            <div
              key={data.name}
              style={{
                flexGrow: 1,
                flexBasis: 1,
                maxWidth: halfWidth ? '50%' : '100%',
              }}
            >
              <h3>{data.name}</h3>
              <StudentsTable data={data} settings={settings} userHasAccessToAllStats={userHasAccessToAllStats} />
            </div>
          ))}
      </div>
      <PassRateSettings onChange={setSettings} value={settings} />
      <div style={{ display: 'flex', flexDirection: splitDirection, gap: '2em' }}>
        {datasets
          .filter(i => i)
          .map(data => (
            <div key={data.name} style={{ flexGrow: 1, flexBasis: 1, maxWidth: halfWidth ? '50%' : '100%' }}>
              <h3>{data.name}</h3>
              <PassRateChart data={data} settings={settings} userHasAccessToAllStats={userHasAccessToAllStats} />
            </div>
          ))}
      </div>
    </PaneContent>
  )
}
