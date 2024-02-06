import React from 'react'
import { Menu, Radio } from 'semantic-ui-react'
import { HelpButton } from './HelpButton'

export const PassRateSettings = ({ value, onChange }) => {
  const { viewMode, isRelative } = value

  return (
    <Menu secondary style={{ marginTop: 20, marginBottom: 20 }}>
      <Menu.Item>
        <Radio
          toggle
          label="Show relative"
          checked={isRelative}
          onChange={() => onChange({ ...value, isRelative: !isRelative })}
        />
      </Menu.Item>
      <Menu.Item>
        <HelpButton tab="PassRate" viewMode={viewMode || 'STUDENTS'} />
      </Menu.Item>
    </Menu>
  )
}
