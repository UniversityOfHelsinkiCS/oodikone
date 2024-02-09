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
  const styleContainer = { display: 'flex', flexDirection: splitDirection, justifyContent: 'space-between' }
  const styleData = { flexGrow: 1, flexBasis: 1, maxWidth: halfWidth ? '49%' : '100%' }

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
      <div style={styleContainer}>
        {datasets
          .filter(i => i)
          .map(data => (
            <div key={data.name} style={styleData}>
              <StudentsTable data={data} settings={settings} userHasAccessToAllStats={userHasAccessToAllStats} />
            </div>
          ))}
      </div>
      <PassRateSettings onChange={setSettings} value={settings} />
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
