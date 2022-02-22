import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Menu, Radio, Form } from 'semantic-ui-react'
import { viewModeNames } from './util'
import HelpButton from '../HelpButton'
import StudentTable from './Tables/student'
import AttemptsTable from './Tables/attempts'
import { toggleOpenAndReqularCourses } from '../../../../redux/coursesearch'
import selectors from '../../../../selectors/courseStats'

export const TablesSettings = ({ value, onChange }) => {
  const { viewMode, showDetails, showGrades } = value
  const dispatch = useDispatch()

  const openOrReqular = useSelector(state => state.courseSearch.openOrReqular)
  const toggleUnifyRadioValue = (event, { value }) => {
    dispatch(toggleOpenAndReqularCourses(value))
  }

  return (
    <div>
      <Menu secondary>
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
            disabled={viewMode !== 'ATTEMPTS'}
            checked={showGrades}
            onChange={() => onChange({ ...value, showGrades: !showGrades })}
          />
        </Menu.Item>

        <Menu.Item>
          <HelpButton tab="Tables" viewMode={viewMode} />
        </Menu.Item>
      </Menu>
      <Menu secondary style={{ marginLeft: '0.5rem' }}>
        <Form>
          <Form.Group>
            <Form.Field>
              <b>Provider organization:</b>
            </Form.Field>
            <Form.Field>
              <Radio
                label="university"
                name="radioGroup"
                value="reqularStats"
                checked={openOrReqular === 'reqularStats'}
                onChange={toggleUnifyRadioValue}
                data-cy="unify_radio_reqular"
              />
            </Form.Field>
            <Form.Field>
              <Radio
                label="open university"
                name="radioGroup"
                value="openStats"
                checked={openOrReqular === 'openStats'}
                onChange={toggleUnifyRadioValue}
                data-cy="unify_radio_open"
              />
            </Form.Field>
            <Form.Field>
              <Radio
                label="unify"
                name="radioGroup"
                value="unifyStats"
                checked={openOrReqular === 'unifyStats'}
                onChange={toggleUnifyRadioValue}
                data-cy="unify_radio_unify"
              />
            </Form.Field>
          </Form.Group>
        </Form>
      </Menu>
    </div>
  )
}

export const Tables = props => {
  const alternatives = useSelector(selectors.getCourseAlternatives)
  const viewModes = { ATTEMPTS: AttemptsTable, STUDENT: StudentTable }
  const Content = viewModes[props.settings.viewMode]

  return <Content {...props} alternatives={alternatives} />
}
