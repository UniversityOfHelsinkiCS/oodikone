import React from 'react'
import { useSelector } from 'react-redux'
import { Menu, Radio } from 'semantic-ui-react'
import { viewModeNames } from './util'
import HelpButton from '../HelpButton'
import StudentTable from './Tables/student'
import AttemptsTable from './Tables/attempts'

export const TablesSettings = ({ value, onChange }) => {
  const { viewMode, showDetails, showGrades } = value

  return (
    <Menu secondary style={{ marginBottom: 0 }}>
      {Object.entries(viewModeNames).map(([key, name]) => (
        <Menu.Item
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
          disabled={viewMode !== 'ATTEMPTS'}
          checked={showGrades}
          onChange={() => onChange({ ...value, showGrades: !showGrades })}
        />
      </Menu.Item>
      <Menu.Item>
        <HelpButton tab="Tables" viewMode={viewMode} />
      </Menu.Item>
    </Menu>
  )
}

export const Tables = props => {
  const alternatives = useSelector(state => state.courseStats.data[state.singleCourseStats.selectedCourse].alternatives)

  const viewModes = { ATTEMPTS: AttemptsTable, STUDENT: StudentTable }

  const Content = viewModes[props.settings.viewMode]

  return <Content {...props} alternatives={alternatives} />
}
