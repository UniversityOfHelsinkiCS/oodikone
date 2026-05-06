import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'

import { useAppDispatch, useAppSelector } from '@/redux/hooks'

import { toggleStudentNameVisibility } from '@/redux/settings'

export const useStudentNameVisibility = () => {
  const visible = useAppSelector(state => state.settings.namesVisible)
  const dispatch = useAppDispatch()

  const toggle = () => dispatch(toggleStudentNameVisibility())

  return { visible, toggle }
}

export const StudentNameVisibilityToggle = () => {
  const { visible, toggle } = useStudentNameVisibility()

  return (
    <FormControlLabel
      control={<Switch checked={visible} data-cy="toggleStudentNames" onChange={() => toggle()} />}
      label="Show student names"
    />
  )
}
