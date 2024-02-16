import React from 'react'
import { Radio, Segment, SegmentGroup } from 'semantic-ui-react'
import { HelpButton } from './common/HelpButton'
import { ProviderOrganization } from './common/ProviderOrganization'

export const AttemptsTableSettings = ({ availableStats, onChange, onSeparateChange, value }) => {
  const { showGrades, separate } = value

  const elements = [
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

  return (
    <div style={{ alignItems: 'center', display: 'flex' }}>
      <SegmentGroup horizontal secondary>
        {elements.map(element => (
          <Segment key={element.key} style={{ alignItems: 'center', display: 'flex' }}>
            {element}
          </Segment>
        ))}
      </SegmentGroup>
      <HelpButton tab="Tables" viewMode="ATTEMPTS" />
    </div>
  )
}
