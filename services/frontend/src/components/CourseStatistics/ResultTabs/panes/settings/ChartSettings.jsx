import React from 'react'
import { Radio, Segment, SegmentGroup } from 'semantic-ui-react'

import { courseStatisticsToolTips } from '@/common/InfoToolTips'
import { InfoBox } from '@/components/Info/InfoBox'
import { Setting } from './common/Setting'

export const ChartSettings = ({ isRelative, setIsRelative, tab, viewMode }) => {
  return (
    <div style={{ alignItems: 'center', display: 'flex', marginTop: '20px' }}>
      <SegmentGroup horizontal>
        <Segment>
          <Setting labelText="Show relative">
            <Radio checked={isRelative} onChange={() => setIsRelative(!isRelative)} toggle />
          </Setting>
        </Segment>
      </SegmentGroup>
      <div style={{ marginLeft: '20px' }}>
        {tab === 'GradeDistribution' ? (
          <InfoBox content={courseStatisticsToolTips.GradeDistribution} popup />
        ) : (
          <InfoBox content={courseStatisticsToolTips.PassRate[viewMode]} popup />
        )}
      </div>
    </div>
  )
}
