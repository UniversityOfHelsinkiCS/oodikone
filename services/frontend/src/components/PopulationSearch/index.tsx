import KeyboardBackspaceIcon from '@mui/icons-material/KeyboardBackspace'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import { useState } from 'react'
import { Link } from 'react-router'

import { populationStatisticsToolTips } from '@/common/InfoToolTips'
import { hopsFilter, transferredToProgrammeFilter } from '@/components/FilterView/filters'
import { useFilters } from '@/components/FilterView/useFilters'
import { Section } from '@/components/material/Section'
import { AdvancedSettings } from './AdvancedSettings'
import { PopulationQueryCard } from './PopulationQueryCard'
import { PopulationSearchForm } from './PopulationSearchForm'

export const PopulationSearch = ({
  query,
  skipQuery,
  isLoading,
  populationFound,
  combinedProgrammeCode,
  populationTags,
}) => {
  const { filterDispatch, useFilterSelector } = useFilters()
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)

  const primaryHopsCreditFilter = useFilterSelector(hopsFilter.selectors.isPrimarySelected())
  const combinedHopsCreditFilter = useFilterSelector(hopsFilter.selectors.isCombinedSelected(combinedProgrammeCode))
  const bothHopsCreditFilter = useFilterSelector(hopsFilter.selectors.isBothSelected(combinedProgrammeCode))

  const transferredSelected = useFilterSelector(transferredToProgrammeFilter.selectors.getState())

  return (
    <Section
      cypress="PopulationSearch"
      infoBoxContent={!populationFound ? populationStatisticsToolTips.search : undefined}
      title={skipQuery && 'Search for class'}
    >
      <PopulationSearchForm />
      {!skipQuery && !isLoading && (
        <>
          <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
            <FormGroup sx={{ gap: 1 }}>
              <Link style={{ width: 'fit-content' }} to="/populations">
                <Button startIcon={<KeyboardBackspaceIcon />} sx={{ mb: '10px' }} variant="contained">
                  Search for a new class
                </Button>
              </Link>
              <FormControlLabel
                control={
                  <Switch
                    checked={!!primaryHopsCreditFilter || !!bothHopsCreditFilter}
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
                      checked={!!combinedHopsCreditFilter || !!bothHopsCreditFilter}
                      onChange={() => filterDispatch(hopsFilter.actions.toggleCombinedProgramme(combinedProgrammeCode))}
                    />
                  }
                  label="Show only credits included in licentiate study plan"
                  sx={{ width: 'fit-content' }}
                />
              )}
              <FormControlLabel
                control={
                  <Switch
                    checked={transferredSelected !== false}
                    onChange={() => filterDispatch(transferredToProgrammeFilter.actions.toggle(undefined))}
                  />
                }
                label="Show students who have transferred to the programme"
              />
              {query.year !== 'All' && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={showAdvancedSettings}
                      data-cy="advanced-toggle"
                      onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                    />
                  }
                  label="View advanced settings"
                />
              )}
            </FormGroup>
            <PopulationQueryCard populationTags={populationTags} query={query} />
          </Stack>
          {showAdvancedSettings && <AdvancedSettings cleanUp={() => setShowAdvancedSettings(false)} query={query} />}
        </>
      )}
    </Section>
  )
}
