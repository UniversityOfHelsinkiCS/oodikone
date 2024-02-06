import React from 'react'
import { Menu, Radio } from 'semantic-ui-react'
import { HelpButton } from '../../HelpButton'
import { UnifyRadioButtons } from '../../UnifyRadioButtons'

export const AttemptsTableSettings = ({ value, onChange, availableStats, onSeparateChange }) => {
  const { showGrades, separate } = value

  return (
    <div>
      <Menu style={{ flexWrap: 'wrap' }} secondary>
        <Menu.Item>
          <Radio
            toggle
            label="Show grades"
            data-cy="gradeToggle"
            checked={showGrades}
            onChange={() => onChange({ ...value, showGrades: !showGrades })}
          />
        </Menu.Item>
        <Menu.Item>
          <Radio
            toggle
            label="Separate by semesters"
            data-cy="separateToggle"
            checked={separate}
            onChange={() => onSeparateChange(!separate)}
          />
        </Menu.Item>
        <Menu.Item>
          <HelpButton tab="Tables" viewMode="ATTEMPTS" />
        </Menu.Item>
      </Menu>
      <UnifyRadioButtons availableStats={availableStats} />
    </div>
  )
}
