import React from 'react'
import { Icon, Menu } from 'semantic-ui-react'

export const DirectionToggle = ({ datasets, setSplitDirection, splitDirection }) => {
  if (datasets.filter(dataset => dataset).length <= 1) return null

  return (
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
  )
}
