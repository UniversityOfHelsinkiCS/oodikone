import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'

import { CourseSearchState } from '@/pages/CourseStatistics'
import { AvailableStats } from '@/types/courseStat'
import { ProviderOrganizationSelect } from './ProviderOrganizationSelect'
import { Setting } from './Setting'

export const TableSettings = ({
  availableStats,
  onShowGradesChange,
  onSeparateChange,
  separate,
  showGrades,

  toggleOpenAndRegularCourses,
  openOrRegular,
}: {
  availableStats: AvailableStats
  onShowGradesChange: (showGrades: boolean) => void
  onSeparateChange: (separate: boolean) => void
  separate: boolean
  showGrades: boolean

  toggleOpenAndRegularCourses: (state: CourseSearchState) => void
  openOrRegular: CourseSearchState
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
      <ProviderOrganizationSelect
        availableStats={availableStats}
        openOrRegular={openOrRegular}
        toggleOpenAndRegularCourses={toggleOpenAndRegularCourses}
      />
    </Stack>
  )
}
