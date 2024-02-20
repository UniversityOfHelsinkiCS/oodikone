import React from 'react'
import { Radio, Segment, SegmentGroup } from 'semantic-ui-react'
import { courseStatisticsToolTips } from 'common/InfoToolTips'
import { InfoBox } from 'components/Info/InfoBox'
import { DirectionToggle } from './common/DirectionToggle'
import { ProviderOrganization } from './common/ProviderOrganization'
import { Setting } from './common/Setting'

export const TableSettings = ({ availableStats, datasets, onChange, onSeparateChange, setSplitDirection, value }) => {
  const { showDetails, showGrades, separate, splitDirection, viewMode } = value

  const settings = [
    <Setting key="gradeToggle" labelText="Show grades">
      <Radio
        checked={showGrades}
        data-cy="gradeToggle"
        onChange={() => onChange({ ...value, showGrades: !showGrades })}
        toggle
      />
    </Setting>,
    <Setting key="separateToggle" labelText="Separate by semesters">
      <Radio checked={separate} data-cy="separateToggle" onChange={() => onSeparateChange(!separate)} toggle />
    </Setting>,
    <Setting key="providerOrganization" labelText="Provider organization(s)">
      <ProviderOrganization availableStats={availableStats} />
    </Setting>,
  ]

  if (viewMode === 'STUDENTS') {
    settings.unshift(
      <Setting key="detailToggle" labelText="Show details">
        <Radio
          checked={showDetails}
          data-cy="detailToggle"
          key="detailToggle"
          onChange={() => onChange({ ...value, showDetails: !showDetails })}
          toggle
        />
      </Setting>
    )
  }

  if (datasets.filter(dataset => dataset).length > 1) {
    settings.push(
      <Setting key="splitDirection" labelText="Split direction">
        <DirectionToggle setSplitDirection={setSplitDirection} splitDirection={splitDirection} />
      </Setting>
    )
  }

  return (
    <div style={{ alignItems: 'center', display: 'flex' }}>
      <SegmentGroup horizontal>
        {settings.map(setting => (
          <Segment key={setting.key}>{setting}</Segment>
        ))}
      </SegmentGroup>
      <div style={{ marginLeft: '20px' }}>
        <InfoBox content={courseStatisticsToolTips.Tables[viewMode]} popup />
      </div>
    </div>
  )
}
