import { Stack, Switch } from '@mui/material'

import { AvailableStats } from '@/types/courseStat'
import { ProviderOrganizationSelect } from './ProviderOrganizationSelect'
import { Setting } from './Setting'

export const TableSettings = ({
  availableStats,
  onShowGradesChange,
  onSeparateChange,
  separate,
  showGrades,
}: {
  availableStats: AvailableStats
  onShowGradesChange: (showGrades: boolean) => void
  onSeparateChange: (separate: boolean) => void
  separate: boolean
  showGrades: boolean
}) => {
  return (
    <Stack direction="row" gap={1}>
      <Setting
        control={<Switch checked={showGrades} data-cy="gradeToggle" onChange={() => onShowGradesChange(!showGrades)} />}
        labelText="Show grades"
      />
      <Setting
        control={<Switch checked={separate} data-cy="separateToggle" onChange={() => onSeparateChange(!separate)} />}
        labelText="Separate by semesters"
      />
      <ProviderOrganizationSelect availableStats={availableStats} />
    </Stack>
  )
}
