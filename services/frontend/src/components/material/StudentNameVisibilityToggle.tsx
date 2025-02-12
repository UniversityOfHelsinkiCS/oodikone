import { FormControlLabel, Switch } from '@mui/material'
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { RootState } from '@/redux'
import { toggleStudentNameVisibility } from '@/redux/settings'

export const useStudentNameVisibility = () => {
  const visible = useSelector((state: RootState) => state.settings.namesVisible)
  const dispatch = useDispatch()

  const toggle = useCallback(() => {
    dispatch(toggleStudentNameVisibility())
  }, [dispatch])

  return { visible, toggle }
}

export const StudentNameVisibilityToggle = () => {
  const { visible, toggle } = useStudentNameVisibility()

  const handleChange = useCallback(() => {
    toggle()
  }, [toggle])

  return (
    <FormControlLabel
      control={<Switch checked={visible} data-cy="toggleStudentNames" onChange={handleChange} />}
      label="Show student names"
      sx={{ margin: 0 }}
    />
  )
}
