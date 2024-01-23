import React from 'react'
import { useSelector } from 'react-redux'
import { Menu, Radio } from 'semantic-ui-react'
import { getCourseAlternatives } from '../../../../selectors/courseStats'
import { HelpButton } from '../HelpButton'
import { UnifyRadioButtons } from '../UnifyRadioButtons'
import { StudentsTable } from './Tables/students'

export const StudentsTableSettings = ({ value, onChange, availableStats, onSeparateChange }) => {
  const { showDetails, showGrades, separate } = value

  return (
    <div>
      <Menu style={{ flexWrap: 'wrap' }} secondary>
        <Menu.Item>
          <Radio
            toggle
            label="Show details"
            data-cy="detailToggle"
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
          <HelpButton tab="Tables" viewMode="STUDENTS" />
        </Menu.Item>
      </Menu>
      <UnifyRadioButtons availableStats={availableStats} />
    </div>
  )
}

export const StudentsTableContent = ({ settings, ...otherProps }) => {
  const alternatives = useSelector(getCourseAlternatives)
  const openOrRegular = useSelector(state => state.courseSearch.openOrRegular)
  return <StudentsTable settings={settings} {...otherProps} alternatives={alternatives} unifyCourses={openOrRegular} />
}
