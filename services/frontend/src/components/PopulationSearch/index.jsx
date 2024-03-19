import React from 'react'
import { connect } from 'react-redux'
import { Link, useHistory, useLocation } from 'react-router-dom'
import { Button, Divider, Form, Header, Icon, Segment } from 'semantic-ui-react'

import { useProgress } from '@/common/hooks'
import { populationStatisticsToolTips } from '@/common/InfoToolTips'
import { hopsFilter } from '@/components/FilterView/filters'
import { useFilters } from '@/components/FilterView/useFilters'
import { InfoBox } from '@/components/Info/InfoBox'
import { ProgressBar } from '@/components/ProgressBar'
import { ConnectedPopulationSearchForm as PopulationSearchForm } from './PopulationSearchForm'
import { ConnectedPopulationSearchHistory as PopulationSearchHistory } from './PopulationSearchHistory'

const PopulationSearch = ({ populationFound, loading, combinedProgrammeCode }) => {
  const history = useHistory()
  const location = useLocation()
  const { onProgress, progress } = useProgress(loading)
  const { filterDispatch, useFilterSelector } = useFilters()
  const onlyHopsCredit = useFilterSelector(hopsFilter.selectors.isActive)
  const combinedHopsSelected = useFilterSelector(hopsFilter.selectors.isCombinedSelected(combinedProgrammeCode))
  const bothHopsSelected = useFilterSelector(hopsFilter.selectors.isBothSelected(combinedProgrammeCode))
  const title = populationFound && history.location.search ? null : 'Search for class'

  return (
    <Segment>
      {title && <Header size="medium">{title}</Header>}
      {(!populationFound || !history.location.search) && (
        <>
          <InfoBox content={populationStatisticsToolTips.Search} cypress="PopulationSearch" />
          <Divider />
        </>
      )}
      <PopulationSearchForm onProgress={onProgress} />

      {location.search !== '' && !loading && (
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
              onClick={() => {
                filterDispatch(hopsFilter.actions.toggle())
              }}
              toggle
            />
          </Form.Field>
          {combinedProgrammeCode && (
            <Form.Field>
              <Form.Radio
                checked={combinedHopsSelected}
                label="Show only credits included in licentiate study plan"
                onClick={() => {
                  filterDispatch(hopsFilter.actions.toggleCombinedProgramme(combinedProgrammeCode))
                }}
                toggle
              />
            </Form.Field>
          )}
          <PopulationSearchHistory />
        </Form>
      )}
      <ProgressBar progress={progress} />
    </Segment>
  )
}

const mapStateToProps = ({ populations }) => ({
  populationFound: populations.data.students !== undefined,
  loading: !!populations.pending,
})

export const ConnectedPopulationSearch = connect(mapStateToProps)(PopulationSearch)
