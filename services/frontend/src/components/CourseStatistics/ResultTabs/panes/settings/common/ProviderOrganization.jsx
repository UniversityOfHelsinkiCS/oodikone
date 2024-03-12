import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Checkbox, Segment, SegmentGroup } from 'semantic-ui-react'

import { toggleOpenAndRegularCourses } from '@/redux/coursesearch'

export const ProviderOrganization = ({ availableStats }) => {
  const dispatch = useDispatch()

  const openOrRegular = useSelector(state => state.courseSearch.openOrRegular)

  const toggleValue = (_event, { value }) => {
    const options = {
      regularStats: {
        regularStats: 'openStats',
        openStats: 'unifyStats',
        unifyStats: 'openStats',
      },
      openStats: {
        openStats: 'regularStats',
        regularStats: 'unifyStats',
        unifyStats: 'regularStats',
      },
    }
    return dispatch(toggleOpenAndRegularCourses(options[value][openOrRegular]))
  }

  return (
    <SegmentGroup horizontal style={{ margin: 0, padding: 0 }}>
      <Segment>
        <Checkbox
          checked={openOrRegular === 'regularStats' || openOrRegular === 'unifyStats'}
          data-cy="providerCheckboxUniversity"
          disabled={!availableStats.university}
          label={availableStats.university ? 'University' : 'University (no data)'}
          name="radioGroup"
          onChange={toggleValue}
          value="regularStats"
        />
      </Segment>
      <Segment>
        <Checkbox
          checked={openOrRegular === 'openStats' || openOrRegular === 'unifyStats'}
          data-cy="providerCheckboxOpenUni"
          disabled={!availableStats.open}
          label={availableStats.open ? 'Open uni' : 'Open uni (no data)'}
          name="radioGroup"
          onChange={toggleValue}
          value="openStats"
        />
      </Segment>
    </SegmentGroup>
  )
}
