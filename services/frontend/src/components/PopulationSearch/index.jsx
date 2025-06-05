import { Link } from 'react-router'
import { Button, Divider, Form, Header, Icon, Segment } from 'semantic-ui-react'

import { populationStatisticsToolTips } from '@/common/InfoToolTips'
import { hopsFilter } from '@/components/FilterView/filters'
import { useFilters } from '@/components/FilterView/useFilters'
import { InfoBox } from '@/components/InfoBox'
import { PopulationSearchForm } from './PopulationSearchForm'
import { PopulationSearchHistory } from './PopulationSearchHistory'

export const PopulationSearch = ({ query, skipQuery, isLoading, populationFound, combinedProgrammeCode }) => {
  const { filterDispatch, useFilterSelector } = useFilters()
  const onlyHopsCredit = useFilterSelector(hopsFilter.selectors.isActive)
  const combinedHopsSelected = useFilterSelector(hopsFilter.selectors.isCombinedSelected(combinedProgrammeCode))
  const bothHopsSelected = useFilterSelector(hopsFilter.selectors.isBothSelected(combinedProgrammeCode))

  return (
    <Segment>
      {skipQuery && <Header size="medium">{'Search for class'}</Header>}
      {!populationFound && (
        <>
          <InfoBox content={populationStatisticsToolTips.search} cypress="PopulationSearch" />
          <Divider />
        </>
      )}
      <PopulationSearchForm />
      {!skipQuery && !isLoading && (
        <Form>
          <Form.Field>
            <Link to="/populations">
              <Button color="blue" icon labelPosition="left">
                <Icon name="left arrow" />
                Search new class
              </Button>
            </Link>
          </Form.Field>
          <Form.Field>
            <Form.Radio
              checked={onlyHopsCredit && (bothHopsSelected || !combinedHopsSelected)}
              label={
                combinedProgrammeCode
                  ? 'Show only credits included in bachelor study plan'
                  : 'Show only credits included in study plan'
              }
              onClick={() => filterDispatch(hopsFilter.actions.toggle())}
              toggle
            />
          </Form.Field>
          {combinedProgrammeCode && (
            <Form.Field>
              <Form.Radio
                checked={combinedHopsSelected}
                label="Show only credits included in licentiate study plan"
                onClick={() => filterDispatch(hopsFilter.actions.toggleCombinedProgramme(combinedProgrammeCode))}
                toggle
              />
            </Form.Field>
          )}
          <PopulationSearchHistory query={query} />
        </Form>
      )}
    </Segment>
  )
}
