import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import { useTheme } from '@mui/material/styles'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import type { ReactNode } from 'react'

import { FilterSearchableSelect } from '@/components/FilterView/filters/common/FilterSearchableSelect'
import { Section } from '@/components/Section'
import {
  describeFilters,
  emptyFilters,
  type CloseToGraduationFilterOptions,
  type CloseToGraduationFilters,
  type FilterOption,
} from '@/pages/CloseToGraduation/Beta/filters'
import { getInclusionInfoContent } from '@/pages/CloseToGraduation/Beta/inclusionInfo'
import type { CloseToGraduationTab } from '@/pages/CloseToGraduation/Beta/tabs'

type MultiSelectProps = {
  label: string
  placeholder: string
  filterKey: string
  options: FilterOption[]
  selected: string[]
  onChange: (selected: string[]) => void
}

const LabeledFilter = ({ label, children }: { label: string; children: ReactNode }) => (
  <Stack sx={{ gap: 0.5 }}>
    <Typography color="text.secondary" variant="body2">
      {label}
    </Typography>
    {children}
  </Stack>
)

// HACK: prevent extra newlines in the select component...
// MUI defaults: chips are 32px tall with 3px margins, the input needs 30px plus 12px of padding
const CHIP_MARGIN = 3
const CHIP_ROW_HEIGHT = 32 + 2 * CHIP_MARGIN
const INPUT_MIN_WIDTH = 30 + 12

const keepChipRowLayout = {
  '& .MuiAutocomplete-root .MuiAutocomplete-tag': {
    maxWidth: `calc(100% - ${2 * CHIP_MARGIN + INPUT_MIN_WIDTH + 2}px)`,
  },
  '& .MuiAutocomplete-root .MuiAutocomplete-input': { boxSizing: 'border-box', height: CHIP_ROW_HEIGHT },
}

const MultiSelect = ({ label, placeholder, filterKey, options, selected, onChange }: MultiSelectProps) => (
  <LabeledFilter label={label}>
    <Box sx={keepChipRowLayout}>
      <FilterSearchableSelect
        filterKey={filterKey}
        freeSolo={false}
        label=""
        multiple
        onChange={onChange}
        options={options}
        placeholder={selected.length ? undefined : placeholder}
        value={options.filter(option => selected.includes(option.value))}
      />
    </Box>
  </LabeledFilter>
)

type BooleanChoice = 'any' | 'yes' | 'no'

const toChoice = (value: boolean | null): BooleanChoice => {
  if (value === null) return 'any'
  return value ? 'yes' : 'no'
}

const fromChoice = (choice: BooleanChoice) => (choice === 'any' ? null : choice === 'yes')

const BooleanToggle = ({
  label,
  filterKey,
  value,
  onChange,
}: {
  label: string
  filterKey: string
  value: boolean | null
  onChange: (value: boolean | null) => void
}) => (
  <LabeledFilter label={label}>
    <ToggleButtonGroup
      color="primary"
      data-cy={`${filterKey}-toggle`}
      exclusive
      onChange={(_event, choice: BooleanChoice | null) => {
        if (choice) onChange(fromChoice(choice))
      }}
      size="medium"
      value={toChoice(value)}
    >
      <ToggleButton value="any">All</ToggleButton>
      <ToggleButton value="yes">Yes</ToggleButton>
      <ToggleButton value="no">No</ToggleButton>
    </ToggleButtonGroup>
  </LabeledFilter>
)

const FilterSummary = ({
  filters,
  options,
  shownCount,
  totalCount,
}: {
  filters: CloseToGraduationFilters
  options: CloseToGraduationFilterOptions
  shownCount: number
  totalCount: number
}) => (
  <Box data-cy="close-to-graduation-filter-summary">
    <Typography sx={{ mb: 2 }}>
      Showing <strong>{shownCount}</strong> of {totalCount} students
    </Typography>
    <Box component="dl" sx={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', columnGap: 2, rowGap: 1, m: 0 }}>
      {describeFilters(filters, options).map(({ label, value }) => (
        <Box key={label} sx={{ display: 'contents' }}>
          <Typography component="dt" fontWeight="bold">
            {label}:
          </Typography>
          <Typography component="dd" sx={{ m: 0 }} variant="body2">
            {value}
          </Typography>
        </Box>
      ))}
    </Box>
  </Box>
)

export const FilterSection = ({
  filters,
  options,
  onChange,
  shownCount,
  totalCount,
  tab,
}: {
  filters: CloseToGraduationFilters
  options: CloseToGraduationFilterOptions
  onChange: (filters: CloseToGraduationFilters) => void
  shownCount: number
  totalCount: number
  tab: CloseToGraduationTab
}) => {
  const update = (changes: Partial<CloseToGraduationFilters>) => onChange({ ...filters, ...changes })
  const isWide = useMediaQuery(useTheme().breakpoints.up('md'))

  return (
    <Section
      anchorId=""
      title="Filter students close to graduation"
      cypress="close-to-graduation-filters"
      infoBoxContent={getInclusionInfoContent(tab)}
      wrapperSx={{ my: 2 }}
    >
      <Stack
        direction={isWide ? 'row' : 'column'}
        divider={<Divider flexItem orientation={isWide ? 'vertical' : 'horizontal'} />}
        spacing={{ xs: 2, lg: 5 }}
        sx={{ '& > :not(.MuiDivider-root)': { flex: { md: '1 1 0' }, minWidth: 0 } }}
      >
        <Stack sx={{ gap: 2 }}>
          <MultiSelect
            filterKey="faculty"
            label="Faculty"
            placeholder="all faculties"
            onChange={faculties => update({ faculties })}
            options={options.faculties}
            selected={filters.faculties}
          />
          <MultiSelect
            filterKey="programme"
            label="Programme"
            placeholder="all programmes"
            onChange={programmes => update({ programmes })}
            options={options.programmes}
            selected={filters.programmes}
          />
          <Stack direction="row" sx={{ gap: 4, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <BooleanToggle
              filterKey="isBaMa"
              label="BSc & MSc study right"
              onChange={isBaMa => update({ isBaMa })}
              value={filters.isBaMa}
            />
            <BooleanToggle
              filterKey="thesisCompleted"
              label="Thesis completed"
              onChange={thesisCompleted => update({ thesisCompleted })}
              value={filters.thesisCompleted}
            />
            <Button
              data-cy="clear-filters"
              onClick={() => onChange(emptyFilters)}
              sx={{ ml: 'auto' }}
              variant="outlined"
            >
              Clear filters
            </Button>
          </Stack>
        </Stack>
        <FilterSummary filters={filters} options={options} shownCount={shownCount} totalCount={totalCount} />
      </Stack>
    </Section>
  )
}
