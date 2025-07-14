import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useContext } from 'react'

import { Student } from '.'
import { FilterViewContext } from './context'
import type { FilterContext } from './context'
import { FilterCard } from './filters/common/FilterCard'

export type FilterTrayProps = {
  options: FilterContext['options']
  onOptionsChange: (options) => void
  students: Student[]
}

export const FilterTray = () => {
  const {
    filteredStudents,
    allStudents,
    filters,
    setFilterOptions,
    resetFilter,
    resetFilters,
    getContextByKey,
    areOptionsDirty,
  } = useContext(FilterViewContext)

  const haveOptionsBeenChanged = filters.some(({ key }) => areOptionsDirty(key))
  const filterSet = filters
    .sort(({ title: a }, { title: b }) => a.localeCompare(b))
    .map(filter => {
      const { key, isActive, render } = filter
      const ctx = getContextByKey(key)

      const props: FilterTrayProps = {
        options: ctx.options,
        onOptionsChange: options => setFilterOptions(key, options),
        students: allStudents.slice(), // Copy instead of move
      }

      const active = isActive(ctx.options)
      const onClear = () => resetFilter(key)

      return (
        <FilterCard active={active} filter={filter} key={key} onClear={onClear}>
          {render(props, ctx)}
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
          Showing {filteredStudents.length} out of {allStudents.length} students
        </Typography>
        {haveOptionsBeenChanged && (
          <Button
            color="inherit"
            data-cy="reset-all-filters"
            disableElevation
            onClick={resetFilters}
            variant="contained"
          >
            Reset All Filters
          </Button>
        )}
      </Stack>
      {filterSet}
    </Paper>
  )
}
