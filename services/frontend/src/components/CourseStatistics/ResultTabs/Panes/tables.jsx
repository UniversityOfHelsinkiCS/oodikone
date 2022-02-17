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
    <Menu secondary style={{ marginBottom: 0 }}>
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
        <Form>
          <div style={{ marginTop: '1em' }}>
            <Form.Group inline>
              <Form.Field>
                <b>course provider type</b>
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
          </div>
        </Form>
      </Menu.Item>
      <Menu.Item>
        <HelpButton tab="Tables" viewMode={viewMode} />
      </Menu.Item>
    </Menu>
  )
}

export const Tables = props => {
  const alternatives = useSelector(selectors.getCourseAlternatives)
  const viewModes = { ATTEMPTS: AttemptsTable, STUDENT: StudentTable }
  const Content = viewModes[props.settings.viewMode]

  return <Content {...props} alternatives={alternatives} />
}
