import React from 'react'
import { useSelector } from 'react-redux'
import { Menu, Radio } from 'semantic-ui-react'

import { viewModeNames } from './util'
import { HelpButton } from '../HelpButton'
import { StudentTable } from './Tables/student'
import { AttemptsTable } from './Tables/attempts'
import { getCourseAlternatives } from '../../../../selectors/courseStats'
import { UnifyRadioButtons } from '../UnifyRadioButtons'

export const TablesSettings = ({ value, onChange, availableStats, onSeparateChange }) => {
  const { viewMode, showDetails, showGrades, separate } = value

  return (
    <div>
      <Menu style={{ flexWrap: 'wrap' }} secondary>
        {Object.entries(viewModeNames).map(([key, name]) => (
          <Menu.Item
            key={key}
            active={viewMode === key}
            data-cy={`viewMode-${name}`}
            name={name}
            onClick={() =>
              onChange({
                ...value,
                viewMode: key,
              })
            }
          />
        ))}
        <Menu.Item>
          <Radio
            toggle
            label="Show details"
            disabled={viewMode !== 'STUDENT'}
            checked={showDetails}
            onChange={() => onChange({ ...value, showDetails: !showDetails })}
          />
        </Menu.Item>
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
          <HelpButton tab="Tables" viewMode={viewMode} />
        </Menu.Item>
      </Menu>
      <UnifyRadioButtons availableStats={availableStats} />
    </div>
  )
}

export const Tables = ({ settings, ...otherProps }) => {
  const alternatives = useSelector(getCourseAlternatives)
  const viewModes = { ATTEMPTS: AttemptsTable, STUDENT: StudentTable }
  const Content = viewModes[settings.viewMode]
  const openOrRegular = useSelector(state => state.courseSearch.openOrRegular)

  return <Content settings={settings} {...otherProps} alternatives={alternatives} unifyCourses={openOrRegular} />
}
