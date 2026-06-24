import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { FilterCard } from '@/components/FilterView/filters/common/FilterCard'
import type {
  FilterContext,
  FilterOptions,
  FilterTrayProps,
  GenericFilter,
} from '@/components/FilterView/filters/createFilter'
import type { FormattedStudent as Student } from '@oodikone/shared/types/studentData'

export const FilterTray = <Options extends FilterOptions, Args, Precompute>({
  numberOfFilteredStudents,
  allStudents,
  filters,
  filtersInUse,

  getContextByKey,
  setFilterOptions,
  resetFilterOptions,
  resetAllFilterOptions,
}: {
  numberOfFilteredStudents: number
  allStudents: Student[]
  filters: GenericFilter<Options, Args, Precompute>[]
  filtersInUse: boolean

  getContextByKey: (key: string) => FilterContext<Options, Args, Precompute>
  setFilterOptions: (filter: string, options: Options) => void
  resetFilterOptions: (filter: string) => void
  resetAllFilterOptions: () => void
}) => {
  return (
    <Paper
      sx={{
        flex: '0 0 20em',
        width: '20em',
        py: 3,
        px: 2,
        borderRadius: 0,
        height: '100%',
        minHeight: 'fit-content',
      }}
      variant="outlined"
    >
      <Stack spacing={1.5} sx={{ alignItems: 'center', textAlign: 'center', mb: 2 }}>
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
          disabled={!filtersInUse}
          onClick={() => resetAllFilterOptions()}
          variant="contained"
        >
          Reset All Filters
        </Button>
      </Stack>
      {filters
        .sort(({ title: a }, { title: b }) => a.localeCompare(b))
        .map(filter => {
          const { key } = filter
          const ctx = getContextByKey(key)

          const props: FilterTrayProps<Options, Args, Precompute> = {
            ...ctx,
            students: allStudents,
            onOptionsChange: (options: Options) => setFilterOptions(key, options),
          }

          return <FilterCard filter={filter} key={key} onClear={() => resetFilterOptions(key)} props={props} />
        })}
    </Paper>
  )
}
