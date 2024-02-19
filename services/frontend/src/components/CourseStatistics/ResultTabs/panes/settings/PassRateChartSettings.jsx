import React from 'react'
import { Radio, Segment, SegmentGroup } from 'semantic-ui-react'
import { HelpButton } from './common/HelpButton'
import { Setting } from './common/Setting'

export const PassRateChartSettings = ({ onChange, value }) => {
  const { viewMode, isRelative } = value

  return (
    <div style={{ alignItems: 'center', display: 'flex', marginTop: '20px' }}>
      <SegmentGroup horizontal>
        <Segment>
          <Setting labelText="Show relative">
            <Radio toggle checked={isRelative} onChange={() => onChange({ ...value, isRelative: !isRelative })} />
          </Setting>
        </Segment>
      </SegmentGroup>
      <HelpButton tab="PassRate" viewMode={viewMode || 'STUDENTS'} />
    </div>
  )
}
