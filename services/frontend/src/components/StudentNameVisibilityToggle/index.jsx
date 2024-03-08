import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Radio } from 'semantic-ui-react'

import { toggleStudentNameVisibility } from '@/redux/settings'

export const useStudentNameVisibility = () => {
  const visible = useSelector(state => state.settings.namesVisible)
  const dispatch = useDispatch()

  const toggle = useCallback(() => {
    dispatch(toggleStudentNameVisibility())
  }, [dispatch])

  return { visible, toggle }
}

export const StudentNameVisibilityToggle = ({ style = {} }) => {
  const { visible, toggle } = useStudentNameVisibility()

  const handleChange = useCallback(() => {
    toggle()
  }, [visible, toggle])

  return (
    <div style={{ marginTop: 15, marginBottom: 10, ...style }}>
      <Radio data-cy="toggleStudentNames" toggle label="Show student names" checked={visible} onChange={handleChange} />
    </div>
  )
}
