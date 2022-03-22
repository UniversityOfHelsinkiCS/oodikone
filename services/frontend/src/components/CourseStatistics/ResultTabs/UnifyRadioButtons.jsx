import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Menu, Radio, Form } from 'semantic-ui-react'
import { toggleOpenAndReqularCourses } from '../../../redux/coursesearch'

const UnifyRadioButtons = ({ availableStats }) => {
  const dispatch = useDispatch()

  const openOrReqular = useSelector(state => state.courseSearch.openOrReqular)
  const toggleUnifyRadioValue = (event, { value }) => {
    dispatch(toggleOpenAndReqularCourses(value))
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
              value="reqularStats"
              checked={openOrReqular === 'reqularStats'}
              disabled={!availableStats.university}
              onChange={toggleUnifyRadioValue}
              data-cy="unify_radio_reqular"
            />
          </Form.Field>
          <Form.Field>
            <Radio
              label={availableStats.open ? 'open' : 'open (no data)'}
              name="radioGroup"
              value="openStats"
              checked={openOrReqular === 'openStats'}
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
              checked={openOrReqular === 'unifyStats'}
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

export default UnifyRadioButtons
