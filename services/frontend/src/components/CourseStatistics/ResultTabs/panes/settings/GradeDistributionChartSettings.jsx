import React from 'react'
import { Menu, Radio } from 'semantic-ui-react'
import { HelpButton } from './common/HelpButton'

export const GradeDistributionChartSettings = ({ isRelative, setIsRelative }) => {
  return (
    <Menu secondary style={{ marginBottom: 0 }}>
      <Menu.Item>
        <Radio toggle label="Show relative" checked={isRelative} onChange={() => setIsRelative(!isRelative)} />
        <Menu.Item>
          <HelpButton tab="GradeDistribution" />
        </Menu.Item>
      </Menu.Item>
    </Menu>
  )
}
