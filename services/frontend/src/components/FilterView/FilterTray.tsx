import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useContext } from 'react'

import { setViewFilterOptions, resetViewFilter, resetAllViewFilters, selectViewFilters } from '@/redux/filters'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import type { FormattedStudent as Student } from '@oodikone/shared/types/studentData'
import { FilterViewContext } from './context'
import type { FilterContext } from './context'
import { FilterCard } from './filters/common/FilterCard'
import { Filter } from './filters/createFilter'

export type FilterTrayProps = {
  students: Student[]
  onOptionsChange: (options: FilterContext['options']) => void
} & FilterContext

export const FilterTray = ({
  allStudents,
  filters,
  numberOfFilteredStudents,
}: {
  allStudents: Student[]
  filters: Filter[]
  numberOfFilteredStudents: number
}) => {
  const { viewName, getContextByKey } = useContext(FilterViewContext)

  const dispatch = useAppDispatch()
  const storedOptions = useAppSelector(state => selectViewFilters(state, viewName))

  const resetAllFilters = () => dispatch(resetAllViewFilters({ view: viewName }))

  const filterSet = filters
    .sort(({ title: a }, { title: b }) => a.localeCompare(b))
    .map(filter => {
      const { key, isActive, render } = filter
      const ctx = getContextByKey(key)

      const active = isActive(ctx.options)
      const onClear = () => dispatch(resetViewFilter({ view: viewName, filter: key }))

      const props: FilterTrayProps = {
        students: allStudents.slice(), // Copy instead of move
        onOptionsChange: options => dispatch(setViewFilterOptions({ view: viewName, filter: key, options })),
        ...ctx,
      }

      return (
        <FilterCard active={active} filter={filter} key={key} onClear={onClear}>
          {render(props)}
        </FilterCard>
      )
    })

  return (
    <Paper
      sx={{
        py: 3,
        px: 2,
        borderRadius: 0,
        maxWidth: '18em',
        flex: '0 0 18em',
        height: 'fit-content',
      }}
      variant="outlined"
    >
      <Stack spacing={1.5} sx={{ alignItems: 'center', textAlign: 'center', width: '100%', mb: 2 }}>
        <Typography component="span" data-cy="filtered-students" fontSize="1.3em" fontWeight={500} variant="subtitle1">
          Filter students
        </Typography>
        <Typography component="span" fontSize="1.1em">
          Showing {numberOfFilteredStudents} out of {allStudents.length} students
        </Typography>
        <Button
          color="inherit"
          data-cy="reset-all-filters"
          disableElevation
          disabled={!filters.some(({ key }) => !!storedOptions[key])}
          onClick={resetAllFilters}
          variant="contained"
        >
          Reset All Filters
        </Button>
      </Stack>
      {filterSet}
    </Paper>
  )
}
