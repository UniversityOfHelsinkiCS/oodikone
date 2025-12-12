import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select, { SelectChangeEvent } from '@mui/material/Select'

import type { CourseSearchState } from '@/pages/CourseStatistics'
import { AvailableStats } from '@/types/courseStat'

export const ProviderOrganizationSelect = ({
  toggleOpenAndRegularCourses,
  openOrRegular,
  availableStats,
}: {
  toggleOpenAndRegularCourses: (state: CourseSearchState) => void
  openOrRegular: CourseSearchState
  availableStats: AvailableStats
}) => {
  const onChange = ({ target }: SelectChangeEvent<'openStats' | 'regularStats' | 'unifyStats'>) =>
    toggleOpenAndRegularCourses(target.value as CourseSearchState)

  return (
    <FormControl>
      <InputLabel>Provider organization(s)</InputLabel>
      <Select
        data-cy="ProviderOrganizationSelect"
        label="Provider organisation(s)"
        onChange={onChange}
        sx={{ height: 60, width: 250 }}
        value={openOrRegular}
      >
        <MenuItem data-cy="ProviderOrganizationSelectOptionBoth" disabled={!availableStats.unify} value="unifyStats">
          University + Open university
        </MenuItem>
        <MenuItem
          data-cy="ProviderOrganizationSelectOptionRegular"
          disabled={!availableStats.university}
          value="regularStats"
        >
          {availableStats.university ? 'University' : 'University (not available)'}
        </MenuItem>
        <MenuItem data-cy="ProviderOrganizationSelectOptionOpen" disabled={!availableStats.open} value="openStats">
          {availableStats.open ? 'Open university' : 'Open university (not available)'}
        </MenuItem>
      </Select>
    </FormControl>
  )
}
