import React from 'react'
import { Radio, Segment, SegmentGroup } from 'semantic-ui-react'
import { DirectionToggle } from './common/DirectionToggle'
import { HelpButton } from './common/HelpButton'
import { ProviderOrganization } from './common/ProviderOrganization'
import { Setting } from './common/Setting'

export const AttemptsTableSettings = ({
  availableStats,
  datasets,
  onChange,
  onSeparateChange,
  setSplitDirection,
  value,
}) => {
  const { showGrades, separate, splitDirection } = value

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
        {settings.map(element => (
          <Segment key={element.key}>{element}</Segment>
        ))}
      </SegmentGroup>
      <HelpButton tab="Tables" viewMode="ATTEMPTS" />
    </div>
  )
}
