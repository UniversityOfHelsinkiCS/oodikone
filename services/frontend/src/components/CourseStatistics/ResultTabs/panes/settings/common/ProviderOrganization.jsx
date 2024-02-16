import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Checkbox, Segment, SegmentGroup } from 'semantic-ui-react'
import { toggleOpenAndRegularCourses } from 'redux/coursesearch'

export const ProviderOrganization = ({ availableStats }) => {
  const dispatch = useDispatch()

  const openOrRegular = useSelector(state => state.courseSearch.openOrRegular)

  const toggleValue = (_event, { value }) => {
    let newValue
    switch (value) {
      case 'regularStats':
        switch (openOrRegular) {
          case 'regularStats':
            newValue = 'openStats'
            break
          case 'openStats':
            newValue = 'unifyStats'
            break
          case 'unifyStats':
            newValue = 'openStats'
            break
          default:
            break
        }
        break
      case 'openStats':
        switch (openOrRegular) {
          case 'openStats':
            newValue = 'regularStats'
            break
          case 'regularStats':
            newValue = 'unifyStats'
            break
          case 'unifyStats':
            newValue = 'regularStats'
            break
          default:
            break
        }
        break
      default:
        break
    }
    return dispatch(toggleOpenAndRegularCourses(newValue))
  }

  return (
    <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '10px' }}>Provider organization(s)</div>
      <SegmentGroup horizontal style={{ margin: '0' }}>
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
    </div>
  )
}
