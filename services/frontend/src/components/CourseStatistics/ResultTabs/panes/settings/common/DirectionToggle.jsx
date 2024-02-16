import React from 'react'
import { Icon, Menu } from 'semantic-ui-react'

export const DirectionToggle = ({ setSplitDirection, splitDirection }) => {
  return (
    <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', gap: '1em' }}>
      <label>Split direction</label>
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
