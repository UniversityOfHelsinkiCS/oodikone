import React from 'react'
import { Radio, Segment, SegmentGroup } from 'semantic-ui-react'
import { DirectionToggle } from './common/DirectionToggle'
import { HelpButton } from './common/HelpButton'
import { ProviderOrganization } from './common/ProviderOrganization'

export const StudentsTableSettings = ({
  availableStats,
  datasets,
  onChange,
  onSeparateChange,
  setSplitDirection,
  value,
}) => {
  const { showDetails, showGrades, separate, splitDirection } = value

  const elements = [
    <Radio
      checked={showDetails}
      data-cy="detailToggle"
      label="Show details"
      key="detailToggle"
      onChange={() => onChange({ ...value, showDetails: !showDetails })}
      toggle
    />,
    <Radio
      checked={showGrades}
      data-cy="gradeToggle"
      label="Show grades"
      key="gradeToggle"
      onChange={() => onChange({ ...value, showGrades: !showGrades })}
      toggle
    />,
    <Radio
      checked={separate}
      data-cy="separateToggle"
      label="Separate by semesters"
      key="separateToggle"
      onChange={() => onSeparateChange(!separate)}
      toggle
    />,
    <ProviderOrganization availableStats={availableStats} key="providerOrganization" />,
  ]

  if (datasets.filter(dataset => dataset).length > 1) {
    elements.push(<DirectionToggle setSplitDirection={setSplitDirection} splitDirection={splitDirection} />)
  }

  return (
    <div style={{ alignItems: 'center', display: 'flex' }}>
      <SegmentGroup horizontal>
        {elements.map(element => (
          <Segment key={element.key} style={{ alignItems: 'center', display: 'flex' }}>
            {element}
          </Segment>
        ))}
      </SegmentGroup>
      <HelpButton tab="Tables" viewMode="STUDENTS" />
    </div>
  )
}
