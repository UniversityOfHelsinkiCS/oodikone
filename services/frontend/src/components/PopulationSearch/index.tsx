import KeyboardBackspaceIcon from '@mui/icons-material/KeyboardBackspace'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import { Link, useLocation } from 'react-router'

import { populationStatisticsToolTips } from '@/common/InfoToolTips'
import { hopsFilter } from '@/components/FilterView/filters'
import { useFilters } from '@/components/FilterView/useFilters'
import { Section } from '@/components/material/Section'
import { ProgressBar } from '@/components/ProgressBar'
import { useProgress } from '@/hooks/progress'
import { useAppSelector } from '@/redux/hooks'
import { PopulationSearchForm } from './PopulationSearchForm'
import { PopulationSearchHistory } from './PopulationSearchHistory'

export const PopulationSearch = ({ combinedProgrammeCode }) => {
  const location = useLocation()
  const populations = useAppSelector(state => state.populations)
  const populationFound = !!populations.data?.students
  const loading = populations.pending
  const { onProgress, progress } = useProgress(loading)
  const { filterDispatch, useFilterSelector } = useFilters()
  const onlyHopsCredit = useFilterSelector(hopsFilter.selectors.isActive)
  const combinedHopsSelected = useFilterSelector(hopsFilter.selectors.isCombinedSelected(combinedProgrammeCode))
  const bothHopsSelected = useFilterSelector(hopsFilter.selectors.isBothSelected(combinedProgrammeCode))
  const title = populationFound && location.search ? null : 'Search for class'

  const creditFilterChecked = onlyHopsCredit && (bothHopsSelected || !combinedHopsSelected)

  return (
    <Section
      infoBoxContent={!populationFound ? populationStatisticsToolTips.search : undefined}
      title={title ?? undefined}
    >
      <PopulationSearchForm onProgress={onProgress} />
      {location.search !== '' && !loading && (
        <FormControl component="fieldset" sx={{ gap: 1 }} variant="standard">
          <Link to="/populations">
            <Button startIcon={<KeyboardBackspaceIcon />} variant="contained">
              Search new class
            </Button>
          </Link>
          <FormControlLabel
            control={
              <Switch checked={!!creditFilterChecked} onChange={() => filterDispatch(hopsFilter.actions.toggle())} />
            }
            label={
              combinedProgrammeCode
                ? 'Show only credits included in bachelor study plan'
                : 'Show only credits included in study plan'
            }
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
            />
          )}
          <PopulationSearchHistory />
        </FormControl>
      )}
      <ProgressBar progress={progress} />
    </Section>
  )
}
