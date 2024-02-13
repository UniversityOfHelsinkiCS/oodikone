import React, { useState } from 'react'
import { GradeDistributionChart } from './charts/GradeDistributionChart'
import { GradeDistributionChartSettings } from './settings/GradeDistributionChartSettings'
import { DirectionToggle } from './common/DirectionToggle'
import { PaneContent } from './common/PaneContent'

export const GradeDistributionPane = ({ datasets, userHasAccessToAllStats }) => {
  const [isRelative, setIsRelative] = useState(false)
  const [splitDirection, setSplitDirection] = useState('row')

  const halfWidth = datasets.filter(dataset => dataset).length > 1 && splitDirection === 'row'

  return (
    <PaneContent>
      <div style={{ display: 'flex', marginBottom: '2em' }}>
        <GradeDistributionChartSettings isRelative={isRelative} setIsRelative={setIsRelative} />
        <div style={{ flexGrow: 1 }} />
        <DirectionToggle datasets={datasets} setSplitDirection={setSplitDirection} splitDirection={splitDirection} />
      </div>
      <div style={{ display: 'flex', flexDirection: splitDirection, gap: '2em' }}>
        {datasets
          .filter(i => i)
          .map(data => (
            <div key={data.name} style={{ flexGrow: 1, flexBasis: 1, maxWidth: halfWidth ? '50%' : '100%' }}>
              <h3>{data.name}</h3>
              <GradeDistributionChart
                data={data}
                isRelative={isRelative}
                userHasAccessToAllStats={userHasAccessToAllStats}
              />
            </div>
          ))}
      </div>
    </PaneContent>
  )
}
