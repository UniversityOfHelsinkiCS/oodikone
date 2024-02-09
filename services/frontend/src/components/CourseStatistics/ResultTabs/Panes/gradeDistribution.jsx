import React, { useState } from 'react'
import { GradeDistributionChart } from './Charts/gradeDistribution'
import { GradeDistributionSettings } from './Settings/gradeDistribution'
import { DirectionToggle } from './DirectionToggle'
import { PaneContent } from './PaneContent'

export const GradeDistributionPane = ({ datasets, userHasAccessToAllStats }) => {
  const [isRelative, setIsRelative] = useState(false)
  const [splitDirection, setSplitDirection] = useState('row')

  const halfWidth = datasets.filter(dataset => dataset).length > 1 && splitDirection === 'row'

  return (
    <PaneContent>
      <div style={{ display: 'flex', marginBottom: '2em' }}>
        <GradeDistributionSettings isRelative={isRelative} setIsRelative={setIsRelative} />
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
