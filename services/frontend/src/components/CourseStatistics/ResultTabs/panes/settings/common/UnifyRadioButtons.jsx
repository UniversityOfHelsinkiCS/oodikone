import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Form, Menu, Radio } from 'semantic-ui-react'
import { toggleOpenAndRegularCourses } from 'redux/coursesearch'

export const UnifyRadioButtons = ({ availableStats }) => {
  const dispatch = useDispatch()

  const openOrRegular = useSelector(state => state.courseSearch.openOrRegular)
  const toggleUnifyRadioValue = (event, { value }) => {
    dispatch(toggleOpenAndRegularCourses(value))
  }

  return (
    <Menu secondary style={{ marginLeft: '0.5rem' }}>
      <Form>
        <Form.Group>
          <Form.Field>
            <b>Provider organization:</b>
          </Form.Field>
          <Form.Field>
            <Radio
              label={availableStats.university ? 'university' : 'university (no data)'}
              name="radioGroup"
              value="regularStats"
              checked={openOrRegular === 'regularStats'}
              disabled={!availableStats.university}
              onChange={toggleUnifyRadioValue}
              data-cy="unify_radio_regular"
            />
          </Form.Field>
          <Form.Field>
            <Radio
              label={availableStats.open ? 'open' : 'open (no data)'}
              name="radioGroup"
              value="openStats"
              checked={openOrRegular === 'openStats'}
              onChange={toggleUnifyRadioValue}
              disabled={!availableStats.open}
              data-cy="unify_radio_open"
            />
          </Form.Field>
          <Form.Field>
            <Radio
              label={availableStats.unify ? 'both' : 'both (no data)'}
              name="radioGroup"
              value="unifyStats"
              checked={openOrRegular === 'unifyStats'}
              onChange={toggleUnifyRadioValue}
              disabled={!availableStats.unify}
              data-cy="unify_radio_unify"
            />
          </Form.Field>
        </Form.Group>
      </Form>
    </Menu>
  )
}
