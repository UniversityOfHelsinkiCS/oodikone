import Switch from '@mui/material/Switch'

import { Setting } from './Setting'

export const ChartSettings = ({
  isRelative,
  setIsRelative,
}: {
  isRelative: boolean
  setIsRelative: (value: boolean) => void
}) => {
  return (
    <Setting
      control={<Switch checked={isRelative} onChange={() => setIsRelative(!isRelative)} />}
      labelText="Show relative"
    />
  )
}
