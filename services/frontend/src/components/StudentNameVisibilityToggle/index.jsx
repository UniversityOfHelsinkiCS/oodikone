import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Radio } from 'semantic-ui-react'

import TSA from '../../common/tsa'
import { toggleStudentNameVisibility } from '../../redux/settings'

export const useStudentNameVisibility = () => {
  const visible = useSelector(state => state.settings.namesVisible)
  const dispatch = useDispatch()

  const toggle = useCallback(() => {
    dispatch(toggleStudentNameVisibility())
  }, [dispatch])

  return { visible, toggle }
}

const StudentNameVisibilityToggle = ({ style = {} }) => {
  const { visible, toggle } = useStudentNameVisibility()

  const handleChange = useCallback(() => {
    TSA.Matomo.sendEvent('Common', 'Toggle student name visibility', visible ? 'hide' : 'show')
    toggle()
  }, [visible, toggle])

  return (
    <div style={{ marginTop: 15, marginBottom: 10, ...style }}>
      <Radio data-cy="toggleStudentNames" toggle label="Show student names" checked={visible} onChange={handleChange} />
    </div>
  )
}

export default StudentNameVisibilityToggle
