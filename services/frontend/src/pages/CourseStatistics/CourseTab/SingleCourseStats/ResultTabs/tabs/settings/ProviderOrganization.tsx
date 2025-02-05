import { Checkbox, FormControl, FormControlLabel, SelectChangeEvent, Stack } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'

import { RootState } from '@/redux'
import { toggleOpenAndRegularCourses } from '@/redux/courseSearch'
import { AvailableStats } from '@/types/courseStat'

export const ProviderOrganization = ({ availableStats }: { availableStats: AvailableStats }) => {
  const dispatch = useDispatch()

  const openOrRegular = useSelector((state: RootState) => state.courseSearch.openOrRegular)

  const toggleValue = (event: SelectChangeEvent<'openStats' | 'regularStats'>) => {
    const options = {
      regularStats: {
        regularStats: 'openStats',
        openStats: 'unifyStats',
        unifyStats: 'openStats',
      },
      openStats: {
        openStats: 'regularStats',
        regularStats: 'unifyStats',
        unifyStats: 'regularStats',
      },
    } as const
    return dispatch(toggleOpenAndRegularCourses(options[event.target.value][openOrRegular]))
  }

  return (
    <FormControl>
      <Stack direction="row">
        <FormControlLabel
          control={
            <Checkbox
              checked={openOrRegular === 'regularStats' || openOrRegular === 'unifyStats'}
              data-cy="ProviderCheckboxUniversity"
              disabled={!availableStats.university}
              onChange={toggleValue}
              value="regularStats"
            />
          }
          label={availableStats.university ? 'University' : 'University (no data)'}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={openOrRegular === 'openStats' || openOrRegular === 'unifyStats'}
              data-cy="ProviderCheckboxOpenUni"
              disabled={!availableStats.open}
              onChange={toggleValue}
              value="openStats"
            />
          }
          label={availableStats.open ? 'Open uni' : 'Open uni (no data)'}
        />
      </Stack>
    </FormControl>
  )
}
