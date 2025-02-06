import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'

import { RootState } from '@/redux'
import { toggleOpenAndRegularCourses } from '@/redux/courseSearch'
import { AvailableStats } from '@/types/courseStat'

export const ProviderOrganizationSelect = ({ availableStats }: { availableStats: AvailableStats }) => {
  const openOrRegular = useSelector((state: RootState) => state.courseSearch.openOrRegular)
  const dispatch = useDispatch()

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
        <MenuItem disabled={!availableStats.unify} value="unifyStats">
          Both
        </MenuItem>
        <MenuItem disabled={!availableStats.university} value="regularStats">
          {availableStats.university ? 'University' : 'University (not available)'}
        </MenuItem>
        <MenuItem disabled={!availableStats.open} value="openStats">
          {availableStats.open ? 'Open university' : 'Open university (not available)'}
        </MenuItem>
      </Select>
    </FormControl>
  )
}
