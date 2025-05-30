import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select, { SelectChangeEvent } from '@mui/material/Select'

import { toggleOpenAndRegularCourses } from '@/redux/courseSearch'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'

import { AvailableStats } from '@/types/courseStat'

export const ProviderOrganizationSelect = ({ availableStats }: { availableStats: AvailableStats }) => {
  const openOrRegular = useAppSelector(state => state.courseSearch.openOrRegular)
  const dispatch = useAppDispatch()

  const onChange = (event: SelectChangeEvent<'openStats' | 'regularStats' | 'unifyStats'>) => {
    return dispatch(toggleOpenAndRegularCourses(event.target.value))
  }

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
