import { Box, Stack, Switch } from '@mui/material'

import { AvailableStats } from '@/types/courseStat'
import { ProviderOrganization } from './ProviderOrganization'
import { Setting } from './Setting'

export const TableSettings = ({
  availableStats,
  onShowGradesChange,
  onSeparateChange,
  separate,
  showGrades,
}: {
  availableStats: AvailableStats
  onShowGradesChange: (value) => void
  onSeparateChange: (separate: boolean) => void
  separate: boolean
  showGrades: boolean
}) => {
  return (
    <Box sx={{ alignItems: 'center', display: 'flex' }}>
      <Stack direction="row" gap={1}>
        <Setting
          control={
            <Switch checked={showGrades} data-cy="gradeToggle" onChange={() => onShowGradesChange(!showGrades)} />
          }
          labelText="Show grades"
        />
        <Setting
          control={<Switch checked={separate} data-cy="separateToggle" onChange={() => onSeparateChange(!separate)} />}
          labelText="Separate by semesters"
        />
        <Setting
          control={<ProviderOrganization availableStats={availableStats} />}
          labelText="Provider organization(s)"
        />
      </Stack>
    </Box>
  )
}
