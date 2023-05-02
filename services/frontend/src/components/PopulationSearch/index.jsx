import React from 'react'
import { Segment, Header, Divider, Form, Button, Icon } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import useFilters from 'components/FilterView/useFilters'
import { hopsFilter } from 'components/FilterView/filters'
import Toggle from 'components/StudyProgramme/Toggle'
import PopulationSearchForm from './PopulationSearchForm'
import PopulationSearchHistory from './PopulationSearchHistory'
import ProgressBar from '../ProgressBar'
import InfoBox from '../Info/InfoBox'
import { useProgress } from '../../common/hooks'
import infotoolTips from '../../common/InfoToolTips'

const PopulationSearch = ({ populationFound, history, location, loading, unifiedProgramme }) => {
  const { onProgress, progress } = useProgress(loading)
  const { filterDispatch, useFilterSelector } = useFilters()

  const title = populationFound && history.location.search ? null : 'Search for class'
  const onlyHopsCredits = useFilterSelector(hopsFilter.selectors.isActive)

  return (
    <Segment>
      {title && <Header size="medium">{title}</Header>}
      {(!populationFound || !history.location.search) && (
        <>
          <InfoBox content={infotoolTips.PopulationStatistics.Search} cypress="PopulationSearch" />
          <Divider />
        </>
      )}
      <PopulationSearchForm onProgress={onProgress} />

      {location.search !== '' && !loading && (
        <Form>
          <Form.Field>
            <Link to="/populations">
              <Button icon labelPosition="left" color="blue">
                <Icon name="left arrow" />
                Search new class
              </Button>
            </Link>
          </Form.Field>
          <Form.Field>
            <Form.Radio
              toggle
              checked={onlyHopsCredits}
              onClick={() => {
                filterDispatch(hopsFilter.actions.toggle())
              }}
              label="Show only credits included in study plan"
            />
          </Form.Field>
          {unifiedProgramme && unifiedProgramme.combinedProgrammeCode && (
            <div className="toggle-container">
              <Toggle
                cypress="programmeToggle"
                firstLabel={`Filter by graduated and studyplan credits by ${unifiedProgramme.combinedProgrammeCode} `}
                secondLabel={unifiedProgramme.programmeCode}
                value={unifiedProgramme.filterByBachelor}
                setValue={unifiedProgramme.setFilterByBachelor}
              />
            </div>
          )}
          <PopulationSearchHistory history={history} />
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

export default connect(mapStateToProps)(PopulationSearch)
