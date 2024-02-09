import React, { useState } from 'react'
import { PassRateChart } from './Charts/passRate'
import { AttemptsTable } from './Tables/attempts'
import { AttemptsTableSettings } from './Settings/attempts'
import { PassRateSettings } from './Settings/passRate'
import { DirectionToggle } from './DirectionToggle'
import { PaneContent } from './PaneContent'

export const AttemptsPane = ({ availableStats, datasets, separate, userHasAccessToAllStats, updateQuery }) => {
  const [settings, setSettings] = useState({ viewMode: 'ATTEMPTS', separate })
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
        <AttemptsTableSettings
          value={settings}
          onChange={setSettings}
          onSeparateChange={toggleSeparate}
          availableStats={availableStats}
        />
        <div style={{ flexGrow: 1 }} />
        <DirectionToggle datasets={datasets} setSplitDirection={setSplitDirection} splitDirection={splitDirection} />
      </div>
      <div style={styleContainer}>
        {datasets
          .filter(i => i)
          .map(data => (
            <div key={data.name} style={styleData}>
              <AttemptsTable data={data} settings={settings} userHasAccessToAllStats={userHasAccessToAllStats} />
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
