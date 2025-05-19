import { FormControlLabel, Switch } from '@mui/material'
import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'

import { toggleStudentNameVisibility } from '@/redux/settings'

export const useStudentNameVisibility = () => {
  const visible = useAppSelector(state => state.settings.namesVisible)
  const dispatch = useAppDispatch()

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
