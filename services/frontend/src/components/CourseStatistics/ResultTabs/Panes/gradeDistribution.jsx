import React, { useState } from 'react'
import { Icon, Menu } from 'semantic-ui-react'
import { GradeDistributionChart } from './Charts/gradeDistribution'
import { GradeDistributionSettings } from './Settings/gradeDistribution'
import { PaneContent } from './PaneContent'

export const GradeDistributionPane = ({ datasets, userHasAccessToAllStats }) => {
  const [isRelative, setIsRelative] = useState(false)
  const [splitDirection, setSplitDirection] = useState('row')

  return (
    <PaneContent>
      <div style={{ display: 'flex', marginBottom: '2em' }}>
        <GradeDistributionSettings isRelative={isRelative} setIsRelative={setIsRelative} />
        <div style={{ flexGrow: 1 }} />
        {datasets.filter(i => i).length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1em' }}>
            <label>Split direction: </label>
            <Menu style={{ margin: 0 }}>
              <Menu.Item active={splitDirection === 'row'} onClick={() => setSplitDirection('row')}>
                <Icon name="arrows alternate horizontal" />
              </Menu.Item>
              <Menu.Item active={splitDirection === 'column'} onClick={() => setSplitDirection('column')}>
                <Icon name="arrows alternate vertical" />
              </Menu.Item>
            </Menu>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: splitDirection, gap: '2em' }}>
        {datasets
          .filter(i => i)
          .map(data => (
            <div key={data.name} style={{ flexGrow: 1, flexBasis: 1, width: '100%' }}>
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
