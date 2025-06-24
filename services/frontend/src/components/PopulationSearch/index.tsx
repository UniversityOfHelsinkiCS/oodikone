import KeyboardBackspaceIcon from '@mui/icons-material/KeyboardBackspace'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import { Link } from 'react-router'

import { populationStatisticsToolTips } from '@/common/InfoToolTips'
import { hopsFilter } from '@/components/FilterView/filters'
import { useFilters } from '@/components/FilterView/useFilters'
import { Section } from '@/components/material/Section'
import { PopulationSearchForm } from './PopulationSearchForm'
import { PopulationSearchHistory } from './PopulationSearchHistory'

export const PopulationSearch = ({ query, skipQuery, isLoading, populationFound, combinedProgrammeCode }) => {
  const { filterDispatch, useFilterSelector } = useFilters()
  const onlyHopsCredit = useFilterSelector(hopsFilter.selectors.isActive())
  const combinedHopsSelected = useFilterSelector(hopsFilter.selectors.isCombinedSelected(combinedProgrammeCode))
  const bothHopsSelected = useFilterSelector(hopsFilter.selectors.isBothSelected(combinedProgrammeCode))

  return (
    <Section
      cypress="PopulationSearch"
      infoBoxContent={!populationFound ? populationStatisticsToolTips.search : undefined}
      title={skipQuery && 'Search for class'}
    >
      <PopulationSearchForm />
      {!skipQuery && !isLoading && (
        <FormControl sx={{ gap: 1 }} variant="standard">
          <Link style={{ width: 'fit-content' }} to="/populations">
            <Button startIcon={<KeyboardBackspaceIcon />} variant="contained">
              Search new class
            </Button>
          </Link>
          <FormControlLabel
            control={
              <Switch
                checked={onlyHopsCredit && (bothHopsSelected ?? !combinedHopsSelected)}
                onChange={() => filterDispatch(hopsFilter.actions.toggle(undefined))}
              />
            }
            label={
              combinedProgrammeCode
                ? 'Show only credits included in bachelor study plan'
                : 'Show only credits included in study plan'
            }
            sx={{ width: 'fit-content' }}
          />
          {combinedProgrammeCode && (
            <FormControlLabel
              control={
                <Switch
                  checked={!!combinedHopsSelected}
                  onChange={() => filterDispatch(hopsFilter.actions.toggleCombinedProgramme(combinedProgrammeCode))}
                />
              }
              label="Show only credits included in licentiate study plan"
              sx={{ width: 'fit-content' }}
            />
          )}
          <PopulationSearchHistory query={query} skipQuery={skipQuery} />
        </FormControl>
      )}
    </Section>
  )
}
